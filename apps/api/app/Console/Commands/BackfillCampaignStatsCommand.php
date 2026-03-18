<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\CampaignRecipientStatus;
use App\Enums\CampaignStatus;
use App\Models\Campaign;
use Illuminate\Console\Command;

class BackfillCampaignStatsCommand extends Command
{
    /** @var string */
    protected $signature = 'app:backfill-campaign-stats
        {--campaign=* : Limit backfill to one or more campaign IDs}
        {--dry-run : Preview updates without persisting them}';

    /** @var string */
    protected $description = 'Recompute locally derived campaign stats fields for migrated sent campaigns';

    public function handle(): int
    {
        $campaignIds = array_values(array_filter(
            array_map('intval', (array) $this->option('campaign')),
            static fn (int $id): bool => $id > 0,
        ));
        $isDryRun = (bool) $this->option('dry-run');

        $query = Campaign::query()
            ->where('status', CampaignStatus::SENT)
            ->withCount([
                'campaignRecipients as local_sent_count' => fn ($recipientQuery) => $recipientQuery
                    ->where('status', '!=', CampaignRecipientStatus::Queued->value),
            ])
            ->orderBy('id');

        if ($campaignIds !== []) {
            $query->whereIn('id', $campaignIds);
        }

        $scanned = 0;
        $updated = 0;

        $query->each(function (Campaign $campaign) use (&$scanned, &$updated, $isDryRun): void {
            $scanned++;

            $localSentCount = (int) ($campaign->local_sent_count ?? 0);
            $currentVolumeSent = (int) ($campaign->volume_sent ?? 0);

            if ($currentVolumeSent === $localSentCount) {
                return;
            }

            $updated++;

            if ($isDryRun) {
                $this->line(sprintf(
                    'Would update campaign #%d volume_sent: %d -> %d',
                    $campaign->id,
                    $currentVolumeSent,
                    $localSentCount,
                ));

                return;
            }

            $campaign->forceFill(['volume_sent' => $localSentCount])->save();
        });

        $summary = sprintf(
            'Scanned %d sent campaign(s); %s %d campaign(s).',
            $scanned,
            $isDryRun ? 'would update' : 'updated',
            $updated,
        );

        $this->info($summary);

        return self::SUCCESS;
    }
}
