<?php

declare(strict_types=1);

use App\Services\Geo\GeoApiService;
use Illuminate\Support\Facades\Http;

it('fetches regions list', function (): void {
    Http::fake([
        'geo.api.gouv.fr/regions' => Http::response([
            ['code' => '11', 'nom' => 'Île-de-France'],
            ['code' => '44', 'nom' => 'Grand Est'],
        ]),
    ]);

    $service = new GeoApiService;
    $regions = $service->getRegions();

    expect($regions)->toHaveCount(2)
        ->and($regions[0]['code'])->toBe('11');
});

it('fetches departments list', function (): void {
    Http::fake([
        'geo.api.gouv.fr/departements' => Http::response([
            ['code' => '75', 'nom' => 'Paris', 'codeRegion' => '11'],
        ]),
    ]);

    $service = new GeoApiService;
    $departments = $service->getDepartments();

    expect($departments)->toHaveCount(1)
        ->and($departments[0]['nom'])->toBe('Paris');
});

it('fetches region with contour', function (): void {
    Http::fake([
        'geo.api.gouv.fr/regions/11*' => Http::response([
            'code' => '11',
            'nom' => 'Île-de-France',
            'contour' => ['type' => 'MultiPolygon'],
        ]),
    ]);

    $service = new GeoApiService;
    $result = $service->getRegionWithContour('11');

    expect($result['code'])->toBe('11');
});

it('fetches department with contour', function (): void {
    Http::fake([
        'geo.api.gouv.fr/departements/75*' => Http::response([
            'code' => '75',
            'nom' => 'Paris',
        ]),
    ]);

    $service = new GeoApiService;
    $result = $service->getDepartmentWithContour('75');

    expect($result['code'])->toBe('75');
});

it('searches communes with filters', function (): void {
    Http::fake([
        'geo.api.gouv.fr/communes*' => Http::response([
            ['code' => '75101', 'nom' => 'Paris 1er'],
        ]),
    ]);

    $service = new GeoApiService;
    $results = $service->searchCommunes(['codePostal' => '75001']);

    expect($results)->toHaveCount(1);

    Http::assertSent(function ($request) {
        return str_contains($request->url(), 'codePostal=75001');
    });
});

it('gets commune with cache', function (): void {
    Http::fake([
        'geo.api.gouv.fr/communes/75056*' => Http::response([
            'code' => '75056',
            'nom' => 'Paris',
        ]),
    ]);

    $service = new GeoApiService;

    $first = $service->getCommune('75056');
    $second = $service->getCommune('75056');

    expect($first['code'])->toBe('75056')
        ->and($second['code'])->toBe('75056');

    Http::assertSentCount(1);
});

it('returns null for commune not found', function (): void {
    Http::fake([
        'geo.api.gouv.fr/communes/99999*' => Http::response(null, 404),
    ]);

    $service = new GeoApiService;
    $result = $service->getCommune('99999');

    expect($result)->toBeNull();
});

it('uses configured timeout', function (): void {
    Http::fake([
        'geo.api.gouv.fr/regions' => Http::response([]),
    ]);

    $service = new GeoApiService(timeout: 5);
    $service->getRegions();

    Http::assertSent(function ($request) {
        return true;
    });
});
