<?php

declare(strict_types=1);

use App\Models\AIContent;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// --- INDEX ---

it('allows admin to list all ai contents', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    AIContent::factory()->count(3)->create();

    $response = $this->getJson('/api/ai/contents');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('scopes ai contents to partner for non-admin', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    AIContent::factory()->count(2)->forPartner($partner1)->create();
    AIContent::factory()->count(3)->forPartner($partner2)->create();

    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->getJson('/api/ai/contents');

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('denies employee from listing ai contents', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $this->getJson('/api/ai/contents')->assertForbidden();
});

it('returns 401 when unauthenticated for ai contents list', function (): void {
    $this->getJson('/api/ai/contents')->assertUnauthorized();
});

it('filters ai contents by type', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    AIContent::factory()->landingPage()->create();
    AIContent::factory()->sms()->create();

    $response = $this->getJson('/api/ai/contents?filter[type]=sms');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.type', 'sms');
});

it('filters ai contents by status', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    AIContent::factory()->create(['status' => 'draft']);
    AIContent::factory()->published()->create();

    $response = $this->getJson('/api/ai/contents?filter[status]=published');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.status', 'published');
});

it('sorts ai contents by created_at', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    AIContent::factory()->create(['title' => 'Older', 'created_at' => now()->subDay()]);
    AIContent::factory()->create(['title' => 'Newer', 'created_at' => now()]);

    $response = $this->getJson('/api/ai/contents?sort=-created_at');

    $response->assertOk()
        ->assertJsonPath('data.0.title', 'Newer');
});

// --- STORE ---

it('allows admin to create ai content with partner_id', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->postJson('/api/ai/contents', [
        'type' => 'landing_page',
        'title' => 'My AI Landing Page',
        'partner_id' => $partner->id,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.type', 'landing_page')
        ->assertJsonPath('data.title', 'My AI Landing Page')
        ->assertJsonPath('data.partner_id', $partner->id)
        ->assertJsonPath('data.user_id', $admin->id);
});

it('allows partner to create ai content (partner_id auto-assigned)', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/ai/contents', [
        'type' => 'sms',
        'title' => 'My SMS Content',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.partner_id', $partner->id)
        ->assertJsonPath('data.user_id', $user->id)
        ->assertJsonPath('data.status', 'draft');
});

it('denies employee from creating ai content', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $this->postJson('/api/ai/contents', [
        'type' => 'sms',
        'title' => 'Test',
    ])->assertForbidden();
});

it('validates type is required on store', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $this->postJson('/api/ai/contents', ['title' => 'Test'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['type']);
});

it('validates type enum value on store', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $this->postJson('/api/ai/contents', ['type' => 'invalid', 'title' => 'Test'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['type']);
});

// --- SHOW ---

it('allows owner to view their ai content', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content = AIContent::factory()->forPartner($partner)->create(['title' => 'Test Content']);

    $response = $this->getJson("/api/ai/contents/{$content->id}");

    $response->assertOk()
        ->assertJsonPath('data.title', 'Test Content');
});

it('denies access to another partner ai content', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content = AIContent::factory()->forPartner($partner2)->create();

    $this->getJson("/api/ai/contents/{$content->id}")->assertForbidden();
});

// --- UPDATE ---

it('allows owner to update their ai content', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content = AIContent::factory()->forPartner($partner)->create();

    $response = $this->patchJson("/api/ai/contents/{$content->id}", [
        'title' => 'Updated Title',
        'status' => 'published',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.title', 'Updated Title')
        ->assertJsonPath('data.status', 'published');
});

it('denies updating another partner ai content', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content = AIContent::factory()->forPartner($partner2)->create();

    $this->patchJson("/api/ai/contents/{$content->id}", ['title' => 'Hacked'])->assertForbidden();
});

// --- DESTROY ---

it('allows owner to soft delete their ai content', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content = AIContent::factory()->forPartner($partner)->create();

    $response = $this->deleteJson("/api/ai/contents/{$content->id}");

    $response->assertOk()
        ->assertJson(['message' => 'AI content deleted.']);

    $this->assertSoftDeleted('ai_contents', ['id' => $content->id]);
});

it('denies deleting another partner ai content', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content = AIContent::factory()->forPartner($partner2)->create();

    $this->deleteJson("/api/ai/contents/{$content->id}")->assertForbidden();
});

// --- FAVORITE ---

it('toggles is_favorite on ai content', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content = AIContent::factory()->forPartner($partner)->create(['is_favorite' => false]);

    $response = $this->postJson("/api/ai/contents/{$content->id}/favorite");

    $response->assertOk()
        ->assertJsonPath('data.is_favorite', true);

    // Toggle again
    $response2 = $this->postJson("/api/ai/contents/{$content->id}/favorite");

    $response2->assertOk()
        ->assertJsonPath('data.is_favorite', false);
});

it('denies toggling favorite on another partner ai content', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content = AIContent::factory()->forPartner($partner2)->create();

    $this->postJson("/api/ai/contents/{$content->id}/favorite")->assertForbidden();
});

// --- DESIGN ---

it('returns design JSON for ai content', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content = AIContent::factory()->forPartner($partner)->withDesign()->create();

    $response = $this->getJson("/api/ai/contents/{$content->id}/design");

    $response->assertOk()
        ->assertJsonStructure(['data' => ['id', 'design']])
        ->assertJsonPath('data.id', $content->id);
});

