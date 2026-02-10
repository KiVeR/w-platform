<?php

declare(strict_types=1);

use App\Models\LandingPage;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Laravel\Passport\Passport;
use Wellpack\Sdk\Trigger\DTOs\VariableSchema;
use Wellpack\Sdk\Trigger\Services\VariableSchemaApiService;

uses(RefreshDatabase::class);

const VALID_SCHEMA_UUID = '660e8400-e29b-41d4-a716-446655440111';
const INVALID_SCHEMA_UUID = '660e8400-e29b-41d4-a716-000000000000';

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

function fakeVariableSchemaService(): Mockery\MockInterface
{
    $mock = Mockery::mock(VariableSchemaApiService::class);

    $mock->shouldReceive('getOne')
        ->with(VALID_SCHEMA_UUID)
        ->andReturn(VariableSchema::fromApiResponse(schemaPayload()));

    $mock->shouldReceive('getOne')
        ->with(INVALID_SCHEMA_UUID)
        ->andThrow(new RequestException(
            new Response(new GuzzleHttp\Psr7\Response(404))
        ));

    $mock->shouldReceive('attach')
        ->with(VALID_SCHEMA_UUID)
        ->andReturn(true);

    $mock->shouldReceive('detach')
        ->with(VALID_SCHEMA_UUID)
        ->andReturn(true);

    app()->instance(VariableSchemaApiService::class, $mock);

    return $mock;
}

/** @return array<string, mixed> */
function schemaPayload(): array
{
    return [
        'id' => VALID_SCHEMA_UUID,
        'name' => 'Test Schema',
        'global_variables' => [
            ['id' => 'gv-1', 'name' => 'nom_magasin', 'is_used' => true, 'is_global' => true],
        ],
        'recipient_variables' => [
            ['id' => 'rv-1', 'name' => 'prenom', 'is_used' => true, 'is_global' => false],
        ],
        'global_data' => [
            ['key' => 'm1', 'data' => ['nom_magasin' => 'Carrefour Nantes']],
        ],
        'recipient_preview_data' => ['global_parameters_key' => 'm1', 'prenom' => 'Marie'],
        'recipient_preview_data_sets' => [],
        'merged_preview_data' => ['nom_magasin' => 'Carrefour Nantes', 'prenom' => 'Marie'],
        'usage_stats' => ['total' => 2, 'used' => 2, 'unused' => 0, 'global' => 1, 'recipient' => 1],
        'campaigns_count' => 0,
        'created_at' => '2026-01-20T10:00:00Z',
        'updated_at' => '2026-01-20T10:00:00Z',
    ];
}

// --- ATTACH ---

