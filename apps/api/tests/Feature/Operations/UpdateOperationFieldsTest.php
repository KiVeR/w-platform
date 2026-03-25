<?php

declare(strict_types=1);

use App\Models\Operation;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('accepts volume_estimated', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);
    $operation = Operation::factory()->create();

    $response = $this->putJson("/api/operations/{$operation->id}", [
        'volume_estimated' => 5000,
    ]);

    $response->assertOk();
    expect($operation->fresh()->volume_estimated)->toBe(5000);
});

it('accepts unit_price', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);
    $operation = Operation::factory()->create();

    $response = $this->putJson("/api/operations/{$operation->id}", [
        'unit_price' => 0.045,
    ]);

    $response->assertOk();
    expect($operation->fresh()->unit_price)->toBeFloat()->toBe(0.045);
});

it('accepts total_price', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);
    $operation = Operation::factory()->create();

    $response = $this->putJson("/api/operations/{$operation->id}", [
        'total_price' => 225.00,
    ]);

    $response->assertOk();
    expect($operation->fresh()->total_price)->toBeFloat()->toBe(225.0);
});

it('accepts scheduled_at', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);
    $operation = Operation::factory()->create();

    $response = $this->putJson("/api/operations/{$operation->id}", [
        'scheduled_at' => '2026-04-15T10:00:00Z',
    ]);

    $response->assertOk();
    expect($operation->fresh()->scheduled_at)->not->toBeNull();
});

it('accepts delivered_at', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);
    $operation = Operation::factory()->create();

    $response = $this->putJson("/api/operations/{$operation->id}", [
        'delivered_at' => '2026-04-20',
    ]);

    $response->assertOk();
    expect($operation->fresh()->delivered_at)->not->toBeNull();
});

it('accepts external_ref', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);
    $operation = Operation::factory()->create();

    $response = $this->putJson("/api/operations/{$operation->id}", [
        'external_ref' => 'EXT-2026-001',
    ]);

    $response->assertOk();
    expect($operation->fresh()->external_ref)->toBe('EXT-2026-001');
});

it('rejects negative volume_estimated', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);
    $operation = Operation::factory()->create();

    $response = $this->putJson("/api/operations/{$operation->id}", [
        'volume_estimated' => -1,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['volume_estimated']);
});

it('rejects negative unit_price', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);
    $operation = Operation::factory()->create();

    $response = $this->putJson("/api/operations/{$operation->id}", [
        'unit_price' => -0.01,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['unit_price']);
});
