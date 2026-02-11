<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\Shop;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// --- INDEX ---

it('allows admin to list all shops', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Shop::factory()->count(3)->create();

    $response = $this->getJson('/api/shops');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('scopes shops to partner for non-admin', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    Shop::factory()->count(2)->forPartner($partner1)->create();
    Shop::factory()->count(3)->forPartner($partner2)->create();

    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->getJson('/api/shops');

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('denies employee from listing shops', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $this->getJson('/api/shops')->assertForbidden();
});

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/shops')->assertUnauthorized();
});

it('filters shops by city', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Shop::factory()->create(['city' => 'Paris']);
    Shop::factory()->create(['city' => 'Lyon']);

    $response = $this->getJson('/api/shops?filter[city]=Paris');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.city', 'Paris');
});

it('includes partner relation', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Shop::factory()->create();

    $response = $this->getJson('/api/shops?include=partner');

    $response->assertOk()
        ->assertJsonStructure(['data' => [['partner' => ['id', 'name']]]]);
});

// --- STORE ---

it('allows admin to create a shop', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->postJson('/api/shops', [
        'name' => 'Boutique Paris',
        'partner_id' => $partner->id,
        'city' => 'Paris',
        'latitude' => 48.856614,
        'longitude' => 2.352222,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Boutique Paris')
        ->assertJsonPath('data.partner_id', $partner->id);
});

it('allows partner to create shop for own partner', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/shops', [
        'name' => 'My Shop',
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

    $response = $this->postJson('/api/shops', [
        'name' => 'My Shop',
        'partner_id' => $otherPartner->id,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.partner_id', $partner->id);
});

it('validates required fields on store', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $this->postJson('/api/shops', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'partner_id']);
});

it('validates latitude and longitude ranges', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $this->postJson('/api/shops', [
        'name' => 'Bad Coords',
        'partner_id' => $partner->id,
        'latitude' => 91,
        'longitude' => -181,
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['latitude', 'longitude']);
});

// --- SHOW ---

it('allows admin to view any shop', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $shop = Shop::factory()->create(['name' => 'Visible Shop']);

    $this->getJson("/api/shops/{$shop->id}")
        ->assertOk()
        ->assertJsonPath('data.name', 'Visible Shop');
});

it('allows partner to view own shop', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $shop = Shop::factory()->forPartner($partner)->create();

    $this->getJson("/api/shops/{$shop->id}")->assertOk();
});

it('denies partner from viewing another partner shop', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $shop = Shop::factory()->forPartner($partner2)->create();

    $this->getJson("/api/shops/{$shop->id}")->assertForbidden();
});

// --- UPDATE ---

it('allows admin to update a shop', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $shop = Shop::factory()->create();

    $this->putJson("/api/shops/{$shop->id}", ['name' => 'Updated'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Updated');
});

it('allows partner to update own shop', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $shop = Shop::factory()->forPartner($partner)->create();

    $this->putJson("/api/shops/{$shop->id}", ['name' => 'My Updated Shop'])
        ->assertOk()
        ->assertJsonPath('data.name', 'My Updated Shop');
});

it('denies partner from updating another partner shop', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $shop = Shop::factory()->forPartner($partner2)->create();

    $this->putJson("/api/shops/{$shop->id}", ['name' => 'Hacked'])->assertForbidden();
});

// --- DESTROY ---

it('allows admin to delete a shop (soft delete)', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $shop = Shop::factory()->create();

    $this->deleteJson("/api/shops/{$shop->id}")->assertOk();

    expect(Shop::find($shop->id))->toBeNull()
        ->and(Shop::withTrashed()->find($shop->id))->not->toBeNull();
});

it('allows partner to delete own shop', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $shop = Shop::factory()->forPartner($partner)->create();

    $this->deleteJson("/api/shops/{$shop->id}")->assertOk();
});

it('denies partner from deleting another partner shop', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $shop = Shop::factory()->forPartner($partner2)->create();

    $this->deleteJson("/api/shops/{$shop->id}")->assertForbidden();
});
