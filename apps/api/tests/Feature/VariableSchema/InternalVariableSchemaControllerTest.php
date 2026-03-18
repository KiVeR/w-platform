<?php

declare(strict_types=1);

use App\Models\Campaign;
use App\Models\Partner;
use App\Models\VariableField;
use App\Models\VariableSchema;
use Laravel\Passport\Client;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->client = Client::factory()->asClientCredentials()->create();
});

it('requires client credentials for internal variable schema routes', function (): void {
    $this->getJson('/api/internal/variable-schemas')->assertUnauthorized();
});

it('lists internal variable schemas with legacy-compatible pagination and filters', function (): void {
    Passport::actingAsClient($this->client);

    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();

    $older = VariableSchema::factory()->forPartner($partner)->create([
        'name' => 'Ancien schema',
        'created_at' => now()->subDay(),
    ]);
    $selected = VariableSchema::factory()->forPartner($partner)->create([
        'name' => 'Alpha schema',
        'created_at' => now(),
    ]);
    VariableSchema::factory()->forPartner($otherPartner)->create([
        'name' => 'Beta schema',
        'created_at' => now()->subHours(2),
    ]);

    VariableField::factory()->forSchema($older)->create(['name' => 'ville', 'is_global' => true]);
    VariableField::factory()->forSchema($selected)->create(['name' => 'prenom']);

    $response = $this->getJson('/api/internal/variable-schemas?filter[name]=Alpha&page[number]=1&page[size]=1&sort=-created_at');

    $response->assertOk()
        ->assertJsonPath('meta.current_page', 1)
        ->assertJsonPath('meta.per_page', 1)
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $selected->uuid)
        ->assertJsonPath('data.0.name', 'Alpha schema')
        ->assertJsonPath('data.0.global_variables', [])
        ->assertJsonPath('data.0.recipient_variables.0.name', 'prenom')
        ->assertJsonPath('data.0.campaigns_count', 0);
});

it('shows internal variable schema with normalized preview payloads', function (): void {
    Passport::actingAsClient($this->client);

    $partner = Partner::factory()->create();
    $schema = VariableSchema::factory()->forPartner($partner)->create([
        'name' => 'Schema Kreo',
        'global_data' => [
            ['key' => 'm1', 'data' => ['nom_magasin' => 'Carrefour Nantes']],
        ],
        'recipient_preview_data' => [
            'global_parameters_key' => 'm1',
            'prenom' => 'Marie',
        ],
    ]);

    VariableField::factory()->forSchema($schema)->create([
        'name' => 'nom_magasin',
        'is_global' => true,
        'is_used' => true,
    ]);
    VariableField::factory()->forSchema($schema)->create([
        'name' => 'prenom',
        'is_global' => false,
    ]);
    Campaign::factory()->forPartner($partner)->create([
        'variable_schema_id' => $schema->id,
    ]);

    $response = $this->getJson("/api/internal/variable-schemas/{$schema->uuid}");

    $response->assertOk()
        ->assertJsonPath('data.id', $schema->uuid)
        ->assertJsonPath('data.uuid', $schema->uuid)
        ->assertJsonPath('data.global_variables.0.name', 'nom_magasin')
        ->assertJsonPath('data.recipient_variables.0.name', 'prenom')
        ->assertJsonPath('data.global_data.0.key', 'm1')
        ->assertJsonPath('data.recipient_preview_data.prenom', 'Marie')
        ->assertJsonPath('data.recipient_preview_data_sets.0.key', 'default')
        ->assertJsonPath('data.recipient_preview_data_sets.0.data.prenom', 'Marie')
        ->assertJsonPath('data.merged_preview_data.nom_magasin', 'Carrefour Nantes')
        ->assertJsonPath('data.merged_preview_data.prenom', 'Marie')
        ->assertJsonPath('data.usage_stats.total', 2)
        ->assertJsonPath('data.usage_stats.used', 1)
        ->assertJsonPath('data.campaigns_count', 1);
});

it('marks only selected internal variables as used', function (): void {
    Passport::actingAsClient($this->client);

    $schema = VariableSchema::factory()->create();
    VariableField::factory()->forSchema($schema)->create(['name' => 'prenom', 'is_used' => false]);
    VariableField::factory()->forSchema($schema)->create(['name' => 'nom', 'is_used' => false]);

    $response = $this->postJson("/api/internal/variable-schemas/{$schema->uuid}/mark-used", [
        'variables' => ['prenom'],
    ]);

    $response->assertOk()
        ->assertJsonPath('data.usage_stats.used', 1)
        ->assertJsonPath('data.usage_stats.unused', 1);

    expect($schema->refresh()->variableFields()->where('name', 'prenom')->first()?->is_used)->toBeTrue()
        ->and($schema->variableFields()->where('name', 'nom')->first()?->is_used)->toBeFalse();
});

it('marks only selected internal variables as unused', function (): void {
    Passport::actingAsClient($this->client);

    $schema = VariableSchema::factory()->create();
    VariableField::factory()->forSchema($schema)->create(['name' => 'prenom', 'is_used' => true]);
    VariableField::factory()->forSchema($schema)->create(['name' => 'nom', 'is_used' => true]);

    $response = $this->postJson("/api/internal/variable-schemas/{$schema->uuid}/mark-unused", [
        'variables' => ['nom'],
    ]);

    $response->assertOk()
        ->assertJsonPath('data.usage_stats.used', 1)
        ->assertJsonPath('data.usage_stats.unused', 1);

    expect($schema->refresh()->variableFields()->where('name', 'prenom')->first()?->is_used)->toBeTrue()
        ->and($schema->variableFields()->where('name', 'nom')->first()?->is_used)->toBeFalse();
});
