<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\PartnerPricing;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// --- INDEX ---

it('allows admin to list all partner pricings', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    PartnerPricing::factory()->count(3)->create();

    $response = $this->getJson('/api/partner-pricings');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('denies non-admin from listing partner pricings', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $this->getJson('/api/partner-pricings')->assertForbidden();
});

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/partner-pricings')->assertUnauthorized();
});

it('filters partner pricings by partner_id', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();
    PartnerPricing::factory()->count(2)->forPartner($partner)->create();
    PartnerPricing::factory()->create();

    $response = $this->getJson("/api/partner-pricings?filter[partner_id]={$partner->id}");

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('includes partner relation', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    PartnerPricing::factory()->create();

    $response = $this->getJson('/api/partner-pricings?include=partner');

    $response->assertOk()
        ->assertJsonStructure(['data' => [['partner' => ['id', 'name']]]]);
});

// --- STORE ---

it('allows admin to create a partner pricing', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->postJson('/api/partner-pricings', [
        'partner_id' => $partner->id,
        'name' => 'Premium',
        'volume_min' => 0,
        'volume_max' => 10000,
        'router_price' => 0.0300,
        'data_price' => 0.0100,
        'ci_price' => 0.0050,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Premium')
        ->assertJsonPath('data.partner_id', $partner->id);
});

it('validates required fields on store', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $this->postJson('/api/partner-pricings', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['partner_id', 'name', 'router_price', 'data_price', 'ci_price']);
});

it('denies non-admin from creating partner pricings', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $this->postJson('/api/partner-pricings', [
        'partner_id' => $partner->id,
        'name' => 'Test',
        'router_price' => 0.03,
        'data_price' => 0.01,
        'ci_price' => 0.005,
    ])->assertForbidden();
});

// --- SHOW ---

it('allows admin to view a partner pricing', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $pricing = PartnerPricing::factory()->create(['name' => 'Visible']);

    $this->getJson("/api/partner-pricings/{$pricing->id}")
        ->assertOk()
        ->assertJsonPath('data.name', 'Visible');
});

it('denies non-admin from viewing a partner pricing', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $pricing = PartnerPricing::factory()->create();

    $this->getJson("/api/partner-pricings/{$pricing->id}")->assertForbidden();
});

// --- UPDATE ---

it('allows admin to update a partner pricing', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $pricing = PartnerPricing::factory()->create();

    $this->putJson("/api/partner-pricings/{$pricing->id}", ['name' => 'Updated'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Updated');
});

it('denies non-admin from updating a partner pricing', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $pricing = PartnerPricing::factory()->create();

    $this->putJson("/api/partner-pricings/{$pricing->id}", ['name' => 'Hacked'])->assertForbidden();
});

// --- DESTROY ---

it('allows admin to delete a partner pricing', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $pricing = PartnerPricing::factory()->create();

    $this->deleteJson("/api/partner-pricings/{$pricing->id}")->assertOk();

    $this->assertDatabaseMissing('partner_pricings', ['id' => $pricing->id]);
});

it('denies non-admin from deleting a partner pricing', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $pricing = PartnerPricing::factory()->create();

    $this->deleteJson("/api/partner-pricings/{$pricing->id}")->assertForbidden();
});
