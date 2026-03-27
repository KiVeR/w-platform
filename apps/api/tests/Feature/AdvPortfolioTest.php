<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// --- ADV: Partners listing ---

it('allows ADV to list only their assigned partners', function (): void {
    $adv = User::factory()->create(['partner_id' => null]);
    $adv->assignRole('adv');
    Passport::actingAs($adv);

    $assigned1 = Partner::factory()->create(['adv_id' => $adv->id]);
    $assigned2 = Partner::factory()->create(['adv_id' => $adv->id]);
    Partner::factory()->create(); // unassigned

    $response = $this->getJson('/api/partners');

    $response->assertOk()
        ->assertJsonCount(2, 'data');

    $ids = collect($response->json('data'))->pluck('id')->all();
    expect($ids)->toContain($assigned1->id)
        ->toContain($assigned2->id);
});

it('prevents ADV from viewing an unassigned partner', function (): void {
    $adv = User::factory()->create(['partner_id' => null]);
    $adv->assignRole('adv');
    Passport::actingAs($adv);

    $unassigned = Partner::factory()->create();

    $this->getJson("/api/partners/{$unassigned->id}")
        ->assertForbidden();
});

it('allows ADV to view an assigned partner', function (): void {
    $adv = User::factory()->create(['partner_id' => null]);
    $adv->assignRole('adv');
    Passport::actingAs($adv);

    $assigned = Partner::factory()->create(['adv_id' => $adv->id]);

    $this->getJson("/api/partners/{$assigned->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $assigned->id);
});

// --- ADV: Users of assigned partners ---

it('allows ADV to view a user of an assigned partner', function (): void {
    $adv = User::factory()->create(['partner_id' => null]);
    $adv->assignRole('adv');
    Passport::actingAs($adv);

    $partner = Partner::factory()->create(['adv_id' => $adv->id]);
    $user = User::factory()->create(['partner_id' => $partner->id]);
    $user->assignRole('partner');

    $this->getJson("/api/users/{$user->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $user->id);
});

it('prevents ADV from viewing a user of an unassigned partner', function (): void {
    $adv = User::factory()->create(['partner_id' => null]);
    $adv->assignRole('adv');
    Passport::actingAs($adv);

    $partner = Partner::factory()->create(); // no adv_id
    $user = User::factory()->create(['partner_id' => $partner->id]);
    $user->assignRole('partner');

    $this->getJson("/api/users/{$user->id}")
        ->assertForbidden();
});

// --- Admin sees all ---

it('allows admin to see all partners regardless of adv_id', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $adv = User::factory()->create(['partner_id' => null]);
    Partner::factory()->create(['adv_id' => $adv->id]);
    Partner::factory()->create(); // no adv

    $response = $this->getJson('/api/partners');

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

// --- Partner role sees only own ---

it('allows partner user to see only their own partner', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->create(['partner_id' => $partner->id]);
    $user->assignRole('partner');
    Passport::actingAs($user);

    Partner::factory()->create(); // another partner

    $response = $this->getJson('/api/partners');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $partner->id);
});

// --- Filter adv_id ---

it('filters partners by adv_id', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $adv = User::factory()->create(['partner_id' => null]);
    Partner::factory()->create(['adv_id' => $adv->id]);
    Partner::factory()->create(['adv_id' => $adv->id]);
    Partner::factory()->create(); // no adv

    $response = $this->getJson("/api/partners?filter[adv_id]={$adv->id}");

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

// --- Include adv ---

it('includes adv relation when requested', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $adv = User::factory()->create(['partner_id' => null, 'firstname' => 'Jean', 'lastname' => 'ADV']);
    Partner::factory()->create(['adv_id' => $adv->id]);

    $response = $this->getJson('/api/partners?include=adv');

    $response->assertOk()
        ->assertJsonPath('data.0.adv.id', $adv->id)
        ->assertJsonPath('data.0.adv.firstname', 'Jean');
});

// --- adv_id in resource ---

it('returns adv_id in partner resource', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $adv = User::factory()->create(['partner_id' => null]);
    $partner = Partner::factory()->create(['adv_id' => $adv->id]);

    $response = $this->getJson("/api/partners/{$partner->id}");

    $response->assertOk()
        ->assertJsonPath('data.adv_id', $adv->id);
});

// --- per_page ---

it('respects per_page parameter', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Partner::factory()->count(5)->create();

    $response = $this->getJson('/api/partners?per_page=2');

    $response->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('meta.per_page', 2);
});

it('caps per_page at 100', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->getJson('/api/partners?per_page=200');

    $response->assertOk()
        ->assertJsonPath('meta.per_page', 100);
});
