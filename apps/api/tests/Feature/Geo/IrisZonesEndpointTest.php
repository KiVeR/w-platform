<?php

declare(strict_types=1);

use App\Enums\IrisType;
use App\Models\Department;
use App\Models\IrisZone;
use App\Models\Region;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;
use MatanYadaev\EloquentSpatial\Objects\LineString;
use MatanYadaev\EloquentSpatial\Objects\MultiPolygon;
use MatanYadaev\EloquentSpatial\Objects\Point;
use MatanYadaev\EloquentSpatial\Objects\Polygon;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->region = Region::factory()->create(['code' => '11']);
    $this->department = Department::factory()->forRegion($this->region)->create(['code' => '75']);
});

it('returns 401 when unauthenticated', function (): void {
    $this->getJson('/api/geo/iris-zones')->assertUnauthorized();
});

it('lists iris zones without geometry', function (): void {
    IrisZone::factory()->forDepartment($this->department)->withGeometry()->create(['code' => '751010101']);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/iris-zones');

    $response->assertOk()
        ->assertJsonCount(1, 'data');
    $data = $response->json('data.0');
    expect($data)->not->toHaveKey('geometry')
        ->and($data['code'])->toBe('751010101');
});

it('filters iris zones by department_code', function (): void {
    IrisZone::factory()->forDepartment($this->department)->count(2)->create();
    $otherRegion = Region::factory()->create(['code' => '44']);
    $otherDept = Department::factory()->forRegion($otherRegion)->create(['code' => '67']);
    IrisZone::factory()->forDepartment($otherDept)->create();

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/iris-zones?filter[department_code]=75');

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('filters iris zones by commune_code', function (): void {
    IrisZone::factory()->forDepartment($this->department)->create(['commune_code' => '75101']);
    IrisZone::factory()->forDepartment($this->department)->create(['commune_code' => '75102']);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/iris-zones?filter[commune_code]=75101');

    $response->assertOk()
        ->assertJsonCount(1, 'data');
});

it('filters iris zones by iris_type', function (): void {
    IrisZone::factory()->forDepartment($this->department)->habitat()->create();
    IrisZone::factory()->forDepartment($this->department)->nonSubdivise()->create();

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/iris-zones?filter[iris_type]=H');

    $response->assertOk()
        ->assertJsonCount(1, 'data');
    expect($response->json('data.0.iris_type'))->toBe(IrisType::HABITAT->value);
});

it('filters iris zones by name', function (): void {
    IrisZone::factory()->forDepartment($this->department)->create(['name' => 'Les Halles']);
    IrisZone::factory()->forDepartment($this->department)->create(['name' => 'Marais']);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/iris-zones?filter[name]=Hall');

    $response->assertOk()
        ->assertJsonCount(1, 'data');
});

it('paginates iris zones with max 200', function (): void {
    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/iris-zones?per_page=300');

    $response->assertOk();
    expect($response->json('meta.per_page'))->toBeLessThanOrEqual(200);
});

it('sorts iris zones', function (): void {
    IrisZone::factory()->forDepartment($this->department)->create(['code' => '751020000', 'name' => 'B Zone']);
    IrisZone::factory()->forDepartment($this->department)->create(['code' => '751010000', 'name' => 'A Zone']);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/iris-zones?sort=name');

    $response->assertOk();
    expect($response->json('data.0.name'))->toBe('A Zone');
});

it('shows a single iris zone with geometry', function (): void {
    IrisZone::factory()->forDepartment($this->department)->withGeometry()->create([
        'code' => '751010101',
        'name' => 'Les Halles',
    ]);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/iris-zones/751010101');

    $response->assertOk()
        ->assertJsonFragment(['code' => '751010101', 'name' => 'Les Halles'])
        ->assertJsonStructure(['data' => ['code', 'name', 'department_code', 'commune_code', 'geometry']]);
});

it('returns 404 for unknown iris zone', function (): void {
    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $this->getJson('/api/geo/iris-zones/000000000')->assertNotFound();
});

it('returns geometry endpoint as GeoJSON', function (): void {
    IrisZone::factory()->forDepartment($this->department)->withGeometry()->create(['code' => '751010101']);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/geo/iris-zones/751010101/geometry');

    $response->assertOk()
        ->assertJsonStructure(['type', 'coordinates']);
});

it('looks up iris zone by point', function (): void {
    $geometry = new MultiPolygon([
        new Polygon([
            new LineString([
                new Point(48.85, 2.34, 4326),
                new Point(48.85, 2.36, 4326),
                new Point(48.87, 2.36, 4326),
                new Point(48.87, 2.34, 4326),
                new Point(48.85, 2.34, 4326),
            ]),
        ]),
    ], 4326);

    IrisZone::factory()->forDepartment($this->department)->create([
        'code' => '751010101',
        'geometry' => $geometry,
    ]);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->postJson('/api/geo/iris-zones/lookup', [
        'lat' => 48.86,
        'lng' => 2.35,
    ]);

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['code' => '751010101']);
});

it('returns empty for lookup with point outside any zone', function (): void {
    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->postJson('/api/geo/iris-zones/lookup', [
        'lat' => 0.0,
        'lng' => 0.0,
    ]);

    $response->assertOk()
        ->assertJsonCount(0, 'data');
});

it('validates lookup request', function (): void {
    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $this->postJson('/api/geo/iris-zones/lookup', [])->assertUnprocessable();
    $this->postJson('/api/geo/iris-zones/lookup', ['lat' => 100, 'lng' => 0])->assertUnprocessable();
    $this->postJson('/api/geo/iris-zones/lookup', ['lat' => 0, 'lng' => 200])->assertUnprocessable();
});

it('returns batch of iris zones with simplified geometry', function (): void {
    IrisZone::factory()->forDepartment($this->department)->withGeometry()->create(['code' => '751010101']);
    IrisZone::factory()->forDepartment($this->department)->withGeometry()->create(['code' => '751010102']);

    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->postJson('/api/geo/iris-zones/batch', [
        'codes' => ['751010101', '751010102'],
    ]);

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('validates batch request max 100 codes', function (): void {
    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $codes = array_map(fn ($i) => str_pad((string) $i, 9, '0', STR_PAD_LEFT), range(1, 101));
    $this->postJson('/api/geo/iris-zones/batch', ['codes' => $codes])->assertUnprocessable();
});

it('validates batch codes must be 9 characters', function (): void {
    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $this->postJson('/api/geo/iris-zones/batch', ['codes' => ['123']])->assertUnprocessable();
});
