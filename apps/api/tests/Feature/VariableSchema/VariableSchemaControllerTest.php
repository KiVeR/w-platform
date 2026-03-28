<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\User;
use App\Models\VariableField;
use App\Models\VariableSchema;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// ========================================================================
// INDEX
// ========================================================================

it('allows admin to list all variable schemas', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    VariableSchema::factory()->count(3)->create();

    $response = $this->getJson('/api/variable-schemas');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('scopes variable schemas to partner for non-admin', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();
    VariableSchema::factory()->forPartner($partner)->count(2)->create();
    VariableSchema::factory()->forPartner($otherPartner)->count(3)->create();

    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->getJson('/api/variable-schemas');

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('denies employee from listing variable schemas', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $this->getJson('/api/variable-schemas')->assertForbidden();
});

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/variable-schemas')->assertUnauthorized();
});

it('filters by partner_id', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    VariableSchema::factory()->forPartner($partner1)->count(2)->create();
    VariableSchema::factory()->forPartner($partner2)->count(3)->create();

    $response = $this->getJson("/api/variable-schemas?filter[partner_id]={$partner1->id}");

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('sorts by name', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $b = VariableSchema::factory()->create(['name' => 'Beta']);
    $a = VariableSchema::factory()->create(['name' => 'Alpha']);

    $response = $this->getJson('/api/variable-schemas?sort=name');

    $response->assertOk()
        ->assertJsonPath('data.0.name', 'Alpha')
        ->assertJsonPath('data.1.name', 'Beta');
});

it('sorts by created_at descending', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $old = VariableSchema::factory()->create(['created_at' => now()->subDay()]);
    $new = VariableSchema::factory()->create(['created_at' => now()]);

    $response = $this->getJson('/api/variable-schemas?sort=-created_at');

    $response->assertOk()
        ->assertJsonPath('data.0.id', $new->id)
        ->assertJsonPath('data.1.id', $old->id);
});

it('includes partner relation', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    VariableSchema::factory()->create();

    $response = $this->getJson('/api/variable-schemas?include=partner');

    $response->assertOk()
        ->assertJsonStructure(['data' => [['partner' => ['id', 'name']]]]);
});

it('includes variableFields relation', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $schema = VariableSchema::factory()->create();
    VariableField::factory()->forSchema($schema)->count(2)->create();

    $response = $this->getJson('/api/variable-schemas?include=variableFields');

    $response->assertOk()
        ->assertJsonCount(2, 'data.0.fields');
});

it('paginates results', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    VariableSchema::factory()->count(20)->create();

    $response = $this->getJson('/api/variable-schemas');

    $response->assertOk()
        ->assertJsonCount(15, 'data')
        ->assertJsonStructure(['meta' => ['current_page', 'last_page', 'per_page', 'total']]);
});

// ========================================================================
// STORE
// ========================================================================

it('allows admin to create a variable schema', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->postJson('/api/variable-schemas', [
        'name' => 'My Schema',
        'partner_id' => $partner->id,
        'fields' => [
            ['name' => 'prenom', 'is_global' => false],
            ['name' => 'nom_magasin', 'is_global' => true],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'My Schema')
        ->assertJsonPath('data.partner_id', $partner->id)
        ->assertJsonCount(2, 'data.fields');

    expect(VariableSchema::count())->toBe(1);
    expect(VariableField::count())->toBe(2);
});

it('allows partner to create schema (partner_id auto-assigned)', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/variable-schemas', [
        'name' => 'Partner Schema',
        'fields' => [
            ['name' => 'prenom'],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.partner_id', $partner->id)
        ->assertJsonPath('data.name', 'Partner Schema');
});

it('forces partner_id for non-admin on store', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/variable-schemas', [
        'name' => 'Attempt',
        'partner_id' => $otherPartner->id,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.partner_id', $partner->id);
});

