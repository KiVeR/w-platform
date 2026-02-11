<?php

declare(strict_types=1);

use App\Models\Department;
use App\Models\Region;
use Illuminate\Support\Facades\Http;

it('seeds regions from geo api', function (): void {
    Http::fake([
        'geo.api.gouv.fr/regions' => Http::response([
            ['code' => '11', 'nom' => 'Île-de-France'],
            ['code' => '44', 'nom' => 'Grand Est'],
        ]),
    ]);

    $this->artisan('geo:seed', ['--regions' => true])
        ->assertSuccessful();

    expect(Region::count())->toBe(2)
        ->and(Region::find('11')->name)->toBe('Île-de-France');
});

it('seeds departments from geo api', function (): void {
    Region::factory()->create(['code' => '11']);

    Http::fake([
        'geo.api.gouv.fr/departements' => Http::response([
            ['code' => '75', 'nom' => 'Paris', 'codeRegion' => '11'],
            ['code' => '77', 'nom' => 'Seine-et-Marne', 'codeRegion' => '11'],
        ]),
    ]);

    $this->artisan('geo:seed', ['--departments' => true])
        ->assertSuccessful();

    expect(Department::count())->toBe(2)
        ->and(Department::find('75')->name)->toBe('Paris');
});

it('upserts existing regions', function (): void {
    Region::factory()->create(['code' => '11', 'name' => 'Old Name']);

    Http::fake([
        'geo.api.gouv.fr/regions' => Http::response([
            ['code' => '11', 'nom' => 'Île-de-France'],
        ]),
    ]);

    $this->artisan('geo:seed', ['--regions' => true])
        ->assertSuccessful();

    expect(Region::count())->toBe(1)
        ->and(Region::find('11')->name)->toBe('Île-de-France');
});

it('fails gracefully when IRIS file not found', function (): void {
    $this->artisan('geo:seed', ['--iris' => true, '--file' => '/nonexistent/file.geojson'])
        ->assertSuccessful();
});

it('seeds all when no flags are provided', function (): void {
    Http::fake([
        'geo.api.gouv.fr/regions' => Http::response([
            ['code' => '11', 'nom' => 'Île-de-France'],
        ]),
        'geo.api.gouv.fr/departements' => Http::response([
            ['code' => '75', 'nom' => 'Paris', 'codeRegion' => '11'],
        ]),
    ]);

    // Use a nonexistent IRIS file so seedIris() skips gracefully
    $this->artisan('geo:seed', ['--file' => '/tmp/nonexistent-iris.geojson'])
        ->assertSuccessful();

    expect(Region::count())->toBe(1)
        ->and(Department::count())->toBe(1);
});

it('clears cache after seeding', function (): void {
    Http::fake([
        'geo.api.gouv.fr/regions' => Http::response([
            ['code' => '11', 'nom' => 'Île-de-France'],
        ]),
    ]);

    cache()->put('geo:departments:list', 'cached');

    $this->artisan('geo:seed', ['--regions' => true])
        ->assertSuccessful();

    expect(cache()->get('geo:departments:list'))->toBeNull();
});
