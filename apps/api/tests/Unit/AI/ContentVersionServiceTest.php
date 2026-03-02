<?php

declare(strict_types=1);

use App\Models\AIContent;
use App\Models\AIContentVersion;
use App\Services\AI\ContentVersionService;

describe('ContentVersionService', function (): void {
    describe('incrementVersion', function (): void {
        it('increments minor version: 1.9 → 1.10', function (): void {
            $service = new ContentVersionService;
            expect($service->incrementVersion('1.9'))->toBe('1.10');
        });

        it('increments minor version: 1.0 → 1.1', function (): void {
            $service = new ContentVersionService;
            expect($service->incrementVersion('1.0'))->toBe('1.1');
        });

        it('coerces major 0 to 1: 0.0 → 1.1', function (): void {
            $service = new ContentVersionService;
            expect($service->incrementVersion('0.0'))->toBe('1.1');
        });

        it('preserves major version: 2.5 → 2.6', function (): void {
            $service = new ContentVersionService;
            expect($service->incrementVersion('2.5'))->toBe('2.6');
        });

        it('falls back to 1.0 for invalid format (no dots)', function (): void {
            $service = new ContentVersionService;
            expect($service->incrementVersion('invalid'))->toBe('1.0');
        });

        it('falls back to 1.0 for empty string', function (): void {
            $service = new ContentVersionService;
            expect($service->incrementVersion(''))->toBe('1.0');
        });
    });

    describe('createVersion', function (): void {
        it('creates a version for a content with design', function (): void {
            $content = AIContent::factory()->withDesign()->create();

            $service = new ContentVersionService;
            $version = $service->createVersion($content);

            expect($version)->toBeInstanceOf(AIContentVersion::class);
            expect($version->ai_content_id)->toBe($content->id);
            expect($version->version)->toBe('1.1');
            expect($version->widget_count)->toBe(1);
            expect($version->design)->toBeArray();
        });

        it('creates first version as 1.1 (starting from 0.0)', function (): void {
            $content = AIContent::factory()->withDesign()->create();

            $service = new ContentVersionService;
            $version = $service->createVersion($content);

            expect($version->version)->toBe('1.1');
        });

        it('creates successive versions incrementing correctly', function (): void {
            $content = AIContent::factory()->withDesign()->create();

            $service = new ContentVersionService;
            $v1 = $service->createVersion($content);
            $v2 = $service->createVersion($content);
            $v3 = $service->createVersion($content);

            expect($v1->version)->toBe('1.1');
            expect($v2->version)->toBe('1.2');
            expect($v3->version)->toBe('1.3');
        });

        it('counts widgets recursively including nested children', function (): void {
            $content = AIContent::factory()->create([
                'design' => [
                    'version' => '1.0',
                    'globalStyles' => [],
                    'widgets' => [
                        [
                            'id' => 'widget-1',
                            'type' => 'container',
                            'children' => [
                                ['id' => 'child-1', 'type' => 'text'],
                                [
                                    'id' => 'child-2',
                                    'type' => 'container',
                                    'children' => [
                                        ['id' => 'grandchild-1', 'type' => 'image'],
                                    ],
                                ],
                            ],
                        ],
                        ['id' => 'widget-2', 'type' => 'text'],
                    ],
                ],
            ]);

            $service = new ContentVersionService;
            $version = $service->createVersion($content);

            // 2 top-level + 2 children + 1 grandchild = 5
            expect($version->widget_count)->toBe(5);
        });
    });

    describe('purgeOldVersions', function (): void {
        it('does not purge when under MAX_VERSIONS', function (): void {
            $content = AIContent::factory()->withDesign()->create();

            $service = new ContentVersionService;
            foreach (range(1, 3) as $i) {
                $service->createVersion($content);
            }

            $deleted = $service->purgeOldVersions($content->id);

            expect($deleted)->toBe(0);
            expect(AIContentVersion::where('ai_content_id', $content->id)->count())->toBe(3);
        });

        it('purges oldest versions when over MAX_VERSIONS', function (): void {
            $content = AIContent::factory()->withDesign()->create();

            $service = new ContentVersionService;
            foreach (range(1, 52) as $i) {
                $service->createVersion($content);
            }

            // After 52 creates, purgeOldVersions is called each time,
            // so after the last create only MAX_VERSIONS (50) remain.
            // We need to trigger it explicitly to test the purge behavior.
            // Reset: delete all and create 52 without purging in between.
            AIContentVersion::where('ai_content_id', $content->id)->delete();

            for ($i = 1; $i <= 52; $i++) {
                AIContentVersion::create([
                    'ai_content_id' => $content->id,
                    'version' => "1.{$i}",
                    'design' => $content->design ?? [],
                    'widget_count' => 1,
                ]);
            }

            expect(AIContentVersion::where('ai_content_id', $content->id)->count())->toBe(52);

            $deleted = $service->purgeOldVersions($content->id);

            expect($deleted)->toBe(2);
            expect(AIContentVersion::where('ai_content_id', $content->id)->count())->toBe(50);
        });

        it('purges with custom keep value', function (): void {
            $content = AIContent::factory()->withDesign()->create();

            AIContentVersion::where('ai_content_id', $content->id)->delete();
            for ($i = 1; $i <= 5; $i++) {
                AIContentVersion::create([
                    'ai_content_id' => $content->id,
                    'version' => "1.{$i}",
                    'design' => $content->design ?? [],
                    'widget_count' => 1,
                ]);
            }

            $service = new ContentVersionService;
            $deleted = $service->purgeOldVersions($content->id, keep: 2);

            expect($deleted)->toBe(3);
            expect(AIContentVersion::where('ai_content_id', $content->id)->count())->toBe(2);
        });
    });

    describe('restoreVersion', function (): void {
        it('restores version by updating content design and creating a new version', function (): void {
            $originalDesign = [
                'version' => '1.0',
                'globalStyles' => [],
                'widgets' => [
                    ['id' => 'widget-1', 'type' => 'text', 'content' => 'Original'],
                ],
            ];

            $newDesign = [
                'version' => '1.0',
                'globalStyles' => [],
                'widgets' => [
                    ['id' => 'widget-1', 'type' => 'text', 'content' => 'Modified'],
                    ['id' => 'widget-2', 'type' => 'image'],
                ],
            ];

            $content = AIContent::factory()->create(['design' => $newDesign]);

            $oldVersion = AIContentVersion::create([
                'ai_content_id' => $content->id,
                'version' => '1.1',
                'design' => $originalDesign,
                'widget_count' => 1,
            ]);

            $service = new ContentVersionService;
            $service->restoreVersion($content, $oldVersion);

            $content->refresh();
            expect($content->design)->toEqual($originalDesign);
        });

        it('creates a new version after restoring', function (): void {
            $originalDesign = [
                'version' => '1.0',
                'globalStyles' => [],
                'widgets' => [
                    ['id' => 'widget-1', 'type' => 'text', 'content' => 'Original'],
                ],
            ];

            $content = AIContent::factory()->create(['design' => ['version' => '1.0', 'widgets' => []]]);

            $oldVersion = AIContentVersion::create([
                'ai_content_id' => $content->id,
                'version' => '1.1',
                'design' => $originalDesign,
                'widget_count' => 1,
            ]);

            $countBefore = AIContentVersion::where('ai_content_id', $content->id)->count();

            $service = new ContentVersionService;
            $service->restoreVersion($content, $oldVersion);

            $countAfter = AIContentVersion::where('ai_content_id', $content->id)->count();
            expect($countAfter)->toBe($countBefore + 1);
        });
    });
});
