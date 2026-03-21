<?php

declare(strict_types=1);

use App\Enums\LifecycleStatus;
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

it('lists demandes for authenticated admin', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Demande::factory()->count(3)->create();

    $response = $this->getJson('/api/demandes');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('scopes demandes to partner for non-admin', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();

    Demande::factory()->count(2)->forPartner($partner1)->create();
    Demande::factory()->count(3)->forPartner($partner2)->create();

    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->getJson('/api/demandes');

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('returns 401 when unauthenticated for demandes', function (): void {
    $this->getJson('/api/demandes')->assertUnauthorized();
});

// --- STORE ---

it('creates a demande', function (): void {
    $partner = Partner::factory()->create();
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->postJson('/api/demandes', [
        'partner_id' => $partner->id,
        'information' => 'Test demande',
        'is_exoneration' => false,
        'pays_id' => 'FR',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.partner_id', $partner->id)
        ->assertJsonPath('data.information', 'Test demande');

    $this->assertDatabaseHas('demandes', [
        'partner_id' => $partner->id,
        'information' => 'Test demande',
    ]);
});

it('forces partner_id for non-admin on create', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();

    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('adv');
    Passport::actingAs($user);

    $response = $this->postJson('/api/demandes', [
        'partner_id' => $otherPartner->id,
        'information' => 'Should use own partner',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.partner_id', $partner->id);
});

// --- SHOW ---

it('shows a demande with includes', function (): void {
    $partner = Partner::factory()->create();
    $demande = Demande::factory()->forPartner($partner)->create();

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->getJson("/api/demandes/{$demande->id}?include=partner");

    $response->assertOk()
        ->assertJsonPath('data.id', $demande->id)
        ->assertJsonPath('data.partner.id', $partner->id);
});

// --- UPDATE ---

it('updates a demande', function (): void {
    $partner = Partner::factory()->create();
    $demande = Demande::factory()->forPartner($partner)->create();

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->putJson("/api/demandes/{$demande->id}", [
        'information' => 'Updated info',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.information', 'Updated info');
});

// --- DESTROY ---

it('deletes an empty demande', function (): void {
    $demande = Demande::factory()->create();

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->deleteJson("/api/demandes/{$demande->id}");

    $response->assertOk()
        ->assertJsonPath('message', 'Demande deleted.');

    $this->assertSoftDeleted('demandes', ['id' => $demande->id]);
});

it('prevents deleting demande with active operations', function (): void {
    $demande = Demande::factory()->create();
    Operation::factory()->forDemande($demande)->create([
        'lifecycle_status' => LifecycleStatus::PREPARING->value,
    ]);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->deleteJson("/api/demandes/{$demande->id}");

    $response->assertStatus(422)
        ->assertJsonPath('message', 'Cannot delete a demande with active operations.');
});

// --- ACCESS CONTROL ---

it('forbids access to other partner demandes', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $demande = Demande::factory()->forPartner($partner2)->create();

    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $this->getJson("/api/demandes/{$demande->id}")->assertForbidden();
});
