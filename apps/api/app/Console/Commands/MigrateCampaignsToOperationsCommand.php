<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\BillingStatus;
use App\Enums\CampaignStatus;
use App\Enums\CampaignType;
use App\Enums\LifecycleStatus;
use App\Enums\OperationType;
use App\Models\Campaign;
use App\Models\Demande;
use App\Models\Operation;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Backfills historical campaigns into the Demande → Operation model.
 *
 * Compatibility with SelfServiceOrchestrator:
 * - The orchestrator sets `operation_id` on new campaigns via its Observer hook.
 * - Historical campaigns already processed by the orchestrator already have `operation_id` set.
 * - This command is idempotent: it skips any campaign where `operation_id IS NOT NULL`.
 * - COMPTAGE campaigns are never migrated (they are estimate-only, not delivery operations).
 * - All grouped campaigns for a given partner share a single migrated Demande
 *   (identified by partner_id + information = 'Migrated from historical campaigns').
 */
class MigrateCampaignsToOperationsCommand extends Command
{
    /** @var string */
    protected $signature = 'campaigns:migrate-to-operations
        {--dry-run : Preview without writing}
        {--batch-size=100 : Records per chunk}
        {--campaign= : Migrate a single campaign ID}
        {--partner= : Migrate only campaigns for this partner ID}';

    /** @var string */
    protected $description = 'Backfill existing campaigns into Demande + Operation model';

    private int $migrated = 0;
    private int $skipped = 0;
    private int $errors = 0;
    private int $comptageSkipped = 0;

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $batchSize = (int) $this->option('batch-size');

        $this->info($dryRun ? 'DRY RUN — no data will be written' : 'Starting migration...');

        $query = Campaign::query()
            ->whereNull('operation_id')
            ->where('type', '!=', CampaignType::COMPTAGE->value)
            ->whereNotNull('partner_id');

        if ($this->option('campaign')) {
            $query->where('id', (int) $this->option('campaign'));
        }

        if ($this->option('partner')) {
            $query->where('partner_id', (int) $this->option('partner'));
        }

        $total = $query->count();
        $this->info("Found {$total} campaigns to migrate");

        // Count skipped comptage campaigns (informational only)
        $comptageQuery = Campaign::query()
            ->whereNull('operation_id')
            ->where('type', CampaignType::COMPTAGE->value);

        if ($this->option('partner')) {
            $comptageQuery->where('partner_id', (int) $this->option('partner'));
        }

        $this->comptageSkipped = $comptageQuery->count();

        if ($this->comptageSkipped > 0) {
            $this->info("Skipping {$this->comptageSkipped} comptage campaigns (estimation only)");
        }

        if ($total === 0) {
            $this->info('Nothing to migrate.');

            return self::SUCCESS;
        }

        $query->chunkById($batchSize, function ($campaigns) use ($dryRun): void {
            foreach ($campaigns as $campaign) {
                $this->migrateCampaign($campaign, $dryRun);
            }
        });

        $this->newLine();
        $this->table(
            ['Metric', 'Count'],
            [
                ['Migrated', $this->migrated],
                ['Skipped (already linked)', $this->skipped],
                ['Skipped (comptage)', $this->comptageSkipped],
                ['Errors', $this->errors],
            ]
        );

        return $this->errors > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function migrateCampaign(Campaign $campaign, bool $dryRun): void
    {
        // Double-check idempotence (e.g. if operation_id was set between query and chunk iteration)
        if ($campaign->operation_id !== null) {
            $this->skipped++;

            return;
        }

        if ($dryRun) {
            $this->line("  [DRY] Would migrate campaign #{$campaign->id} ({$campaign->type->value})");
            $this->migrated++;

            return;
        }

        try {
            DB::transaction(function () use ($campaign): void {
                $demande = $this->findOrCreateDemande($campaign);
                $operationType = $this->mapType($campaign);
                $lifecycleStatus = $this->mapStatus($campaign);

                $operation = Operation::create([
                    'demande_id'       => $demande->id,
                    'type'             => $operationType,
                    'name'             => $campaign->name ?? 'Migrated campaign',
                    'lifecycle_status' => $lifecycleStatus,
                    'targeting'        => $campaign->targeting,
                    'volume_estimated' => $campaign->volume_estimated,
                    'volume_sent'      => $campaign->volume_sent,
                    'unit_price'       => $campaign->unit_price,
                    'total_price'      => $campaign->total_price,
                    'message'          => $campaign->message,
                    'sender'           => $campaign->sender,
                    'scheduled_at'     => $campaign->scheduled_at,
                    'delivered_at'     => $campaign->sent_at,
                ]);

                // Set billing to prepaid if campaign was sent (credits already deducted)
                if (in_array($lifecycleStatus->value, ['delivered', 'completed'], true)) {
                    $operation->update(['billing_status' => BillingStatus::PREPAID->value]);
                }

                // Update campaign without firing observers (avoids re-triggering SelfServiceOrchestrator)
                Campaign::withoutEvents(function () use ($campaign, $operation): void {
                    $campaign->update(['operation_id' => $operation->id]);
                });
            });

            $this->migrated++;
        } catch (\Throwable $e) {
            $this->error("  Error migrating campaign #{$campaign->id}: {$e->getMessage()}");
            Log::error('Campaign migration failed', [
                'campaign_id' => $campaign->id,
                'error'       => $e->getMessage(),
            ]);
            $this->errors++;
        }
    }

    private function findOrCreateDemande(Campaign $campaign): Demande
    {
        return Demande::firstOrCreate(
            [
                'partner_id'  => $campaign->partner_id,
                'information' => 'Migrated from historical campaigns',
            ],
            [
                'is_exoneration' => false,
                'pays_id'        => 'FR',
            ]
        );
    }

    private function mapType(Campaign $campaign): OperationType
    {
        return match ($campaign->type) {
            CampaignType::PROSPECTION  => OperationType::LOC,
            CampaignType::FIDELISATION => OperationType::FID,
            CampaignType::COMPTAGE     => throw new \LogicException('COMPTAGE should be excluded before mapType()'),
        };
    }

    private function mapStatus(Campaign $campaign): LifecycleStatus
    {
        return match ($campaign->status) {
            CampaignStatus::DRAFT      => LifecycleStatus::DRAFT,
            CampaignStatus::SCHEDULED  => LifecycleStatus::SCHEDULED,
            CampaignStatus::SENDING    => LifecycleStatus::PROCESSING,
            CampaignStatus::SENT       => LifecycleStatus::DELIVERED,
            CampaignStatus::CANCELLED  => LifecycleStatus::CANCELLED,
            CampaignStatus::FAILED     => LifecycleStatus::CANCELLED,
        };
    }
}
