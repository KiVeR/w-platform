<?php

declare(strict_types=1);

use App\Models\Department;
use App\Models\Region;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->region = Region::factory()->create(['code' => '11', 'name' => 'Île-de-France']);
});

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/geo/departments')->assertUnauthorized();
});

it('lists all departments', function (): void {
    Department::factory()->forRegion($this->region)->create(['code' => '75', 'name' => 'Paris']);
    Department::factory()->forRegion($this->region)->create(['code' => '77', 'name' => 'Seine-et-Marne']);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/departments');

    $response->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonFragment(['code' => '75', 'name' => 'Paris']);
});

it('lists departments without geometry by default', function (): void {
    Department::factory()->forRegion($this->region)->withGeometry()->create(['code' => '75']);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/departments');

    $response->assertOk();
    $data = $response->json('data.0');
    expect($data)->not->toHaveKey('geometry');
});

it('includes simplified geometry when requested', function (): void {
    Department::factory()->forRegion($this->region)->withGeometry()->create(['code' => '75']);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/departments?include=geometry');

    $response->assertOk();
    $data = $response->json('data.0');
    expect($data)->toHaveKey('geometry');
});

it('shows a single department with geometry', function (): void {
    Department::factory()->forRegion($this->region)->withGeometry()->create(['code' => '75', 'name' => 'Paris']);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/departments/75');

    $response->assertOk()
        ->assertJsonFragment(['code' => '75', 'name' => 'Paris'])
        ->assertJsonStructure(['data' => ['code', 'name', 'region_code', 'geometry']]);
});

it('returns 404 for unknown department', function (): void {
    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $this->getJson('/api/geo/departments/XX')->assertNotFound();
});

it('returns geometry endpoint as GeoJSON', function (): void {
    Department::factory()->forRegion($this->region)->withGeometry()->create(['code' => '75']);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/departments/75/geometry');

    $response->assertOk()
        ->assertJsonStructure(['type', 'coordinates']);
});

it('returns 404 for unknown department geometry', function (): void {
    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $this->getJson('/api/geo/departments/XX/geometry')->assertNotFound();
});

it('allows partner role to access departments', function (): void {
    Department::factory()->forRegion($this->region)->create(['code' => '75']);

    $user = User::factory()->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $this->getJson('/api/geo/departments')->assertOk();
});
