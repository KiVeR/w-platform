<?php

declare(strict_types=1);

use App\Models\Region;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/geo/regions')->assertUnauthorized();
});

it('lists all regions', function (): void {
    Region::factory()->create(['code' => '11', 'name' => 'Île-de-France']);
    Region::factory()->create(['code' => '44', 'name' => 'Grand Est']);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/regions');

    $response->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonFragment(['code' => '11', 'name' => 'Île-de-France']);
});

it('lists regions without geometry by default', function (): void {
    Region::factory()->withGeometry()->create(['code' => '11']);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/regions');

    $response->assertOk();
    $data = $response->json('data.0');
    expect($data)->not->toHaveKey('geometry');
});

it('includes simplified geometry when requested', function (): void {
    Region::factory()->withGeometry()->create(['code' => '11']);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/regions?include=geometry');

    $response->assertOk();
    $data = $response->json('data.0');
    expect($data)->toHaveKey('geometry');
});

it('shows a single region with geometry', function (): void {
    Region::factory()->withGeometry()->create(['code' => '11', 'name' => 'Île-de-France']);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/regions/11');

    $response->assertOk()
        ->assertJsonFragment(['code' => '11', 'name' => 'Île-de-France']);
});

it('returns 404 for unknown region', function (): void {
    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $this->getJson('/api/geo/regions/XX')->assertNotFound();
});

it('returns geometry endpoint as GeoJSON', function (): void {
    Region::factory()->withGeometry()->create(['code' => '11']);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/regions/11/geometry');

    $response->assertOk()
        ->assertJsonStructure(['type', 'coordinates']);
});

it('returns 404 for unknown region geometry', function (): void {
    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $this->getJson('/api/geo/regions/XX/geometry')->assertNotFound();
});
