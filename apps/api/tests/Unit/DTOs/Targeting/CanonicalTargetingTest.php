<?php

declare(strict_types=1);

use App\DTOs\Targeting\CanonicalTargeting;
use App\DTOs\Targeting\Demographics;
use App\DTOs\Targeting\ResolvedZone;
use App\DTOs\Targeting\TargetingInput;
use App\DTOs\Targeting\TargetingOrigin;

it('creates canonical targeting with all fields', function (): void {
    $targeting = new CanonicalTargeting(
        method: 'department',
        input: new TargetingInput(
            method: 'department',
            departments: ['75', '69'],
            postcodes: [],
        ),
        zones: [
            new ResolvedZone(code: '75', type: 'department', label: 'Paris', volume: 0),
            new ResolvedZone(code: '69', type: 'department', label: 'Rhône', volume: 0),
        ],
        origin: null,
        demographics: new Demographics(gender: 'M', ageMin: 25, ageMax: 50),
    );

    expect($targeting->method)->toBe('department')
        ->and($targeting->zones)->toHaveCount(2)
        ->and($targeting->zones[0]->code)->toBe('75')
        ->and($targeting->origin)->toBeNull()
        ->and($targeting->demographics->gender)->toBe('M')
        ->and($targeting->demographics->ageMin)->toBe(25)
        ->and($targeting->input->departments)->toBe(['75', '69']);
});

it('serializes to array and back', function (): void {
    $targeting = new CanonicalTargeting(
        method: 'address',
        input: new TargetingInput(
            method: 'address',
            departments: [],
            postcodes: [],
            address: '1 rue de Rivoli, Paris',
            lat: 48.8606,
            lng: 2.3376,
            radius: 5000,
            gender: 'F',
            ageMin: 30,
            ageMax: 60,
        ),
        zones: [
            new ResolvedZone(code: '751010101', type: 'iris', label: 'Paris 1er - Les Halles', volume: 0),
        ],
        origin: new TargetingOrigin(
            address: '1 rue de Rivoli, Paris',
            lat: 48.8606,
            lng: 2.3376,
            radius: 5000,
        ),
        demographics: new Demographics(gender: 'F', ageMin: 30, ageMax: 60),
    );

    $array = $targeting->toArray();
    $restored = CanonicalTargeting::fromArray($array);

    expect($restored->method)->toBe('address')
        ->and($restored->zones)->toHaveCount(1)
        ->and($restored->zones[0]->type)->toBe('iris')
        ->and($restored->origin)->not->toBeNull()
        ->and($restored->origin->lat)->toBe(48.8606)
        ->and($restored->origin->radius)->toBe(5000)
        ->and($restored->demographics->gender)->toBe('F')
        ->and($restored->demographics->ageMin)->toBe(30)
        ->and($restored->input->address)->toBe('1 rue de Rivoli, Paris')
        ->and($restored->input->lat)->toBe(48.8606);
});

it('handles null demographics', function (): void {
    $targeting = new CanonicalTargeting(
        method: 'department',
        input: new TargetingInput(method: 'department', departments: ['75'], postcodes: []),
        zones: [new ResolvedZone(code: '75', type: 'department', label: 'Paris', volume: 0)],
        origin: null,
        demographics: null,
    );

    $array = $targeting->toArray();
    $restored = CanonicalTargeting::fromArray($array);

    expect($restored->demographics)->toBeNull();
});

it('handles null origin', function (): void {
    $targeting = new CanonicalTargeting(
        method: 'postcode',
        input: new TargetingInput(method: 'postcode', departments: [], postcodes: ['75001']),
        zones: [new ResolvedZone(code: '75001', type: 'postcode', label: '75001', volume: 0)],
        origin: null,
        demographics: new Demographics(gender: null, ageMin: null, ageMax: null),
    );

    $array = $targeting->toArray();

    expect($array['origin'])->toBeNull();
});

it('creates from array with empty zones', function (): void {
    $array = [
        'method' => 'department',
        'input' => [
            'method' => 'department',
            'departments' => [],
            'postcodes' => [],
        ],
        'zones' => [],
        'origin' => null,
        'demographics' => null,
    ];

    $targeting = CanonicalTargeting::fromArray($array);

    expect($targeting->zones)->toBeEmpty()
        ->and($targeting->method)->toBe('department');
});