it('allows admin to attach a variable schema', function (): void {
    fakeVariableSchemaService();

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $lp = LandingPage::factory()->create();

    $response = $this->postJson("/api/landing-pages/{$lp->id}/variable-schema", [
        'variable_schema_uuid' => VALID_SCHEMA_UUID,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.id', $lp->id)
        ->assertJsonPath('data.variable_schema_uuid', VALID_SCHEMA_UUID)
        ->assertJsonPath('data.schema.id', VALID_SCHEMA_UUID)
        ->assertJsonPath('data.schema.name', 'Test Schema');

    expect($lp->fresh()->variable_schema_uuid)->toBe(VALID_SCHEMA_UUID);
});

it('allows partner to attach schema on own landing page', function (): void {
    fakeVariableSchemaService();

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $lp = LandingPage::factory()->forPartner($partner)->create();

    $response = $this->postJson("/api/landing-pages/{$lp->id}/variable-schema", [
        'variable_schema_uuid' => VALID_SCHEMA_UUID,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.variable_schema_uuid', VALID_SCHEMA_UUID);
});

it('denies partner from attaching schema on other partner landing page', function (): void {
    fakeVariableSchemaService();

    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $lp = LandingPage::factory()->forPartner($partner2)->create();

    $this->postJson("/api/landing-pages/{$lp->id}/variable-schema", [
        'variable_schema_uuid' => VALID_SCHEMA_UUID,
    ])->assertForbidden();
});

it('returns 422 when attaching invalid schema uuid', function (): void {
    fakeVariableSchemaService();

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $lp = LandingPage::factory()->create();

    $response = $this->postJson("/api/landing-pages/{$lp->id}/variable-schema", [
        'variable_schema_uuid' => INVALID_SCHEMA_UUID,
    ]);

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'Variable schema not found.');

    expect($lp->fresh()->variable_schema_uuid)->toBeNull();
});

// --- DETACH ---

it('allows admin to detach a variable schema', function (): void {
    fakeVariableSchemaService();

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $lp = LandingPage::factory()->create(['variable_schema_uuid' => VALID_SCHEMA_UUID]);

    $response = $this->deleteJson("/api/landing-pages/{$lp->id}/variable-schema");

    $response->assertOk()
        ->assertJsonPath('message', 'Variable schema detached.');

    expect($lp->fresh()->variable_schema_uuid)->toBeNull();
});

it('allows partner to detach schema on own landing page', function (): void {
    fakeVariableSchemaService();

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $lp = LandingPage::factory()->forPartner($partner)->create(['variable_schema_uuid' => VALID_SCHEMA_UUID]);

    $this->deleteJson("/api/landing-pages/{$lp->id}/variable-schema")
        ->assertOk();

    expect($lp->fresh()->variable_schema_uuid)->toBeNull();
});

it('returns 200 when detaching without schema (idempotent)', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $lp = LandingPage::factory()->create(['variable_schema_uuid' => null]);

    $this->deleteJson("/api/landing-pages/{$lp->id}/variable-schema")
        ->assertOk();
});

// --- GET VARIABLE SCHEMA ---

it('allows admin to get variable schema data', function (): void {
    fakeVariableSchemaService();

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $lp = LandingPage::factory()->create(['variable_schema_uuid' => VALID_SCHEMA_UUID]);

    $response = $this->getJson("/api/landing-pages/{$lp->id}/variable-schema");

    $response->assertOk()
        ->assertJsonPath('data.id', $lp->id)
        ->assertJsonPath('data.variable_schema.id', VALID_SCHEMA_UUID)
        ->assertJsonPath('data.variable_schema.name', 'Test Schema');
});

it('allows partner to get variable schema on own landing page', function (): void {
    fakeVariableSchemaService();

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $lp = LandingPage::factory()->forPartner($partner)->create(['variable_schema_uuid' => VALID_SCHEMA_UUID]);

    $this->getJson("/api/landing-pages/{$lp->id}/variable-schema")
        ->assertOk()
        ->assertJsonPath('data.variable_schema.id', VALID_SCHEMA_UUID);
});

it('denies partner from getting variable schema on other partner landing page', function (): void {
    fakeVariableSchemaService();

    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $lp = LandingPage::factory()->forPartner($partner2)->create(['variable_schema_uuid' => VALID_SCHEMA_UUID]);

    $this->getJson("/api/landing-pages/{$lp->id}/variable-schema")
        ->assertForbidden();
});

it('returns null variable_schema when landing page has no schema', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $lp = LandingPage::factory()->create(['variable_schema_uuid' => null]);

    $response = $this->getJson("/api/landing-pages/{$lp->id}/variable-schema");

    $response->assertOk()
        ->assertJsonPath('data.id', $lp->id)
        ->assertJsonPath('data.variable_schema', null);
});

// --- RESOURCE ---

it('includes variable_schema_uuid in landing page resource', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $lp = LandingPage::factory()->create(['variable_schema_uuid' => VALID_SCHEMA_UUID]);

    $response = $this->getJson("/api/landing-pages/{$lp->id}");

    $response->assertOk()
        ->assertJsonPath('data.variable_schema_uuid', VALID_SCHEMA_UUID);
});
