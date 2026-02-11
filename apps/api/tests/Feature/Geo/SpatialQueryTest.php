<?php

declare(strict_types=1);

use App\Models\Department;
use App\Models\IrisZone;
use App\Models\Region;
use MatanYadaev\EloquentSpatial\Objects\LineString;
use MatanYadaev\EloquentSpatial\Objects\MultiPolygon;
use MatanYadaev\EloquentSpatial\Objects\Point;
use MatanYadaev\EloquentSpatial\Objects\Polygon;

it('stores and retrieves MultiPolygon geometry', function (): void {
    $region = Region::factory()->withGeometry()->create(['code' => '11']);

    $fresh = Region::find('11');
    expect($fresh->geometry)->toBeInstanceOf(MultiPolygon::class);
});

it('finds zone containing a point with whereContains', function (): void {
    $region = Region::factory()->create(['code' => '11']);
    $department = Department::factory()->forRegion($region)->create(['code' => '75']);

    $geometry = new MultiPolygon([
        new Polygon([
            new LineString([
                new Point(48.0, 2.0, 4326),
                new Point(48.0, 3.0, 4326),
                new Point(49.0, 3.0, 4326),
                new Point(49.0, 2.0, 4326),
                new Point(48.0, 2.0, 4326),
            ]),
        ]),
    ], 4326);

    IrisZone::factory()->forDepartment($department)->create([
        'code' => '751010101',
        'geometry' => $geometry,
    ]);

    $point = new Point(48.5, 2.5, 4326);
    $result = IrisZone::query()->whereContains('geometry', $point)->first();

    expect($result)->not->toBeNull()
        ->and($result->code)->toBe('751010101');
});

it('does not find zone for point outside polygon', function (): void {
    $region = Region::factory()->create(['code' => '11']);
    $department = Department::factory()->forRegion($region)->create(['code' => '75']);

    $geometry = new MultiPolygon([
        new Polygon([
            new LineString([
                new Point(48.0, 2.0, 4326),
                new Point(48.0, 3.0, 4326),
                new Point(49.0, 3.0, 4326),
                new Point(49.0, 2.0, 4326),
                new Point(48.0, 2.0, 4326),
            ]),
        ]),
    ], 4326);

    IrisZone::factory()->forDepartment($department)->create([
        'code' => '751010101',
        'geometry' => $geometry,
    ]);

    $point = new Point(50.0, 5.0, 4326);
    $result = IrisZone::query()->whereContains('geometry', $point)->first();

    expect($result)->toBeNull();
});

it('stores geometry with SRID 4326', function (): void {
    $region = Region::factory()->withGeometry()->create(['code' => '11']);

    $fresh = Region::find('11');
    expect($fresh->geometry->srid)->toBe(4326);
});

it('supports whereWithin spatial query', function (): void {
    $region = Region::factory()->create(['code' => '11']);
    $department = Department::factory()->forRegion($region)->withGeometry()->create(['code' => '75']);

    $containingPolygon = new MultiPolygon([
        new Polygon([
            new LineString([
                new Point(47.0, 1.0, 4326),
                new Point(47.0, 4.0, 4326),
                new Point(50.0, 4.0, 4326),
                new Point(50.0, 1.0, 4326),
                new Point(47.0, 1.0, 4326),
            ]),
        ]),
    ], 4326);

    $result = Department::query()->whereWithin('geometry', $containingPolygon)->first();

    expect($result)->not->toBeNull()
        ->and($result->code)->toBe('75');
});

it('handles null geometry gracefully', function (): void {
    $region = Region::factory()->create(['code' => '11']);

    $fresh = Region::find('11');
    expect($fresh->geometry)->toBeNull();
});

it('batch simplify returns valid geometry', function (): void {
    $region = Region::factory()->create(['code' => '11']);
    $department = Department::factory()->forRegion($region)->withGeometry()->create(['code' => '75']);

    $result = Department::query()
        ->selectRaw('"code", ST_Simplify(geometry::geometry, 0.0001) as geometry')
        ->where('code', '75')
        ->first();

    expect($result)->not->toBeNull()
        ->and($result->code)->toBe('75');
});

it('creates department with region relationship', function (): void {
    $region = Region::factory()->create(['code' => '11', 'name' => 'Île-de-France']);
    $department = Department::factory()->forRegion($region)->create(['code' => '75']);

    expect($department->region->code)->toBe('11')
        ->and($region->departments)->toHaveCount(1);
});