it('allows merchant to create schema', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('merchant');
    Passport::actingAs($user);

    $response = $this->postJson('/api/variable-schemas', [
        'name' => 'Merchant Schema',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.partner_id', $partner->id);
});

it('denies employee from creating variable schema', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $this->postJson('/api/variable-schemas', [
        'name' => 'Denied',
    ])->assertForbidden();
});

it('generates uuid automatically on store', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->postJson('/api/variable-schemas', [
        'name' => 'Auto UUID',
        'partner_id' => $partner->id,
    ]);

    $response->assertCreated();

    $uuid = $response->json('data.uuid');
    expect($uuid)->not->toBeNull()
        ->and(strlen($uuid))->toBe(36);
});

it('stores global_data and recipient_preview_data', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->postJson('/api/variable-schemas', [
        'name' => 'With Data',
        'partner_id' => $partner->id,
        'global_data' => [
            ['key' => 'm1', 'data' => ['nom_magasin' => 'Carrefour']],
        ],
        'recipient_preview_data' => [
            'global_parameters_key' => 'm1',
            'prenom' => 'Marie',
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.global_data.0.key', 'm1')
        ->assertJsonPath('data.recipient_preview_data.prenom', 'Marie');
});

it('creates schema without fields', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->postJson('/api/variable-schemas', [
        'name' => 'No Fields',
        'partner_id' => $partner->id,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'No Fields');

    expect(VariableField::count())->toBe(0);
});

// --- STORE VALIDATION ---

it('validates name is required on store', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $this->postJson('/api/variable-schemas', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('validates name max length on store', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $this->postJson('/api/variable-schemas', [
        'name' => str_repeat('a', 256),
        'partner_id' => $partner->id,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('validates partner_id is required for admin on store', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $this->postJson('/api/variable-schemas', [
        'name' => 'Missing Partner',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['partner_id']);
});

it('validates partner_id must exist on store', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $this->postJson('/api/variable-schemas', [
        'name' => 'Bad Partner',
        'partner_id' => 99999,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['partner_id']);
});

it('validates field names are required when fields are provided', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $this->postJson('/api/variable-schemas', [
        'name' => 'Bad Fields',
        'partner_id' => $partner->id,
        'fields' => [
            ['is_global' => true],
        ],
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['fields.0.name']);
});

it('validates field name max length', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $this->postJson('/api/variable-schemas', [
        'name' => 'Long Field Name',
        'partner_id' => $partner->id,
        'fields' => [
            ['name' => str_repeat('x', 256)],
        ],
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['fields.0.name']);
});

// ========================================================================
// SHOW
// ========================================================================

it('allows admin to view any variable schema', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $schema = VariableSchema::factory()->create(['name' => 'Visible']);

    $this->getJson("/api/variable-schemas/{$schema->uuid}")
        ->assertOk()
        ->assertJsonPath('data.name', 'Visible')
        ->assertJsonPath('data.uuid', $schema->uuid);
});

it('allows partner to view own variable schema', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $schema = VariableSchema::factory()->forPartner($partner)->create();

    $this->getJson("/api/variable-schemas/{$schema->uuid}")->assertOk();
});

it('denies partner from viewing other partner variable schema', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $schema = VariableSchema::factory()->forPartner($partner2)->create();

    $this->getJson("/api/variable-schemas/{$schema->uuid}")->assertForbidden();
});

it('returns 404 for non-existent uuid', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $this->getJson('/api/variable-schemas/00000000-0000-0000-0000-000000000000')
        ->assertNotFound();
});

it('includes variableFields on show', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $schema = VariableSchema::factory()->create();
    VariableField::factory()->forSchema($schema)->create(['name' => 'prenom']);
    VariableField::factory()->forSchema($schema)->global()->create(['name' => 'nom_magasin']);

    $response = $this->getJson("/api/variable-schemas/{$schema->uuid}?include=variableFields");

    $response->assertOk()
        ->assertJsonCount(2, 'data.fields');
});

// ========================================================================
// UPDATE
// ========================================================================

it('allows admin to update a variable schema', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $schema = VariableSchema::factory()->create();

    $this->patchJson("/api/variable-schemas/{$schema->uuid}", ['name' => 'Updated Name'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Updated Name');
});

it('allows partner to update own variable schema', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $schema = VariableSchema::factory()->forPartner($partner)->create();

    $this->patchJson("/api/variable-schemas/{$schema->uuid}", ['name' => 'My Updated'])
        ->assertOk()
        ->assertJsonPath('data.name', 'My Updated');
});

it('denies partner from updating other partner variable schema', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $schema = VariableSchema::factory()->forPartner($partner2)->create();

    $this->patchJson("/api/variable-schemas/{$schema->uuid}", ['name' => 'Hacked'])->assertForbidden();
});

it('replaces fields on update when fields are provided', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $schema = VariableSchema::factory()->create();
    VariableField::factory()->forSchema($schema)->count(2)->create();

    $response = $this->patchJson("/api/variable-schemas/{$schema->uuid}", [
        'fields' => [
            ['name' => 'new_field_1', 'is_global' => true],
            ['name' => 'new_field_2', 'is_global' => false],
            ['name' => 'new_field_3'],
        ],
    ]);

    $response->assertOk()
        ->assertJsonCount(3, 'data.fields');

    expect(VariableField::where('variable_schema_id', $schema->id)->count())->toBe(3);
});

