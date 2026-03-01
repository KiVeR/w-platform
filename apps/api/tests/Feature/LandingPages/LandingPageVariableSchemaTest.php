<?php

declare(strict_types=1);

use App\Models\LandingPage;
use App\Models\Partner;
use App\Models\User;
use App\Models\VariableSchema;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// --- ATTACH ---

it('allows admin to attach a variable schema', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $lp = LandingPage::factory()->create();
    $schema = VariableSchema::factory()->forPartner($lp->partner)->create();

    $response = $this->postJson("/api/landing-pages/{$lp->id}/variable-schema", [
        'variable_schema_uuid' => $schema->uuid,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.id', $lp->id)
        ->assertJsonPath('data.variable_schema_uuid', $schema->uuid)
        ->assertJsonPath('data.schema.uuid', $schema->uuid);

    expect($lp->fresh()->variable_schema_id)->toBe($schema->id);
});

it('allows partner to attach schema on own landing page', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $lp = LandingPage::factory()->forPartner($partner)->create();
    $schema = VariableSchema::factory()->forPartner($partner)->create();

    $response = $this->postJson("/api/landing-pages/{$lp->id}/variable-schema", [
        'variable_schema_uuid' => $schema->uuid,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.variable_schema_uuid', $schema->uuid);
});

it('denies partner from attaching schema on other partner landing page', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $lp = LandingPage::factory()->forPartner($partner2)->create();
    $schema = VariableSchema::factory()->forPartner($partner1)->create();

    $this->postJson("/api/landing-pages/{$lp->id}/variable-schema", [
        'variable_schema_uuid' => $schema->uuid,
    ])->assertForbidden();
});

it('returns 422 when attaching invalid schema uuid', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $lp = LandingPage::factory()->create();

    $response = $this->postJson("/api/landing-pages/{$lp->id}/variable-schema", [
        'variable_schema_uuid' => '660e8400-e29b-41d4-a716-000000000000',
    ]);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'Variable schema not found.');

    expect($lp->fresh()->variable_schema_id)->toBeNull();
});

// --- DETACH ---

it('allows admin to detach a variable schema', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $schema = VariableSchema::factory()->create();
    $lp = LandingPage::factory()->create(['variable_schema_id' => $schema->id]);

    $response = $this->deleteJson("/api/landing-pages/{$lp->id}/variable-schema");

    $response->assertOk()
        ->assertJsonPath('message', 'Variable schema detached.');

    expect($lp->fresh()->variable_schema_id)->toBeNull();
});

it('allows partner to detach schema on own landing page', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $schema = VariableSchema::factory()->forPartner($partner)->create();
    $lp = LandingPage::factory()->forPartner($partner)->create(['variable_schema_id' => $schema->id]);

    $this->deleteJson("/api/landing-pages/{$lp->id}/variable-schema")
        ->assertOk();

    expect($lp->fresh()->variable_schema_id)->toBeNull();
});

it('returns 200 when detaching without schema (idempotent)', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $lp = LandingPage::factory()->create(['variable_schema_id' => null]);

    $this->deleteJson("/api/landing-pages/{$lp->id}/variable-schema")
        ->assertOk();
});

// --- GET VARIABLE SCHEMA ---

it('allows admin to get variable schema data', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $schema = VariableSchema::factory()->create(['name' => 'Test Schema']);
    $lp = LandingPage::factory()->create(['variable_schema_id' => $schema->id]);

    $response = $this->getJson("/api/landing-pages/{$lp->id}/variable-schema");

    $response->assertOk()
        ->assertJsonPath('data.id', $lp->id)
        ->assertJsonPath('data.variable_schema.uuid', $schema->uuid)
        ->assertJsonPath('data.variable_schema.name', 'Test Schema');
});

it('allows partner to get variable schema on own landing page', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $schema = VariableSchema::factory()->forPartner($partner)->create();
    $lp = LandingPage::factory()->forPartner($partner)->create(['variable_schema_id' => $schema->id]);

    $this->getJson("/api/landing-pages/{$lp->id}/variable-schema")
        ->assertOk()
        ->assertJsonPath('data.variable_schema.uuid', $schema->uuid);
});

it('denies partner from getting variable schema on other partner landing page', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $schema = VariableSchema::factory()->forPartner($partner2)->create();
    $lp = LandingPage::factory()->forPartner($partner2)->create(['variable_schema_id' => $schema->id]);

    $this->getJson("/api/landing-pages/{$lp->id}/variable-schema")
        ->assertForbidden();
});

it('returns null variable_schema when landing page has no schema', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $lp = LandingPage::factory()->create(['variable_schema_id' => null]);

    $response = $this->getJson("/api/landing-pages/{$lp->id}/variable-schema");

    $response->assertOk()
        ->assertJsonPath('data.id', $lp->id)
        ->assertJsonPath('data.variable_schema', null);
});

// --- RESOURCE ---

it('includes variable_schema_id in landing page resource', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $schema = VariableSchema::factory()->create();
    $lp = LandingPage::factory()->create(['variable_schema_id' => $schema->id]);

    $response = $this->getJson("/api/landing-pages/{$lp->id}");

    $response->assertOk()
        ->assertJsonPath('data.variable_schema_id', $schema->id);
});
