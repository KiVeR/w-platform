<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\ContentStatus;
use App\Enums\ContentType;
use App\Models\AIContent;
use App\Models\AIContentVersion;
use App\Models\AIUsage;
use App\Models\User;
use App\Models\VariableSchema;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class MigrateKreoDataCommand extends Command
{
    protected $signature = 'app:migrate-kreo-data
                            {--dry-run : Preview counts without inserting any data}';

    protected $description = 'One-shot migration of kreo (Prisma/PostgreSQL) data into platform-api';

    /**
     * @var array<int,array{platform_user_id:int,partner_id:int|null}>
     */
    private array $userMap = [];

    /**
     * @var array<int,int> kreo content_id => platform ai_content_id
     */
    private array $contentMap = [];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        if ($dryRun) {
            $this->warn('DRY-RUN mode — no data will be written.');
        }

        $kreoDb = DB::connection('kreo');

        // ----------------------------------------------------------------
        // Step 1 — Build user map (kreo user_id → platform user)
        // ----------------------------------------------------------------
        $this->info('Step 1/4 — Building user map…');

        $kreoUsers = $kreoDb->table('users')
            ->select('id', 'email')
            ->where('isActive', true)
            ->get();

        $unmappedUsers = 0;

        foreach ($kreoUsers as $kreoUser) {
            $platformUser = User::where('email', $kreoUser->email)->first();

            if ($platformUser === null) {
                $this->warn("  User not found in platform: {$kreoUser->email} (kreo id={$kreoUser->id}) — skipped.");
                $unmappedUsers++;
                continue;
            }

            $partnerId = $platformUser->partner_id ?? null;

            $this->userMap[$kreoUser->id] = [
                'platform_user_id' => $platformUser->id,
                'partner_id' => $partnerId,
            ];
        }

        $this->info(sprintf(
            '  Mapped %d/%d kreo users (%d skipped).',
            count($this->userMap),
            $kreoUsers->count(),
            $unmappedUsers,
        ));

        // ----------------------------------------------------------------
        // Step 2 — Migrate contents + landing_page_data → ai_contents
        // ----------------------------------------------------------------
        $this->info('Step 2/4 — Migrating contents → ai_contents…');

        $kreoContents = $kreoDb->table('contents as c')
            ->leftJoin('landing_page_data as lpd', 'lpd.contentId', '=', 'c.id')
            ->select(
                'c.id',
                'c.type',
                'c.ownerId',
                'c.title',
                'c.status',
                'c.isFavorite',
                'c.variableSchemaUuid',
                'c.createdAt',
                'c.updatedAt',
                'c.deletedAt',
                'lpd.design',
            )
            ->whereNull('c.deletedAt')
            ->get();

        $skippedContents = 0;
        $insertedContents = 0;

        if (!$dryRun) {
            DB::transaction(function () use ($kreoContents, &$skippedContents, &$insertedContents): void {
                foreach ($kreoContents as $row) {
                    if (!isset($this->userMap[$row->ownerId])) {
                        $skippedContents++;
                        continue;
                    }

                    $userEntry = $this->userMap[$row->ownerId];
                    $variableSchemaId = null;

                    if ($row->variableSchemaUuid !== null) {
                        $vs = VariableSchema::where('uuid', $row->variableSchemaUuid)->first();
                        $variableSchemaId = $vs?->id;
                    }

                    $design = $row->design !== null ? json_decode($row->design, true) : null;

                    $content = AIContent::create([
                        'user_id' => $userEntry['platform_user_id'],
                        'partner_id' => $userEntry['partner_id'],
                        'type' => $this->mapContentType($row->type),
                        'title' => $row->title,
                        'status' => $this->mapContentStatus($row->status),
                        'is_favorite' => (bool) $row->isFavorite,
                        'design' => $design,
                        'variable_schema_id' => $variableSchemaId,
                    ]);

                    // Preserve original timestamps
                    $content->timestamps = false;
                    $content->forceFill([
                        'created_at' => $row->createdAt,
                        'updated_at' => $row->updatedAt,
                    ])->save();

                    $this->contentMap[$row->id] = $content->id;
                    $insertedContents++;
                }
            });
        } else {
            foreach ($kreoContents as $row) {
                if (!isset($this->userMap[$row->ownerId])) {
                    $skippedContents++;
                } else {
                    $insertedContents++;
                    // Populate contentMap with placeholder for dry-run stats
                    $this->contentMap[$row->id] = 0;
                }
            }
        }

        $this->info(sprintf(
            '  Contents: %d inserted, %d skipped (user not mapped).',
            $insertedContents,
            $skippedContents,
        ));

        // ----------------------------------------------------------------
        // Step 3 — Migrate content_design_versions → ai_content_versions
        // ----------------------------------------------------------------
        $this->info('Step 3/4 — Migrating content_design_versions → ai_content_versions…');

        // Join through landing_page_data to get the content_id
        $kreoVersions = $kreoDb->table('content_design_versions as cdv')
            ->join('landing_page_data as lpd', 'lpd.id', '=', 'cdv.landingPageDataId')
            ->join('contents as c', 'c.id', '=', 'lpd.contentId')
            ->select(
                'cdv.id',
                'c.id as content_id',
                'cdv.version',
                'cdv.design',
                'cdv.widgetCount',
                'cdv.createdAt',
            )
            ->whereNull('c.deletedAt')
            ->get();

        $skippedVersions = 0;
        $insertedVersions = 0;

        if (!$dryRun) {
            DB::transaction(function () use ($kreoVersions, &$skippedVersions, &$insertedVersions): void {
                foreach ($kreoVersions as $row) {
                    if (!isset($this->contentMap[$row->content_id])) {
                        $skippedVersions++;
                        continue;
                    }

                    $aiContentId = $this->contentMap[$row->content_id];
                    $design = $row->design !== null ? json_decode($row->design, true) : null;

                    $version = AIContentVersion::create([
                        'ai_content_id' => $aiContentId,
                        'version' => $row->version,
                        'design' => $design,
                        'widget_count' => (int) $row->widgetCount,
                    ]);

                    // Preserve original created_at
                    $version->timestamps = false;
                    $version->forceFill(['created_at' => $row->createdAt])->save();

                    $insertedVersions++;
                }
            });
        } else {
            foreach ($kreoVersions as $row) {
                if (!isset($this->contentMap[$row->content_id])) {
                    $skippedVersions++;
                } else {
                    $insertedVersions++;
                }
            }
        }

        $this->info(sprintf(
            '  Versions: %d inserted, %d skipped (content not mapped).',
            $insertedVersions,
            $skippedVersions,
        ));

        // ----------------------------------------------------------------
        // Step 4 — Migrate ai_usage
        // ----------------------------------------------------------------
        $this->info('Step 4/4 — Migrating ai_usage…');

        $kreoAiUsage = $kreoDb->table('ai_usage')->get();

        $skippedUsage = 0;
        $insertedUsage = 0;

        if (!$dryRun) {
            DB::transaction(function () use ($kreoAiUsage, &$skippedUsage, &$insertedUsage): void {
                foreach ($kreoAiUsage as $row) {
                    if (!isset($this->userMap[$row->userId])) {
                        $skippedUsage++;
                        continue;
                    }

                    $platformUserId = $this->userMap[$row->userId]['platform_user_id'];

                    AIUsage::updateOrCreate(
                        [
                            'user_id' => $platformUserId,
                            'period_key' => $row->periodKey,
                        ],
                        [
                            'count' => (int) $row->count,
                            'last_generated_at' => $row->lastGeneratedAt,
                        ],
                    );

                    $insertedUsage++;
                }
            });
        } else {
            foreach ($kreoAiUsage as $row) {
                if (!isset($this->userMap[$row->userId])) {
                    $skippedUsage++;
                } else {
                    $insertedUsage++;
                }
            }
        }

        $this->info(sprintf(
            '  AI Usage: %d upserted, %d skipped (user not mapped).',
            $insertedUsage,
            $skippedUsage,
        ));

        // ----------------------------------------------------------------
        // Summary
        // ----------------------------------------------------------------
        $this->newLine();
        $this->info('=== Migration summary ===');
        $this->table(
            ['Entity', 'Source (kreo)', 'Destination (platform)', 'Skipped'],
            [
                [
                    'ai_contents',
                    $kreoContents->count(),
                    $dryRun ? "(dry-run) {$insertedContents}" : AIContent::count(),
                    $skippedContents,
                ],
                [
                    'ai_content_versions',
                    $kreoVersions->count(),
                    $dryRun ? "(dry-run) {$insertedVersions}" : AIContentVersion::count(),
                    $skippedVersions,
                ],
                [
                    'ai_usage',
                    $kreoAiUsage->count(),
                    $dryRun ? "(dry-run) {$insertedUsage}" : AIUsage::count(),
                    $skippedUsage,
                ],
            ],
        );

        if ($dryRun) {
            $this->warn('DRY-RUN complete — no data was written.');
        } else {
            $this->info('Migration complete.');
        }

        return self::SUCCESS;
    }

    private function mapContentType(string $kreoType): ContentType
    {
        return match (strtolower($kreoType)) {
            'landing_page' => ContentType::LANDING_PAGE,
            'rcs' => ContentType::RCS,
            'sms' => ContentType::SMS,
            default => ContentType::LANDING_PAGE,
        };
    }

    private function mapContentStatus(string $kreoStatus): ContentStatus
    {
        return match (strtolower($kreoStatus)) {
            'published' => ContentStatus::PUBLISHED,
            'archived' => ContentStatus::ARCHIVED,
            default => ContentStatus::DRAFT,
        };
    }
}
