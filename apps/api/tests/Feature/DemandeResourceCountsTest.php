<?php

declare(strict_types=1);

use App\Enums\LifecycleStatus;
use App\Models\Demande;
use App\Models\Operation;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('returns operations_count on index', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $demande = Demande::factory()->create();
    Operation::factory()->count(3)->forDemande($demande)->create();

    $response = $this->getJson('/api/demandes');

    $response->assertOk();

    $data = collect($response->json('data'))->firstWhere('id', $demande->id);

    expect($data['operations_count'])->toBe(3);
});

it('returns operations_completed_count', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $demande = Demande::factory()->create();
    Operation::factory()->count(2)->forDemande($demande)->create([
        'lifecycle_status' => LifecycleStatus::COMPLETED->value,
    ]);
    Operation::factory()->forDemande($demande)->create([
        'lifecycle_status' => LifecycleStatus::DRAFT->value,
    ]);

    $response = $this->getJson('/api/demandes');

    $response->assertOk();

    $data = collect($response->json('data'))->firstWhere('id', $demande->id);

    expect($data['operations_completed_count'])->toBe(2);
});

it('returns operations_blocked_count', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $demande = Demande::factory()->create();
    Operation::factory()->forDemande($demande)->create([
        'lifecycle_status' => LifecycleStatus::ON_HOLD->value,
    ]);
    Operation::factory()->forDemande($demande)->create([
        'lifecycle_status' => LifecycleStatus::DRAFT->value,
    ]);

    $response = $this->getJson('/api/demandes');

    $response->assertOk();

    $data = collect($response->json('data'))->firstWhere('id', $demande->id);

    expect($data['operations_blocked_count'])->toBe(1);
});

it('returns zero counts when no operations', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $demande = Demande::factory()->create();

    $response = $this->getJson('/api/demandes');

    $response->assertOk();

    $data = collect($response->json('data'))->firstWhere('id', $demande->id);

    expect($data['operations_count'])->toBe(0)
        ->and($data['operations_completed_count'])->toBe(0)
        ->and($data['operations_blocked_count'])->toBe(0);
});

it('returns counts on show endpoint', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $demande = Demande::factory()->create();
    Operation::factory()->count(2)->forDemande($demande)->create();
    Operation::factory()->forDemande($demande)->create([
        'lifecycle_status' => LifecycleStatus::COMPLETED->value,
    ]);

    $response = $this->getJson("/api/demandes/{$demande->id}");

    $response->assertOk()
        ->assertJsonPath('data.operations_count', 3)
        ->assertJsonPath('data.operations_completed_count', 1)
        ->assertJsonPath('data.operations_blocked_count', 0);
});
