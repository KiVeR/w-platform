<?php

declare(strict_types=1);

use App\DTOs\Targeting\CanonicalTargeting;
use App\DTOs\Targeting\Demographics;
use App\DTOs\Targeting\ResolvedZone;
use App\DTOs\Targeting\TargetingInput;
use App\Services\Targeting\Adapters\WepakTargetingAdapter;

it('transforms canonical targeting to wepak format', function (): void {
    $targeting = new CanonicalTargeting(
        method: 'department',
        input: new TargetingInput(method: 'department', departments: ['75', '69'], gender: 'M', ageMin: 25, ageMax: 45),
        zones: [
            new ResolvedZone(code: '75', type: 'department', label: 'Paris', volume: 500),
            new ResolvedZone(code: '69', type: 'department', label: 'Rhône', volume: 300),
        ],
        demographics: new Demographics(gender: 'M', ageMin: 25, ageMax: 45),
    );

    $adapter = new WepakTargetingAdapter;
    $result = $adapter->transform($targeting);

    expect($result['gender'])->toBe('M')
        ->and($result['age_min'])->toBe(25)
        ->and($result['age_max'])->toBe(45)
        ->and($result['geo']['postcodes'])->toHaveCount(2)
        ->and($result['geo']['postcodes'][0]['code'])->toBe('75')
        ->and($result['geo']['postcodes'][0]['volume'])->toBe(500)
        ->and($result['geo']['postcodes'][0]['type'])->toBe('dept')
        ->and($result['geo']['postcodes'][1]['code'])->toBe('69')
        ->and($result['geo']['postcodes'][1]['type'])->toBe('dept');
});

it('maps department type to dept', function (): void {
    $targeting = new CanonicalTargeting(
        method: 'department',
        input: new TargetingInput(method: 'department', departments: ['75']),
        zones: [new ResolvedZone(code: '75', type: 'department', label: 'Paris', volume: 100)],
    );

    $result = (new WepakTargetingAdapter)->transform($targeting);

    expect($result['geo']['postcodes'][0]['type'])->toBe('dept');
});

it('maps postcode type to cp', function (): void {
    $targeting = new CanonicalTargeting(
        method: 'postcode',
        input: new TargetingInput(method: 'postcode', postcodes: ['75001']),
        zones: [new ResolvedZone(code: '75001', type: 'postcode', label: '75001', volume: 200)],
    );

    $result = (new WepakTargetingAdapter)->transform($targeting);

    expect($result['geo']['postcodes'][0]['type'])->toBe('cp');
});

it('maps iris type to iris', function (): void {
    $targeting = new CanonicalTargeting(
        method: 'address',
        input: new TargetingInput(method: 'address', lat: 48.85, lng: 2.34, radius: 5000),
        zones: [new ResolvedZone(code: '751010101', type: 'iris', label: 'Paris 1er', volume: 50)],
    );

    $result = (new WepakTargetingAdapter)->transform($targeting);

    expect($result['geo']['postcodes'][0]['type'])->toBe('iris');
});

it('handles null demographics', function (): void {
    $targeting = new CanonicalTargeting(
        method: 'department',
        input: new TargetingInput(method: 'department', departments: ['75']),
        zones: [new ResolvedZone(code: '75', type: 'department', label: 'Paris', volume: 0)],
        demographics: null,
    );

    $result = (new WepakTargetingAdapter)->transform($targeting);

    expect($result['gender'])->toBeNull()
        ->and($result['age_min'])->toBeNull()
        ->and($result['age_max'])->toBeNull();
});
