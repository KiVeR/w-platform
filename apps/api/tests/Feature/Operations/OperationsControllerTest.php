<?php

declare(strict_types=1);

use App\Enums\LifecycleStatus;
use App\Enums\OperationType;
use App\Models\Demande;
use App\Models\Operation;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// --- INDEX ---

it('lists operations for authenticated user', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Operation::factory()->count(3)->create();

    $response = $this->getJson('/api/operations');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('scopes operations to partner for non-admin', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $demande1 = Demande::factory()->forPartner($partner1)->create();
    $demande2 = Demande::factory()->forPartner($partner2)->create();

    Operation::factory()->count(2)->forDemande($demande1)->create();
    Operation::factory()->count(3)->forDemande($demande2)->create();

    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('adv');
    Passport::actingAs($user);

    $response = $this->getJson('/api/operations');

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

// --- STORE ---

it('creates an operation and initializes track statuses', function (): void {
    $demande = Demande::factory()->create();

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->postJson('/api/operations', [
        'demande_id' => $demande->id,
        'type' => OperationType::LOC->value,
        'name' => 'Test Operation',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Test Operation')
        ->assertJsonPath('data.lifecycle_status', 'draft')
        ->assertJsonPath('data.creative_status', 'pending')
        ->assertJsonPath('data.billing_status', 'pending')
        ->assertJsonPath('data.routing_status', 'pending');
});

it('initializes not_applicable for data ops', function (): void {
    $demande = Demande::factory()->create();

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->postJson('/api/operations', [
        'demande_id' => $demande->id,
        'type' => OperationType::ENRICH->value,
        'name' => 'Data Enrichment',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.creative_status', 'not_applicable')
        ->assertJsonPath('data.billing_status', 'not_applicable')
        ->assertJsonPath('data.routing_status', 'not_applicable');
});

// --- SHOW ---

it('shows operation detail with includes', function (): void {
    $partner = Partner::factory()->create();
    $demande = Demande::factory()->forPartner($partner)->create();
    $operation = Operation::factory()->forDemande($demande)->create();

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->getJson("/api/operations/{$operation->id}?include=demande,demande.partner");

    $response->assertOk()
        ->assertJsonPath('data.id', $operation->id)
        ->assertJsonPath('data.demande.id', $demande->id)
        ->assertJsonPath('data.demande.partner.id', $partner->id);
});

// --- UPDATE ---

it('updates an operation', function (): void {
    $operation = Operation::factory()->create();

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->putJson("/api/operations/{$operation->id}", [
        'name' => 'Updated Name',
        'advertiser' => 'New Advertiser',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.name', 'Updated Name')
        ->assertJsonPath('data.advertiser', 'New Advertiser');
});

// --- DESTROY ---

it('deletes draft operation', function (): void {
    $operation = Operation::factory()->create([
        'lifecycle_status' => LifecycleStatus::DRAFT->value,
    ]);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->deleteJson("/api/operations/{$operation->id}");

    $response->assertOk()
        ->assertJsonPath('message', 'Operation deleted.');

    $this->assertSoftDeleted('operations', ['id' => $operation->id]);
});

it('prevents deleting non-draft operation', function (): void {
    $operation = Operation::factory()->create([
        'lifecycle_status' => LifecycleStatus::PREPARING->value,
    ]);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->deleteJson("/api/operations/{$operation->id}");

    $response->assertForbidden();
});

// --- TRANSITION ---

it('transitions operation lifecycle', function (): void {
    $operation = Operation::factory()->create([
        'lifecycle_status' => LifecycleStatus::DRAFT->value,
    ]);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->postJson("/api/operations/{$operation->id}/transition", [
        'track' => 'lifecycle',
        'to_state' => 'preparing',
        'reason' => 'Starting preparation',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.lifecycle_status', 'preparing');

    $this->assertDatabaseHas('operation_transitions', [
        'operation_id' => $operation->id,
        'track' => 'lifecycle',
        'from_state' => 'draft',
        'to_state' => 'preparing',
    ]);
});

it('returns 422 for invalid transition', function (): void {
    $operation = Operation::factory()->create([
        'lifecycle_status' => LifecycleStatus::DRAFT->value,
    ]);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->postJson("/api/operations/{$operation->id}/transition", [
        'track' => 'lifecycle',
        'to_state' => 'completed',
    ]);

    $response->assertStatus(422);
});

// --- TRANSITIONS HISTORY ---

it('lists operation transition history', function (): void {
    $operation = Operation::factory()->create([
        'lifecycle_status' => LifecycleStatus::DRAFT->value,
    ]);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    // Perform a transition first
    $this->postJson("/api/operations/{$operation->id}/transition", [
        'track' => 'lifecycle',
        'to_state' => 'preparing',
    ]);

    $response = $this->getJson("/api/operations/{$operation->id}/transitions");

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.track', 'lifecycle')
        ->assertJsonPath('data.0.from_state', 'draft')
        ->assertJsonPath('data.0.to_state', 'preparing');
});

// --- ACCESS CONTROL ---

it('forbids non-admin from deleting operations', function (): void {
    $partner = Partner::factory()->create();
    $demande = Demande::factory()->forPartner($partner)->create();
    $operation = Operation::factory()->forDemande($demande)->create([
        'lifecycle_status' => LifecycleStatus::DRAFT->value,
    ]);

    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('adv');
    Passport::actingAs($user);

    $this->deleteJson("/api/operations/{$operation->id}")->assertForbidden();
});

it('forbids access to other partner operations', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $demande = Demande::factory()->forPartner($partner2)->create();
    $operation = Operation::factory()->forDemande($demande)->create();

    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('adv');
    Passport::actingAs($user);

    $this->getJson("/api/operations/{$operation->id}")->assertForbidden();
});
