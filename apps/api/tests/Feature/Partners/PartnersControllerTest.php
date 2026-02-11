<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// --- INDEX ---

it('allows admin to list all partners', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Partner::factory()->count(3)->create();

    $response = $this->getJson('/api/partners');

    $response->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonStructure([
            'data' => [['id', 'name', 'code', 'is_active', 'users_count', 'shops_count']],
            'links',
            'meta',
        ]);
});

it('denies non-admin from listing partners', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $this->getJson('/api/partners')->assertForbidden();
});

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/partners')->assertUnauthorized();
});

it('filters partners by name', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Partner::factory()->create(['name' => 'Acme Corp']);
    Partner::factory()->create(['name' => 'Beta Inc']);

    $response = $this->getJson('/api/partners?filter[name]=Acme');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Acme Corp');
});

it('sorts partners by name', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Partner::factory()->create(['name' => 'Zeta']);
    Partner::factory()->create(['name' => 'Alpha']);

    $response = $this->getJson('/api/partners?sort=name');

    $response->assertOk()
        ->assertJsonPath('data.0.name', 'Alpha')
        ->assertJsonPath('data.1.name', 'Zeta');
});

it('includes users and shops', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->getJson('/api/partners?include=users,shops');

    $response->assertOk()
        ->assertJsonStructure(['data' => [['users', 'shops']]]);
});

// --- STORE ---

it('allows admin to create a partner', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->postJson('/api/partners', [
        'name' => 'New Partner',
        'code' => 'NEW',
        'email' => 'contact@new.com',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'New Partner')
        ->assertJsonPath('data.code', 'NEW');

    $this->assertDatabaseHas('partners', ['code' => 'NEW']);
});

it('validates required fields on store', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $this->postJson('/api/partners', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'code']);
});

it('validates unique code on store', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Partner::factory()->create(['code' => 'TAKEN']);

    $this->postJson('/api/partners', [
        'name' => 'Test',
        'code' => 'TAKEN',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['code']);
});

it('denies non-admin from creating partners', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $this->postJson('/api/partners', [
        'name' => 'Test',
        'code' => 'TST',
    ])->assertForbidden();
});

// --- SHOW ---

it('allows admin to view any partner', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create(['name' => 'Visible']);

    $response = $this->getJson("/api/partners/{$partner->id}");

    $response->assertOk()
        ->assertJsonPath('data.name', 'Visible');
});

it('allows partner user to view own partner', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $this->getJson("/api/partners/{$partner->id}")->assertOk();
});

it('denies partner user from viewing another partner', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $this->getJson("/api/partners/{$partner2->id}")->assertForbidden();
});

// --- UPDATE ---

it('allows admin to update a partner', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->putJson("/api/partners/{$partner->id}", [
        'name' => 'Updated Name',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.name', 'Updated Name');
});

it('denies non-admin from updating partners', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $this->putJson("/api/partners/{$partner->id}", [
        'name' => 'Hacked',
    ])->assertForbidden();
});

// --- DESTROY ---

it('allows admin to delete a partner (soft delete)', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $this->deleteJson("/api/partners/{$partner->id}")->assertOk();

    expect(Partner::find($partner->id))->toBeNull()
        ->and(Partner::withTrashed()->find($partner->id))->not->toBeNull();
});

it('denies non-admin from deleting partners', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $this->deleteJson("/api/partners/{$partner->id}")->assertForbidden();
});
