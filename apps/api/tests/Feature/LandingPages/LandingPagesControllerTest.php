<?php

declare(strict_types=1);

use App\Models\LandingPage;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// --- INDEX ---

it('allows admin to list all landing pages', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    LandingPage::factory()->count(3)->create();

    $response = $this->getJson('/api/landing-pages');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('scopes landing pages to partner for non-admin', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    LandingPage::factory()->count(2)->forPartner($partner1)->create();
    LandingPage::factory()->count(3)->forPartner($partner2)->create();

    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->getJson('/api/landing-pages');

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('denies employee from listing landing pages', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $this->getJson('/api/landing-pages')->assertForbidden();
});

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/landing-pages')->assertUnauthorized();
});

it('filters landing pages by status', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    LandingPage::factory()->create(['status' => 'draft']);
    LandingPage::factory()->published()->create();

    $response = $this->getJson('/api/landing-pages?filter[status]=published');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.status', 'published');
});

// --- STORE ---

it('allows admin to create a landing page with partner_id', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->postJson('/api/landing-pages', [
        'name' => 'Ma Landing Page',
        'partner_id' => $partner->id,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Ma Landing Page')
        ->assertJsonPath('data.partner_id', $partner->id)
        ->assertJsonPath('data.user_id', $admin->id);
});

it('allows partner to create landing page (partner_id auto-assigned)', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/landing-pages', [
        'name' => 'My LP',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.partner_id', $partner->id);
});

it('forces partner_id for non-admin on store', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/landing-pages', [
        'name' => 'My LP',
        'partner_id' => $otherPartner->id,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.partner_id', $partner->id);
});

it('validates required name on store', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $this->postJson('/api/landing-pages', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'partner_id']);
});

it('sets user_id to current user on store', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/landing-pages', [
        'name' => 'My LP',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.user_id', $user->id);
});

// --- SHOW ---

it('allows admin to view any landing page', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $lp = LandingPage::factory()->create(['name' => 'Visible LP']);

    $this->getJson("/api/landing-pages/{$lp->id}")
        ->assertOk()
        ->assertJsonPath('data.name', 'Visible LP');
});

it('allows partner to view own landing page', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $lp = LandingPage::factory()->forPartner($partner)->create();

    $this->getJson("/api/landing-pages/{$lp->id}")->assertOk();
});

it('denies partner from viewing other partner landing page', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $lp = LandingPage::factory()->forPartner($partner2)->create();

    $this->getJson("/api/landing-pages/{$lp->id}")->assertForbidden();
});

// --- UPDATE ---

it('allows admin to update a landing page', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $lp = LandingPage::factory()->create();

    $this->putJson("/api/landing-pages/{$lp->id}", ['name' => 'Updated LP'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Updated LP');
});

it('allows partner to update own landing page', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $lp = LandingPage::factory()->forPartner($partner)->create();

    $this->putJson("/api/landing-pages/{$lp->id}", ['name' => 'My Updated LP'])
        ->assertOk()
        ->assertJsonPath('data.name', 'My Updated LP');
});

it('denies partner from updating other partner landing page', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $lp = LandingPage::factory()->forPartner($partner2)->create();

    $this->putJson("/api/landing-pages/{$lp->id}", ['name' => 'Hacked'])->assertForbidden();
});

// --- DESTROY ---

it('allows admin to delete a landing page (soft delete)', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $lp = LandingPage::factory()->create();

    $this->deleteJson("/api/landing-pages/{$lp->id}")->assertOk();

    expect(LandingPage::find($lp->id))->toBeNull()
        ->and(LandingPage::withTrashed()->find($lp->id))->not->toBeNull();
});

it('allows partner to delete own landing page', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $lp = LandingPage::factory()->forPartner($partner)->create();

    $this->deleteJson("/api/landing-pages/{$lp->id}")->assertOk();
});

it('denies partner from deleting other partner landing page', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $lp = LandingPage::factory()->forPartner($partner2)->create();

    $this->deleteJson("/api/landing-pages/{$lp->id}")->assertForbidden();
});

// --- DESIGN ---

it('returns null design for new landing page', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $lp = LandingPage::factory()->create();

    $response = $this->getJson("/api/landing-pages/{$lp->id}/design");

    $response->assertOk()
        ->assertJsonPath('data.id', $lp->id)
        ->assertJsonPath('data.design', null);
});

it('saves design JSON', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $lp = LandingPage::factory()->create();

    $design = [
        'version' => '1.0',
        'globalStyles' => ['backgroundColor' => '#fff'],
        'widgets' => [['type' => 'text', 'content' => 'Hello']],
    ];

    $response = $this->putJson("/api/landing-pages/{$lp->id}/design", [
        'design' => $design,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.id', $lp->id)
        ->assertJsonPath('data.design.version', '1.0');

    expect($lp->fresh()->design)->toBe($design);
});

it('returns saved design via GET', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $lp = LandingPage::factory()->withDesign()->create();

    $response = $this->getJson("/api/landing-pages/{$lp->id}/design");

    $response->assertOk()
        ->assertJsonPath('data.design.version', '1.0');
});

it('denies design access for other partner', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $lp = LandingPage::factory()->forPartner($partner2)->create();

    $this->getJson("/api/landing-pages/{$lp->id}/design")->assertForbidden();
    $this->putJson("/api/landing-pages/{$lp->id}/design", [
        'design' => ['version' => '1.0'],
    ])->assertForbidden();
});

// --- FILTERS / INCLUDES ---

it('includes partner relation', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    LandingPage::factory()->create();

    $response = $this->getJson('/api/landing-pages?include=partner');

    $response->assertOk()
        ->assertJsonStructure(['data' => [['partner' => ['id', 'name']]]]);
});

it('includes creator relation', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    LandingPage::factory()->create();

    $response = $this->getJson('/api/landing-pages?include=creator');

    $response->assertOk()
        ->assertJsonStructure(['data' => [['creator' => ['id']]]]);
});

it('sorts by created_at', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $old = LandingPage::factory()->create(['created_at' => now()->subDay()]);
    $new = LandingPage::factory()->create(['created_at' => now()]);

    $response = $this->getJson('/api/landing-pages?sort=-created_at');

    $response->assertOk()
        ->assertJsonPath('data.0.id', $new->id)
        ->assertJsonPath('data.1.id', $old->id);
});
