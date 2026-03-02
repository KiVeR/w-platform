<?php

declare(strict_types=1);

use App\Models\AIContent;
use App\Models\AIContentVersion;
use App\Models\Partner;
use App\Models\User;
use App\Services\AI\ContentVersionService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// =============================================================================
// ContentVersionService — unit-level
// =============================================================================

it('incrementVersion increments minor part correctly', function (): void {
    $service = app(ContentVersionService::class);

    // "0.0": major=0 (falsy) → coerced to 1, minor=0+1=1 → "1.1" (mirrors TS `|| 1`)
    expect($service->incrementVersion('0.0'))->toBe('1.1');
    expect($service->incrementVersion('1.0'))->toBe('1.1');
    expect($service->incrementVersion('1.9'))->toBe('1.10');
    expect($service->incrementVersion('1.10'))->toBe('1.11');
    expect($service->incrementVersion('2.99'))->toBe('2.100');
    expect($service->incrementVersion('invalid'))->toBe('1.0');
});

it('createVersion creates a snapshot with correct version number', function (): void {
    $service = app(ContentVersionService::class);

    $content = AIContent::factory()->create([
        'design' => ['widgets' => [['id' => '1', 'type' => 'text'], ['id' => '2', 'type' => 'image']]],
    ]);

    $version = $service->createVersion($content);

    expect($version->version)->toBe('1.1');
    expect($version->ai_content_id)->toBe($content->id);
    expect($version->widget_count)->toBe(2);
    expect($version->design)->toBe($content->design);
    expect(AIContentVersion::count())->toBe(1);
});

it('createVersion increments version on subsequent calls', function (): void {
    $service = app(ContentVersionService::class);

    $content = AIContent::factory()->create(['design' => ['widgets' => []]]);

    $v1 = $service->createVersion($content);
    $v2 = $service->createVersion($content);
    $v3 = $service->createVersion($content);

    expect($v1->version)->toBe('1.1');
    expect($v2->version)->toBe('1.2');
    expect($v3->version)->toBe('1.3');
});

it('createVersion counts nested widgets recursively', function (): void {
    $service = app(ContentVersionService::class);

    $content = AIContent::factory()->create([
        'design' => [
            'widgets' => [
                ['id' => '1', 'type' => 'row', 'children' => [
                    ['id' => '2', 'type' => 'text'],
                    ['id' => '3', 'type' => 'image', 'children' => [
                        ['id' => '4', 'type' => 'icon'],
                    ]],
                ]],
            ],
        ],
    ]);

    $version = $service->createVersion($content);

    expect($version->widget_count)->toBe(4);
});

it('createVersion handles null design gracefully', function (): void {
    $service = app(ContentVersionService::class);

    $content = AIContent::factory()->create(['design' => null]);

    $version = $service->createVersion($content);

    expect($version->widget_count)->toBe(0);
    expect($version->design)->toBe([]);
});

it('purgeOldVersions keeps the most recent N versions', function (): void {
    $service = app(ContentVersionService::class);

    $content = AIContent::factory()->create(['design' => ['widgets' => []]]);

    // Create 55 versions
    for ($i = 0; $i < 55; $i++) {
        AIContentVersion::create([
            'ai_content_id' => $content->id,
            'version' => "1.{$i}",
            'design' => [],
            'widget_count' => 0,
        ]);
    }

    $deleted = $service->purgeOldVersions($content->id, 50);

    expect($deleted)->toBe(5);
    expect(AIContentVersion::where('ai_content_id', $content->id)->count())->toBe(50);
});

it('purgeOldVersions does nothing when under the limit', function (): void {
    $service = app(ContentVersionService::class);

    $content = AIContent::factory()->create(['design' => ['widgets' => []]]);

    for ($i = 0; $i < 10; $i++) {
        AIContentVersion::create([
            'ai_content_id' => $content->id,
            'version' => "1.{$i}",
            'design' => [],
            'widget_count' => 0,
        ]);
    }

    $deleted = $service->purgeOldVersions($content->id, 50);

    expect($deleted)->toBe(0);
    expect(AIContentVersion::where('ai_content_id', $content->id)->count())->toBe(10);
});

it('restoreVersion updates content design and creates a new version snapshot', function (): void {
    $service = app(ContentVersionService::class);

    $originalDesign = ['widgets' => [['id' => '1', 'type' => 'text']]];
    $content = AIContent::factory()->create(['design' => $originalDesign]);

    $olderVersion = AIContentVersion::create([
        'ai_content_id' => $content->id,
        'version' => '1.0',
        'design' => ['widgets' => [['id' => '99', 'type' => 'button']]],
        'widget_count' => 1,
    ]);

    // Update content to a different design
    $content->update(['design' => ['widgets' => [['id' => '2', 'type' => 'image']]]]);

    $service->restoreVersion($content, $olderVersion);

    $content->refresh();
    expect($content->design)->toBe($olderVersion->design);

    // A new snapshot should have been created after restore
    expect(AIContentVersion::where('ai_content_id', $content->id)->count())->toBe(2);
});

