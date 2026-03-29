<?php

declare(strict_types=1);

use App\Enums\PartnerFeatureKey;
use App\Models\Partner;
use App\Models\PartnerFeature;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// --- INDEX ---

it('allows admin to list partner features', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();
    PartnerFeature::create([
        'partner_id' => $partner->id,
        'key' => PartnerFeatureKey::SHOPS->value,
        'is_enabled' => true,
    ]);

    $response = $this->getJson("/api/partners/{$partner->id}/features");

    $response->assertOk()
        ->assertJsonStructure(['data' => [['key', 'is_enabled']]]);

    // Should return ALL feature keys, not just the ones that exist
    $allKeys = array_map(fn ($case) => $case->value, PartnerFeatureKey::cases());
    $returnedKeys = collect($response->json('data'))->pluck('key')->all();
    expect($returnedKeys)->toEqualCanonicalizing($allKeys);

    // The one we enabled should be true
    $shops = collect($response->json('data'))->firstWhere('key', 'shops');
    expect($shops['is_enabled'])->toBeTrue();

    // Others should be false
    $payment = collect($response->json('data'))->firstWhere('key', 'payment');
    expect($payment['is_enabled'])->toBeFalse();
});

it('allows partner user to view own features', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->create(['partner_id' => $partner->id]);
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->getJson("/api/partners/{$partner->id}/features");

    $response->assertOk();
});

it('denies partner user from viewing other partner features', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->create(['partner_id' => $partner1->id]);
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->getJson("/api/partners/{$partner2->id}/features");

    $response->assertForbidden();
});

it('returns 401 when unauthenticated', function (): void {
    $partner = Partner::factory()->create();

    $this->getJson("/api/partners/{$partner->id}/features")->assertUnauthorized();
});

// --- UPDATE ---

it('allows admin to enable a feature', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->putJson("/api/partners/{$partner->id}/features/shops", [
        'is_enabled' => true,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.key', 'shops')
        ->assertJsonPath('data.is_enabled', true);

    expect($partner->hasFeature(PartnerFeatureKey::SHOPS))->toBeTrue();
});

it('allows admin to disable a feature', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();
    PartnerFeature::create([
        'partner_id' => $partner->id,
        'key' => PartnerFeatureKey::SHOPS->value,
        'is_enabled' => true,
    ]);

    $response = $this->putJson("/api/partners/{$partner->id}/features/shops", [
        'is_enabled' => false,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.is_enabled', false);

    expect($partner->hasFeature(PartnerFeatureKey::SHOPS))->toBeFalse();
});

it('returns 404 for invalid feature key', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->putJson("/api/partners/{$partner->id}/features/nonexistent", [
        'is_enabled' => true,
    ]);

    $response->assertNotFound();
});

it('denies non-admin from updating features', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->create(['partner_id' => $partner->id]);
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->putJson("/api/partners/{$partner->id}/features/shops", [
        'is_enabled' => true,
    ]);

    $response->assertForbidden();
});

it('validates is_enabled is required', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->putJson("/api/partners/{$partner->id}/features/shops", []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['is_enabled']);
});

it('validates is_enabled is boolean', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->putJson("/api/partners/{$partner->id}/features/shops", [
        'is_enabled' => 'not-a-boolean',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['is_enabled']);
});
