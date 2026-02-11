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

it('allows admin to list all users', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    User::factory()->count(3)->create();

    $response = $this->getJson('/api/users');

    // 3 + admin = 4
    $response->assertOk()
        ->assertJsonCount(4, 'data');
});

it('scopes users to partner for non-admin', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    User::factory()->count(2)->forPartner($partner1)->create();
    User::factory()->count(3)->forPartner($partner2)->create();

    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->getJson('/api/users');

    // 2 users + the partner user = 3
    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('denies employee from listing users', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $this->getJson('/api/users')->assertForbidden();
});

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/users')->assertUnauthorized();
});

it('filters users by email', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    User::factory()->create(['email' => 'target@example.com']);
    User::factory()->create(['email' => 'other@example.com']);

    $response = $this->getJson('/api/users?filter[email]=target@example.com');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.email', 'target@example.com');
});

it('includes partner relation', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();
    User::factory()->forPartner($partner)->create();

    $response = $this->getJson('/api/users?include=partner');

    $response->assertOk()
        ->assertJsonStructure(['data' => [['partner']]]);
});

// --- STORE ---

it('allows admin to create a user with role', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->postJson('/api/users', [
        'firstname' => 'John',
        'lastname' => 'Doe',
        'email' => 'john@example.com',
        'password' => 'secret123',
        'partner_id' => $partner->id,
        'role' => 'partner',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.firstname', 'John')
        ->assertJsonPath('data.email', 'john@example.com')
        ->assertJsonPath('data.roles.0', 'partner');
});

it('validates required fields on store', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $this->postJson('/api/users', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['firstname', 'lastname', 'email', 'password', 'role']);
});

it('validates email uniqueness on store', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    User::factory()->create(['email' => 'taken@example.com']);

    $this->postJson('/api/users', [
        'firstname' => 'Test',
        'lastname' => 'User',
        'email' => 'taken@example.com',
        'password' => 'secret123',
        'role' => 'partner',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

it('denies non-admin from creating users', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $this->postJson('/api/users', [
        'firstname' => 'Test',
        'lastname' => 'User',
        'email' => 'new@example.com',
        'password' => 'secret123',
        'role' => 'merchant',
    ])->assertForbidden();
});

// --- SHOW ---

it('allows admin to view any user', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $target = User::factory()->create(['firstname' => 'Target']);

    $this->getJson("/api/users/{$target->id}")
        ->assertOk()
        ->assertJsonPath('data.firstname', 'Target');
});

it('allows partner to view user in same partner', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $target = User::factory()->forPartner($partner)->create();

    $this->getJson("/api/users/{$target->id}")->assertOk();
});

it('denies partner from viewing user in another partner', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $target = User::factory()->forPartner($partner2)->create();

    $this->getJson("/api/users/{$target->id}")->assertForbidden();
});

// --- UPDATE ---

it('allows admin to update a user', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $target = User::factory()->create();

    $this->putJson("/api/users/{$target->id}", ['firstname' => 'Updated'])
        ->assertOk()
        ->assertJsonPath('data.firstname', 'Updated');
});

it('allows admin to change user role', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $target = User::factory()->create();
    $target->assignRole('merchant');

    $this->putJson("/api/users/{$target->id}", ['role' => 'partner'])
        ->assertOk()
        ->assertJsonPath('data.roles.0', 'partner');

    expect($target->fresh()->hasRole('merchant'))->toBeFalse()
        ->and($target->fresh()->hasRole('partner'))->toBeTrue();
});

it('denies non-admin from updating users', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $target = User::factory()->forPartner($partner)->create();

    $this->putJson("/api/users/{$target->id}", ['firstname' => 'Hacked'])->assertForbidden();
});

// --- DESTROY ---

it('allows admin to delete a user (soft delete)', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $target = User::factory()->create();

    $this->deleteJson("/api/users/{$target->id}")->assertOk();

    expect(User::find($target->id))->toBeNull()
        ->and(User::withTrashed()->find($target->id))->not->toBeNull();
});

it('denies admin from deleting self', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $this->deleteJson("/api/users/{$admin->id}")->assertForbidden();
});

it('denies non-admin from deleting users', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $target = User::factory()->create();

    $this->deleteJson("/api/users/{$target->id}")->assertForbidden();
});