// =============================================================================
// HTTP endpoints
// =============================================================================

it('saveDesign automatically creates a version snapshot', function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content = AIContent::factory()->forPartner($partner)->create(['design' => null]);

    $design = ['widgets' => [['id' => 'w1', 'type' => 'text']]];

    $response = $this->putJson("/api/ai/contents/{$content->id}/design", ['design' => $design]);

    $response->assertOk()
        ->assertJsonPath('data.id', $content->id)
        ->assertJsonPath('data.version', '1.1');

    expect(AIContentVersion::where('ai_content_id', $content->id)->count())->toBe(1);
});

it('lists versions paginated with is_current flag', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content = AIContent::factory()->forPartner($partner)->create(['design' => ['widgets' => []]]);

    $service = app(ContentVersionService::class);
    $v1 = $service->createVersion($content);
    $v2 = $service->createVersion($content);

    $response = $this->getJson("/api/ai/contents/{$content->id}/versions");

    $response->assertOk()
        ->assertJsonPath('meta.total', 2);

    $data = $response->json('data');
    // First item is the most recent (latest version created)
    // v1='1.1', v2='1.2' — ordered by created_at desc so v2 is first
    expect($data[0]['version'])->toBe($v2->version);
    expect($data[0]['is_current'])->toBeTrue();
    expect($data[1]['version'])->toBe($v1->version);
    expect($data[1]['is_current'])->toBeFalse();
    // design not present in list endpoint
    expect(array_key_exists('design', $data[0]))->toBeFalse();
});

it('shows version detail with full design', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content = AIContent::factory()->forPartner($partner)->create(['design' => ['widgets' => []]]);
    $service = app(ContentVersionService::class);
    $version = $service->createVersion($content);

    $response = $this->getJson("/api/ai/contents/{$content->id}/versions/{$version->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $version->id)
        ->assertJsonPath('data.version', $version->version)
        ->assertJsonStructure(['data' => ['id', 'version', 'design', 'widget_count', 'created_at', 'is_current']]);
});

it('returns 404 when showing version belonging to different content', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content1 = AIContent::factory()->forPartner($partner)->create(['design' => ['widgets' => []]]);
    $content2 = AIContent::factory()->forPartner($partner)->create(['design' => ['widgets' => []]]);

    $service = app(ContentVersionService::class);
    $version = $service->createVersion($content2);

    // Try to access version of content2 via content1 route
    $this->getJson("/api/ai/contents/{$content1->id}/versions/{$version->id}")
        ->assertNotFound();
});

it('restores a version via POST endpoint', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $originalDesign = ['widgets' => [['id' => 'orig', 'type' => 'text']]];
    $content = AIContent::factory()->forPartner($partner)->create(['design' => $originalDesign]);

    $targetVersion = AIContentVersion::create([
        'ai_content_id' => $content->id,
        'version' => '1.0',
        'design' => ['widgets' => [['id' => 'restored', 'type' => 'button']]],
        'widget_count' => 1,
    ]);

    // Change content design
    $content->update(['design' => ['widgets' => [['id' => 'new', 'type' => 'image']]]]);

    $response = $this->postJson("/api/ai/contents/{$content->id}/versions", [
        'version_id' => $targetVersion->id,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.id', $content->id);

    $content->refresh();
    expect($content->design)->toBe($targetVersion->design);
});

it('returns 404 when restoring a version from another content', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content1 = AIContent::factory()->forPartner($partner)->create(['design' => ['widgets' => []]]);
    $content2 = AIContent::factory()->forPartner($partner)->create(['design' => ['widgets' => []]]);

    $versionOfContent2 = AIContentVersion::create([
        'ai_content_id' => $content2->id,
        'version' => '1.0',
        'design' => [],
        'widget_count' => 0,
    ]);

    $this->postJson("/api/ai/contents/{$content1->id}/versions", [
        'version_id' => $versionOfContent2->id,
    ])->assertNotFound();
});

it('returns 422 when version_id is missing on restore', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content = AIContent::factory()->forPartner($partner)->create(['design' => ['widgets' => []]]);

    $this->postJson("/api/ai/contents/{$content->id}/versions", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['version_id']);
});

it('partner cannot access versions of another partner content', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();

    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content2 = AIContent::factory()->forPartner($partner2)->create(['design' => ['widgets' => []]]);

    $this->getJson("/api/ai/contents/{$content2->id}/versions")
        ->assertForbidden();
});

it('AIContent hasMany versions relationship works', function (): void {
    $content = AIContent::factory()->create(['design' => ['widgets' => []]]);

    AIContentVersion::create(['ai_content_id' => $content->id, 'version' => '1.0', 'design' => [], 'widget_count' => 0]);
    AIContentVersion::create(['ai_content_id' => $content->id, 'version' => '1.1', 'design' => [], 'widget_count' => 0]);

    expect($content->versions)->toHaveCount(2);
});
