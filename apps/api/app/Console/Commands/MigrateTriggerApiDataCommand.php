<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Campaign;
use App\Models\CampaignLog;
use App\Models\CampaignRequestData;
use App\Models\DeliveryReport;
use App\Models\LogActivity;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateTriggerApiDataCommand extends Command
{
    /** @var string */
    protected $signature = 'app:migrate-trigger-api-data
        {--source-mysql=trigger-api : Source MySQL connection name}
        {--source-mongo=mongodb : Source MongoDB connection name}
        {--dry-run : Show counts without migrating}
        {--skip-reports : Skip delivery reports migration}
        {--skip-logs : Skip campaign logs and log activities migration}';

    /** @var string */
    protected $description = 'Migrate data from trigger-api (MySQL + MongoDB) to platform-api (PostgreSQL)';

    private const CHUNK_SIZE = 500;

    /** @var array<string, int> */
    private array $stats = [
        'delivery_reports_sinch' => 0,
        'delivery_reports_infobip' => 0,
        'delivery_reports_highconnexion' => 0,
        'campaign_logs' => 0,
        'campaign_logs_skipped' => 0,
        'log_activities' => 0,
        'campaign_request_data' => 0,
        'campaign_request_data_skipped' => 0,
    ];

    public function handle(): int
    {
        $sourceMysql = (string) $this->option('source-mysql');
        $sourceMongo = (string) $this->option('source-mongo');
        $isDryRun = (bool) $this->option('dry-run');
        $skipReports = (bool) $this->option('skip-reports');
        $skipLogs = (bool) $this->option('skip-logs');

        $this->info('=== Trigger-API Data Migration ===');
        $this->newLine();

        // Validate connections
        if (! $this->validateConnections($sourceMysql, $sourceMongo, $skipReports, $skipLogs)) {
            return self::FAILURE;
        }

        if ($isDryRun) {
            return $this->dryRun($sourceMysql, $sourceMongo, $skipReports, $skipLogs);
        }

        // Build campaign ID mapping (trigger-api external_id → platform-api id)
        $campaignIdMap = $this->buildCampaignIdMap();
        $this->info(sprintf('Campaign ID mapping built: %d campaigns found.', count($campaignIdMap)));
        $this->newLine();

        if (! $skipReports) {
            $this->migrateDeliveryReports($sourceMongo, 'sinch_reports', 'sinch');
            $this->migrateDeliveryReports($sourceMongo, 'infobip_reports', 'infobip');
            $this->migrateDeliveryReports($sourceMongo, 'high_connexion_reports', 'highconnexion');
        }

        if (! $skipLogs) {
            $this->migrateCampaignLogs($sourceMongo, $campaignIdMap);
            $this->migrateLogActivities($sourceMysql);
        }

        $this->migrateCampaignRequestData($sourceMysql, $campaignIdMap);

        $this->displaySummary();

        return self::SUCCESS;
    }

    private function validateConnections(string $sourceMysql, string $sourceMongo, bool $skipReports, bool $skipLogs): bool
    {
        // Validate MySQL connection
        try {
            DB::connection($sourceMysql)->getPdo();
            $this->info("✓ MySQL connection '{$sourceMysql}' OK");
        } catch (\Exception $e) {
            $this->error("Cannot connect to MySQL '{$sourceMysql}': {$e->getMessage()}");

            return false;
        }

        // Validate MongoDB connection (only if needed)
        if (! $skipReports || ! $skipLogs) {
            try {
                DB::connection($sourceMongo)->getMongoClient();
                $this->info("✓ MongoDB connection '{$sourceMongo}' OK");
            } catch (\Exception $e) {
                $this->error("Cannot connect to MongoDB '{$sourceMongo}': {$e->getMessage()}");

                return false;
            }
        }

        $this->newLine();

        return true;
    }

    private function dryRun(string $sourceMysql, string $sourceMongo, bool $skipReports, bool $skipLogs): int
    {
        $this->info('[DRY RUN] Source counts:');
        $this->newLine();

        $rows = [];

        if (! $skipReports) {
            try {
                $rows[] = ['SinchReport (MongoDB)', $this->getMongoCount($sourceMongo, 'sinch_reports')];
                $rows[] = ['InfobipReport (MongoDB)', $this->getMongoCount($sourceMongo, 'infobip_reports')];
                $rows[] = ['HighConnexionReport (MongoDB)', $this->getMongoCount($sourceMongo, 'high_connexion_reports')];
            } catch (\Exception $e) {
                $this->warn("Could not count MongoDB collections: {$e->getMessage()}");
            }
        }

        if (! $skipLogs) {
            try {
                $rows[] = ['CampaignLog (MongoDB)', $this->getMongoCount($sourceMongo, 'campaign_logs')];
            } catch (\Exception $e) {
                $this->warn("Could not count MongoDB campaign_logs: {$e->getMessage()}");
            }

            try {
                $rows[] = ['LogActivity (MySQL)', DB::connection($sourceMysql)->table('log_activities')->count()];
            } catch (\Exception $e) {
                $this->warn("Could not count log_activities: {$e->getMessage()}");
            }
        }

        try {
            $rows[] = ['CampaignRequestData (MySQL)', DB::connection($sourceMysql)->table('campaign_request_data')->count()];
        } catch (\Exception $e) {
            $this->warn("Could not count campaign_request_data: {$e->getMessage()}");
        }

        $this->table(['Source Table', 'Count'], $rows);

        $this->newLine();
        $this->info('Destination counts (current):');

        $destRows = [
            ['delivery_reports', DeliveryReport::count()],
            ['campaign_logs', CampaignLog::count()],
            ['log_activities', LogActivity::count()],
            ['campaign_request_data', CampaignRequestData::count()],
        ];

        $this->table(['Destination Table', 'Count'], $destRows);

        return self::SUCCESS;
    }

    private function getMongoCount(string $connection, string $collection): int
    {
        return DB::connection($connection)->collection($collection)->count();
    }

    /**
     * Build a mapping from trigger-api campaign ID (stored as external_id) to platform-api campaign ID.
     *
     * @return array<int, int> trigger-api ID => platform-api ID
     */
    private function buildCampaignIdMap(): array
    {
        return Campaign::whereNotNull('external_id')
            ->pluck('id', 'external_id')
            ->mapWithKeys(fn (int $id, string $externalId) => [(int) $externalId => $id])
            ->all();
    }

    private function migrateDeliveryReports(string $sourceMongo, string $collection, string $provider): void
    {
        $this->info("Migrating delivery reports from {$collection} (provider={$provider})...");

        $total = $this->getMongoCount($sourceMongo, $collection);

        if ($total === 0) {
            $this->info('  No documents found. Skipping.');
            $this->newLine();

            return;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $statsKey = "delivery_reports_{$provider}";
        $migrated = 0;

        DB::connection($sourceMongo)
            ->collection($collection)
            ->orderBy('_id')
            ->chunk(self::CHUNK_SIZE, function ($documents) use ($provider, &$migrated, $bar) {
                $inserts = [];

                foreach ($documents as $doc) {
                    $inserts[] = [
                        'provider' => $provider,
                        'report' => json_encode($doc['report'] ?? []),
                        'digested' => (bool) ($doc['digest'] ?? false),
                        'created_at' => $doc['created_at'] ?? now(),
                    ];
                    $bar->advance();
                }

                if ($inserts !== []) {
                    DeliveryReport::insert($inserts);
                    $migrated += count($inserts);
                }
            });

        $bar->finish();
        $this->newLine();
        $this->stats[$statsKey] = $migrated;
        $this->info("  Migrated: {$migrated}");
        $this->newLine();
    }

    /**
     * @param array<int, int> $campaignIdMap
     */
    private function migrateCampaignLogs(string $sourceMongo, array $campaignIdMap): void
    {
        $this->info('Migrating campaign logs from MongoDB...');

        $total = $this->getMongoCount($sourceMongo, 'campaign_logs');

        if ($total === 0) {
            $this->info('  No documents found. Skipping.');
            $this->newLine();

            return;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $migrated = 0;
        $skipped = 0;

        DB::connection($sourceMongo)
            ->collection('campaign_logs')
            ->orderBy('_id')
            ->chunk(self::CHUNK_SIZE, function ($documents) use ($campaignIdMap, &$migrated, &$skipped, $bar) {
                $inserts = [];

                foreach ($documents as $doc) {
                    $campaignId = $this->extractCampaignId($doc, $campaignIdMap);

                    if ($campaignId === null) {
                        $skipped++;
                        $bar->advance();

                        continue;
                    }

                    // Store the entire document as data
                    $data = collect($doc)->except(['_id'])->all();

                    $inserts[] = [
                        'campaign_id' => $campaignId,
                        'data' => json_encode($data),
                        'created_at' => $doc['timestamp'] ?? $doc['created_at'] ?? now(),
                    ];

                    $bar->advance();
                }

                if ($inserts !== []) {
                    CampaignLog::insert($inserts);
                    $migrated += count($inserts);
                }
            });

        $bar->finish();
        $this->newLine();
        $this->stats['campaign_logs'] = $migrated;
        $this->stats['campaign_logs_skipped'] = $skipped;
        $this->info("  Migrated: {$migrated}, Skipped (no campaign match): {$skipped}");
        $this->newLine();
    }

    /**
     * Extract campaign_id from a MongoDB campaign log document.
     * Maps trigger-api campaign ID to platform-api campaign ID using the external_id mapping.
     *
     * @param array<string, mixed>|object $doc
     * @param array<int, int> $campaignIdMap
     */
    private function extractCampaignId(array|object $doc, array $campaignIdMap): ?int
    {
        $doc = (array) $doc;

        $modelType = $doc['model_type'] ?? null;
        $modelId = $doc['model_id'] ?? null;

        if ($modelId === null) {
            return null;
        }

        // If model_type is present and NOT Campaign-related, skip this document
        if ($modelType !== null && ! str_contains((string) $modelType, 'Campaign')) {
            return null;
        }

        // model_type is null (assume campaign) or contains 'Campaign' — map the ID
        return $campaignIdMap[(int) $modelId] ?? null;
    }

    private function migrateLogActivities(string $sourceMysql): void
    {
        $this->info('Migrating log activities from MySQL...');

        $total = DB::connection($sourceMysql)->table('log_activities')->count();

        if ($total === 0) {
            $this->info('  No records found. Skipping.');
            $this->newLine();

            return;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $migrated = 0;

        DB::connection($sourceMysql)
            ->table('log_activities')
            ->orderBy('id')
            ->chunk(self::CHUNK_SIZE, function ($rows) use (&$migrated, $bar) {
                $inserts = [];

                foreach ($rows as $row) {
                    $inserts[] = [
                        'event' => $row->event ?? 'unknown',
                        'model_type' => $row->model_type ?? null,
                        'model_id' => $row->model_id ?? null,
                        'old_values' => $row->old_values ?? null,
                        'new_values' => $row->new_values ?? null,
                        'created_at' => $row->created_at ?? now(),
                    ];
                    $bar->advance();
                }

                if ($inserts !== []) {
                    LogActivity::insert($inserts);
                    $migrated += count($inserts);
                }
            });

        $bar->finish();
        $this->newLine();
        $this->stats['log_activities'] = $migrated;
        $this->info("  Migrated: {$migrated}");
        $this->newLine();
    }

    /**
     * @param array<int, int> $campaignIdMap
     */
    private function migrateCampaignRequestData(string $sourceMysql, array $campaignIdMap): void
    {
        $this->info('Migrating campaign request data from MySQL...');

        $total = DB::connection($sourceMysql)->table('campaign_request_data')->count();

        if ($total === 0) {
            $this->info('  No records found. Skipping.');
            $this->newLine();

            return;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $migrated = 0;
        $skipped = 0;

        DB::connection($sourceMysql)
            ->table('campaign_request_data')
            ->orderBy('id')
            ->chunk(self::CHUNK_SIZE, function ($rows) use ($campaignIdMap, &$migrated, &$skipped, $bar) {
                $inserts = [];

                foreach ($rows as $row) {
                    $triggerCampaignId = (int) $row->campaign_id;
                    $platformCampaignId = $campaignIdMap[$triggerCampaignId] ?? null;

                    if ($platformCampaignId === null) {
                        $this->warn("  Warning: No platform campaign found for trigger-api campaign_id={$triggerCampaignId}. Skipping.");
                        $skipped++;
                        $bar->advance();

                        continue;
                    }

                    $inserts[] = [
                        'campaign_id' => $platformCampaignId,
                        'data' => $row->data,
                        'created_at' => $row->created_at ?? now(),
                    ];

                    $bar->advance();
                }

                if ($inserts !== []) {
                    CampaignRequestData::insert($inserts);
                    $migrated += count($inserts);
                }
            });

        $bar->finish();
        $this->newLine();
        $this->stats['campaign_request_data'] = $migrated;
        $this->stats['campaign_request_data_skipped'] = $skipped;
        $this->info("  Migrated: {$migrated}, Skipped (no campaign match): {$skipped}");
        $this->newLine();
    }

    private function displaySummary(): void
    {
        $this->newLine();
        $this->info('=== Migration Summary ===');

        $rows = [
            ['DeliveryReport (sinch)', $this->stats['delivery_reports_sinch']],
            ['DeliveryReport (infobip)', $this->stats['delivery_reports_infobip']],
            ['DeliveryReport (highconnexion)', $this->stats['delivery_reports_highconnexion']],
            ['CampaignLog', $this->stats['campaign_logs'], $this->stats['campaign_logs_skipped'] . ' skipped'],
            ['LogActivity', $this->stats['log_activities']],
            ['CampaignRequestData', $this->stats['campaign_request_data'], $this->stats['campaign_request_data_skipped'] . ' skipped'],
        ];

        $this->table(['Table', 'Migrated', 'Notes'], array_map(
            fn (array $row) => [$row[0], $row[1], $row[2] ?? ''],
            $rows
        ));

        $totalMigrated = $this->stats['delivery_reports_sinch']
            + $this->stats['delivery_reports_infobip']
            + $this->stats['delivery_reports_highconnexion']
            + $this->stats['campaign_logs']
            + $this->stats['log_activities']
            + $this->stats['campaign_request_data'];

        $this->info("Total records migrated: {$totalMigrated}");
    }
}
