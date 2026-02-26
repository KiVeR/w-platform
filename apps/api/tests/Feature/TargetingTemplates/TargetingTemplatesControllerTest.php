<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\TargetingTemplate;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// --- INDEX ---

it('allows admin to list all targeting templates', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    TargetingTemplate::factory()->count(3)->create();

    $response = $this->getJson('/api/targeting-templates');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('returns partner templates AND presets for non-admin', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();
    TargetingTemplate::factory()->forPartner($partner)->count(2)->create();
    TargetingTemplate::factory()->forPartner($otherPartner)->count(3)->create();
    TargetingTemplate::factory()->preset()->count(2)->create();

    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->getJson('/api/targeting-templates');

    $response->assertOk()
        ->assertJsonCount(4, 'data'); // 2 own + 2 presets
});

it('denies employee from listing targeting templates', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $this->getJson('/api/targeting-templates')->assertForbidden();
});

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/targeting-templates')->assertUnauthorized();
});

it('filters by is_preset', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    TargetingTemplate::factory()->count(3)->create();
    TargetingTemplate::factory()->preset()->count(2)->create();

    $response = $this->getJson('/api/targeting-templates?filter[is_preset]=1');

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('filters by category', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    TargetingTemplate::factory()->preset('commerce')->count(2)->create();
    TargetingTemplate::factory()->preset('optique')->create();

    $response = $this->getJson('/api/targeting-templates?filter[category]=commerce');

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('sorts by usage_count', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $low = TargetingTemplate::factory()->create(['usage_count' => 1]);
    $high = TargetingTemplate::factory()->create(['usage_count' => 10]);

    $response = $this->getJson('/api/targeting-templates?sort=-usage_count');

    $response->assertOk()
        ->assertJsonPath('data.0.id', $high->id)
        ->assertJsonPath('data.1.id', $low->id);
});

it('includes partner relation', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    TargetingTemplate::factory()->create();

    $response = $this->getJson('/api/targeting-templates?include=partner');

    $response->assertOk()
        ->assertJsonStructure(['data' => [['partner' => ['id', 'name']]]]);
});

// --- STORE ---

it('allows admin to create a targeting template', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->postJson('/api/targeting-templates', [
        'name' => 'Mon template',
        'partner_id' => $partner->id,
        'targeting_json' => [
            'method' => 'department',
            'departments' => ['75'],
            'gender' => null,
            'age_min' => 25,
            'age_max' => 60,
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Mon template')
        ->assertJsonPath('data.partner_id', $partner->id);
});

it('allows admin to create preset', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->postJson('/api/targeting-templates', [
        'name' => 'Preset commerce',
        'is_preset' => true,
        'category' => 'commerce',
        'targeting_json' => [
            'method' => 'address',
            'lat' => 48.8566,
            'lng' => 2.3522,
            'radius' => 2500,
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.is_preset', true)
        ->assertJsonPath('data.category', 'commerce');
});

it('allows partner to create template (partner_id auto-assigned)', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/targeting-templates', [
        'name' => 'Ma zone',
        'targeting_json' => [
            'method' => 'department',
            'departments' => ['75'],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.partner_id', $partner->id)
        ->assertJsonPath('data.is_preset', false);
});

it('forces partner_id for non-admin on store', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/targeting-templates', [
        'name' => 'Ma zone',
        'partner_id' => $otherPartner->id,
        'targeting_json' => [
            'method' => 'department',
            'departments' => ['75'],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.partner_id', $partner->id);
});

it('prevents non-admin from creating preset', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/targeting-templates', [
        'name' => 'Ma zone',
        'is_preset' => true,
        'targeting_json' => [
            'method' => 'department',
            'departments' => ['75'],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.is_preset', false);
});

it('validates required fields on store', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $this->postJson('/api/targeting-templates', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'targeting_json']);
});

it('validates name max length', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $this->postJson('/api/targeting-templates', [
        'name' => str_repeat('a', 101),
        'targeting_json' => ['method' => 'department', 'departments' => ['75']],
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('validates targeting_json method', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $this->postJson('/api/targeting-templates', [
        'name' => 'Test',
        'targeting_json' => ['method' => 'invalid'],
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['targeting_json.method']);
});

// --- SHOW ---

it('allows admin to view any template', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $template = TargetingTemplate::factory()->create(['name' => 'Visible']);

    $this->getJson("/api/targeting-templates/{$template->id}")
        ->assertOk()
        ->assertJsonPath('data.name', 'Visible');
});

it('allows partner to view own template', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $template = TargetingTemplate::factory()->forPartner($partner)->create();

    $this->getJson("/api/targeting-templates/{$template->id}")->assertOk();
});

it('denies partner from viewing other partner template', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $template = TargetingTemplate::factory()->forPartner($partner2)->create();

    $this->getJson("/api/targeting-templates/{$template->id}")->assertForbidden();
});

it('allows partner to view preset', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $preset = TargetingTemplate::factory()->preset()->create();

    $this->getJson("/api/targeting-templates/{$preset->id}")->assertOk();
});

// --- UPDATE ---

it('allows admin to update a template', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $template = TargetingTemplate::factory()->create();

    $this->putJson("/api/targeting-templates/{$template->id}", ['name' => 'Updated'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Updated');
});

it('allows partner to update own template', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $template = TargetingTemplate::factory()->forPartner($partner)->create();

    $this->putJson("/api/targeting-templates/{$template->id}", ['name' => 'My Updated'])
        ->assertOk()
        ->assertJsonPath('data.name', 'My Updated');
});

it('denies partner from updating other partner template', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $template = TargetingTemplate::factory()->forPartner($partner2)->create();

    $this->putJson("/api/targeting-templates/{$template->id}", ['name' => 'Hacked'])->assertForbidden();
});

// --- DESTROY ---

it('allows admin to delete a template (soft delete)', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $template = TargetingTemplate::factory()->create();

    $this->deleteJson("/api/targeting-templates/{$template->id}")->assertOk();

    expect(TargetingTemplate::find($template->id))->toBeNull()
        ->and(TargetingTemplate::withTrashed()->find($template->id))->not->toBeNull();
});

it('allows partner to delete own template', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $template = TargetingTemplate::factory()->forPartner($partner)->create();

    $this->deleteJson("/api/targeting-templates/{$template->id}")->assertOk();
});

it('denies partner from deleting other partner template', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $template = TargetingTemplate::factory()->forPartner($partner2)->create();

    $this->deleteJson("/api/targeting-templates/{$template->id}")->assertForbidden();
});

// --- USE TEMPLATE ---

it('increments usage_count and updates last_used_at on useTemplate', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $template = TargetingTemplate::factory()->forPartner($partner)->create([
        'usage_count' => 3,
        'last_used_at' => null,
    ]);

    $response = $this->postJson("/api/targeting-templates/{$template->id}/use");

    $response->assertOk()
        ->assertJsonPath('data.usage_count', 4);

    expect($template->fresh()->last_used_at)->not->toBeNull();
});

it('allows partner to use a preset', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $preset = TargetingTemplate::factory()->preset()->create(['usage_count' => 0]);

    $response = $this->postJson("/api/targeting-templates/{$preset->id}/use");

    $response->assertOk()
        ->assertJsonPath('data.usage_count', 1);
});

it('denies partner from using other partner template', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $template = TargetingTemplate::factory()->forPartner($partner2)->create();

    $this->postJson("/api/targeting-templates/{$template->id}/use")->assertForbidden();
});