it('does not touch fields when fields key is absent in update', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $schema = VariableSchema::factory()->create();
    VariableField::factory()->forSchema($schema)->count(3)->create();

    $this->patchJson("/api/variable-schemas/{$schema->uuid}", [
        'name' => 'Only Name Changed',
    ])->assertOk();

    expect(VariableField::where('variable_schema_id', $schema->id)->count())->toBe(3);
});

it('updates global_data and recipient_preview_data', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $schema = VariableSchema::factory()->create();

    $response = $this->patchJson("/api/variable-schemas/{$schema->uuid}", [
        'global_data' => [['key' => 'm2', 'data' => ['ville' => 'Paris']]],
        'recipient_preview_data' => ['prenom' => 'Jean'],
    ]);

    $response->assertOk()
        ->assertJsonPath('data.global_data.0.key', 'm2')
        ->assertJsonPath('data.recipient_preview_data.prenom', 'Jean');
});

it('validates name max length on update', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $schema = VariableSchema::factory()->create();

    $this->patchJson("/api/variable-schemas/{$schema->uuid}", [
        'name' => str_repeat('a', 256),
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

// ========================================================================
// DESTROY
// ========================================================================

it('allows admin to delete a variable schema', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $schema = VariableSchema::factory()->create();

    $this->deleteJson("/api/variable-schemas/{$schema->uuid}")->assertOk();

    expect(VariableSchema::find($schema->id))->toBeNull();
});

it('allows partner to delete own variable schema', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $schema = VariableSchema::factory()->forPartner($partner)->create();

    $this->deleteJson("/api/variable-schemas/{$schema->uuid}")->assertOk();

    expect(VariableSchema::find($schema->id))->toBeNull();
});

it('denies partner from deleting other partner variable schema', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $schema = VariableSchema::factory()->forPartner($partner2)->create();

    $this->deleteJson("/api/variable-schemas/{$schema->uuid}")->assertForbidden();
});

it('cascades delete to variable fields', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $schema = VariableSchema::factory()->create();
    VariableField::factory()->forSchema($schema)->count(3)->create();

    $this->deleteJson("/api/variable-schemas/{$schema->uuid}")->assertOk();

    expect(VariableField::where('variable_schema_id', $schema->id)->count())->toBe(0);
});

// ========================================================================
// CLONE
// ========================================================================

it('allows admin to clone a variable schema', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $schema = VariableSchema::factory()->create(['name' => 'Original']);
    VariableField::factory()->forSchema($schema)->create(['name' => 'prenom', 'is_global' => false]);
    VariableField::factory()->forSchema($schema)->create(['name' => 'nom_magasin', 'is_global' => true]);

    $response = $this->postJson("/api/variable-schemas/{$schema->uuid}/clone");

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Original (copy)')
        ->assertJsonCount(2, 'data.fields');

    $cloneUuid = $response->json('data.uuid');
    expect($cloneUuid)->not->toBe($schema->uuid);
    expect(VariableSchema::count())->toBe(2);
});

