<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('allows admin to credit a partner', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create(['euro_credits' => '100.00']);

    $response = $this->postJson("/api/partners/{$partner->id}/credits", [
        'amount' => 250.50,
        'description' => 'Recharge admin',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.amount', '250.50')
        ->assertJsonPath('data.description', 'Recharge admin');

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(350.50);
});

it('creates a transaction record on credit', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create(['euro_credits' => '0.00']);

    $response = $this->postJson("/api/partners/{$partner->id}/credits", [
        'amount' => 100,
        'description' => 'Initial credit',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'amount', 'balance_after', 'description', 'type']]);
});

it('rejects amount zero', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->postJson("/api/partners/{$partner->id}/credits", [
        'amount' => 0,
        'description' => 'Invalid',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['amount']);
});

it('rejects negative amount', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->postJson("/api/partners/{$partner->id}/credits", [
        'amount' => -50,
        'description' => 'Invalid',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['amount']);
});

it('requires description', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->postJson("/api/partners/{$partner->id}/credits", [
        'amount' => 100,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['description']);
});

it('denies non-admin from crediting a partner', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->create(['partner_id' => $partner->id]);
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson("/api/partners/{$partner->id}/credits", [
        'amount' => 100,
        'description' => 'Nope',
    ]);

    $response->assertForbidden();
});

it('returns 401 when unauthenticated', function (): void {
    $partner = Partner::factory()->create();

    $this->postJson("/api/partners/{$partner->id}/credits", [
        'amount' => 100,
        'description' => 'Nope',
    ])->assertUnauthorized();
});
