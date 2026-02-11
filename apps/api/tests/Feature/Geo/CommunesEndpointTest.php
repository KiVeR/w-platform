<?php

declare(strict_types=1);

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Http;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/geo/communes?filter[codePostal]=75001')->assertUnauthorized();
});

it('searches communes by postal code', function (): void {
    Http::fake([
        'geo.api.gouv.fr/communes*' => Http::response([
            ['code' => '75101', 'nom' => 'Paris 1er Arrondissement', 'codesPostaux' => ['75001'], 'population' => 16000],
        ]),
    ]);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/communes?filter[codePostal]=75001');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['code' => '75101']);
});

it('searches communes by name', function (): void {
    Http::fake([
        'geo.api.gouv.fr/communes*' => Http::response([
            ['code' => '75056', 'nom' => 'Paris', 'codesPostaux' => ['75001'], 'population' => 2145000],
        ]),
    ]);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/communes?filter[nom]=Paris');

    $response->assertOk()
        ->assertJsonFragment(['name' => 'Paris']);
});

it('shows a single commune', function (): void {
    Http::fake([
        'geo.api.gouv.fr/communes/75056*' => Http::response([
            'code' => '75056',
            'nom' => 'Paris',
            'codesPostaux' => ['75001', '75002'],
            'population' => 2145000,
        ]),
    ]);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/communes/75056');

    $response->assertOk()
        ->assertJsonFragment(['code' => '75056', 'name' => 'Paris']);
});

it('returns 404 for unknown commune', function (): void {
    Http::fake([
        'geo.api.gouv.fr/communes/99999*' => Http::response(null, 404),
    ]);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $this->getJson('/api/geo/communes/99999')->assertNotFound();
});

it('normalizes commune response format', function (): void {
    Http::fake([
        'geo.api.gouv.fr/communes*' => Http::response([
            [
                'code' => '75101',
                'nom' => 'Paris 1er',
                'codesPostaux' => ['75001'],
                'population' => 16000,
                'departement' => ['code' => '75', 'nom' => 'Paris'],
                'region' => ['code' => '11', 'nom' => 'Île-de-France'],
            ],
        ]),
    ]);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/communes?filter[codePostal]=75001');

    $response->assertOk()
        ->assertJsonStructure(['data' => [['code', 'name', 'postal_codes', 'population', 'department', 'region']]]);
});

it('handles API error gracefully', function (): void {
    Http::fake([
        'geo.api.gouv.fr/communes*' => Http::response(null, 500),
    ]);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/communes?filter[codePostal]=75001');

    $response->assertStatus(500);
});