it('allows partner to clone own variable schema', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $schema = VariableSchema::factory()->forPartner($partner)->create(['name' => 'My Schema']);

    $response = $this->postJson("/api/variable-schemas/{$schema->uuid}/clone");

    $response->assertCreated()
        ->assertJsonPath('data.name', 'My Schema (copy)')
        ->assertJsonPath('data.partner_id', $partner->id);
});

it('denies partner from cloning other partner variable schema', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $schema = VariableSchema::factory()->forPartner($partner2)->create();

    $this->postJson("/api/variable-schemas/{$schema->uuid}/clone")->assertForbidden();
});

it('clone assigns partner_id of current user for non-admin', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $schema = VariableSchema::factory()->forPartner($partner)->create();

    $response = $this->postJson("/api/variable-schemas/{$schema->uuid}/clone");

    $response->assertCreated()
        ->assertJsonPath('data.partner_id', $partner->id);
});

it('clone copies field is_used and is_global flags', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $schema = VariableSchema::factory()->create();
    VariableField::factory()->forSchema($schema)->create([
        'name' => 'field1',
        'is_used' => true,
        'is_global' => true,
    ]);

    $response = $this->postJson("/api/variable-schemas/{$schema->uuid}/clone");

    $response->assertCreated();

    $clonedField = $response->json('data.fields.0');
    expect($clonedField['name'])->toBe('field1')
        ->and($clonedField['is_used'])->toBeTrue()
        ->and($clonedField['is_global'])->toBeTrue();
});

// ========================================================================
// RESOURCE STRUCTURE
// ========================================================================

it('returns correct resource structure on show', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $schema = VariableSchema::factory()->withGlobalData()->withRecipientPreviewData()->create();
    VariableField::factory()->forSchema($schema)->create(['name' => 'prenom']);

    $response = $this->getJson("/api/variable-schemas/{$schema->uuid}?include=variableFields");

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                'id',
                'uuid',
                'partner_id',
                'name',
                'global_data',
                'recipient_preview_data',
                'created_at',
                'updated_at',
                'fields' => [
                    ['id', 'name', 'is_used', 'is_global', 'created_at', 'updated_at'],
                ],
            ],
        ]);
});

// ========================================================================
// MODEL RELATIONS
// ========================================================================

it('variable schema belongs to partner', function (): void {
    $partner = Partner::factory()->create();
    $schema = VariableSchema::factory()->forPartner($partner)->create();

    expect($schema->partner->id)->toBe($partner->id);
});

it('variable schema has many variable fields', function (): void {
    $schema = VariableSchema::factory()->create();
    VariableField::factory()->forSchema($schema)->count(3)->create();

    expect($schema->variableFields)->toHaveCount(3);
});

it('variable field belongs to variable schema', function (): void {
    $schema = VariableSchema::factory()->create();
    $field = VariableField::factory()->forSchema($schema)->create();

    expect($field->variableSchema->id)->toBe($schema->id);
});

it('partner has many variable schemas', function (): void {
    $partner = Partner::factory()->create();
    VariableSchema::factory()->forPartner($partner)->count(2)->create();

    expect($partner->variableSchemas)->toHaveCount(2);
});

// ========================================================================
// SCOPE
// ========================================================================

it('forUser scope shows all schemas for admin', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    VariableSchema::factory()->count(5)->create();

    expect(VariableSchema::forUser($admin)->count())->toBe(5);
});

it('forUser scope filters by partner_id for non-admin', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();

    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    VariableSchema::factory()->forPartner($partner)->count(2)->create();
    VariableSchema::factory()->forPartner($otherPartner)->count(3)->create();

    expect(VariableSchema::forUser($user)->count())->toBe(2);
});