it('saves design for ai content', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content = AIContent::factory()->forPartner($partner)->create();

    $design = [
        'version' => '1.0',
        'globalStyles' => ['backgroundColor' => '#fff'],
        'widgets' => [
            ['id' => 'w1', 'type' => 'text', 'content' => 'Hello'],
        ],
    ];

    $response = $this->putJson("/api/ai/contents/{$content->id}/design", ['design' => $design]);

    $response->assertOk()
        ->assertJsonPath('data.id', $content->id);

    expect($content->fresh()->design['version'])->toBe('1.0');
});

it('validates design widget count limit', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content = AIContent::factory()->forPartner($partner)->create();

    $widgets = array_map(fn ($i): array => ['id' => "w{$i}", 'type' => 'text'], range(1, 501));

    $this->putJson("/api/ai/contents/{$content->id}/design", [
        'design' => ['widgets' => $widgets],
    ])->assertUnprocessable();
});

it('denies saving design for another partner ai content', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $content = AIContent::factory()->forPartner($partner2)->create();

    $this->putJson("/api/ai/contents/{$content->id}/design", [
        'design' => ['widgets' => []],
    ])->assertForbidden();
});

// --- RECENT ---

it('returns recent and favorite ai contents', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    AIContent::factory()->count(3)->forPartner($partner)->create(['is_favorite' => false]);
    AIContent::factory()->count(2)->forPartner($partner)->favorite()->create();

    $response = $this->getJson('/api/ai/contents/recent');

    $response->assertOk()
        ->assertJsonStructure(['data' => ['recent', 'favorites']]);

    expect(count($response->json('data.recent')))->toBeLessThanOrEqual(8);
    expect(count($response->json('data.favorites')))->toBeLessThanOrEqual(10);
});

it('recent endpoint only returns partner scoped contents', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();

    AIContent::factory()->count(5)->forPartner($partner1)->create();
    AIContent::factory()->count(5)->forPartner($partner2)->create();

    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->getJson('/api/ai/contents/recent');

    $response->assertOk();
    $recent = $response->json('data.recent');
    foreach ($recent as $item) {
        expect($item['partner_id'])->toBe($partner1->id);
    }
});

it('recent endpoint limits results to 8 recent and 10 favorites', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    AIContent::factory()->count(15)->forPartner($partner)->create(['is_favorite' => false]);
    AIContent::factory()->count(15)->forPartner($partner)->favorite()->create();

    $response = $this->getJson('/api/ai/contents/recent');

    $response->assertOk();
    expect(count($response->json('data.recent')))->toBe(8);
    expect(count($response->json('data.favorites')))->toBe(10);
});

it('admin can access recent endpoint', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    AIContent::factory()->count(2)->create();

    $response = $this->getJson('/api/ai/contents/recent');

    $response->assertOk()
        ->assertJsonStructure(['data' => ['recent', 'favorites']]);
});

it('denies employee from accessing recent endpoint', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $this->getJson('/api/ai/contents/recent')->assertForbidden();
});

// --- RESOURCE STRUCTURE ---

it('does not include design field in list resource', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    AIContent::factory()->forPartner($partner)->withDesign()->create();

    $response = $this->getJson('/api/ai/contents');

    $response->assertOk();
    $item = $response->json('data.0');
    expect($item)->not->toHaveKey('design');
    expect($item)->toHaveKeys(['id', 'type', 'title', 'status', 'is_favorite', 'partner_id', 'user_id']);
});

// --- DESIGN VALIDATION ---

it('rejects design with duplicate widget IDs', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);
    $content = AIContent::factory()->forPartner($partner)->create();

    $this->putJson("/api/ai/contents/{$content->id}/design", [
        'design' => ['widgets' => [
            ['id' => 'w1', 'type' => 'text'],
            ['id' => 'w1', 'type' => 'image'], // duplicate
        ]],
    ])->assertUnprocessable();
});

it('rejects design with column containing row child', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);
    $content = AIContent::factory()->forPartner($partner)->create();

    $this->putJson("/api/ai/contents/{$content->id}/design", [
        'design' => ['widgets' => [
            ['id' => 'w1', 'type' => 'column', 'children' => [
                ['id' => 'w2', 'type' => 'row'],
            ]],
        ]],
    ])->assertUnprocessable();
});

it('rejects design with nested form inside form', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);
    $content = AIContent::factory()->forPartner($partner)->create();

    $this->putJson("/api/ai/contents/{$content->id}/design", [
        'design' => ['widgets' => [
            ['id' => 'w1', 'type' => 'form', 'children' => [
                ['id' => 'w2', 'type' => 'form'],
            ]],
        ]],
    ])->assertUnprocessable();
});

it('rejects design with widget having more than 50 children', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);
    $content = AIContent::factory()->forPartner($partner)->create();

    $children = array_map(fn ($i): array => ['id' => "c{$i}", 'type' => 'text'], range(1, 51));

    $this->putJson("/api/ai/contents/{$content->id}/design", [
        'design' => ['widgets' => [
            ['id' => 'w1', 'type' => 'column', 'children' => $children],
        ]],
    ])->assertUnprocessable();
});
