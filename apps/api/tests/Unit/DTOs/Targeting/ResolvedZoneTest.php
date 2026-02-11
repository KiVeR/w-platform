<?php

declare(strict_types=1);

use App\DTOs\Targeting\ResolvedZone;

it('creates a resolved zone with all fields', function (): void {
    $zone = new ResolvedZone(
        code: '75',
        type: 'department',
        label: 'Paris',
        volume: 500,
    );

    expect($zone->code)->toBe('75')
        ->and($zone->type)->toBe('department')
        ->and($zone->label)->toBe('Paris')
        ->and($zone->volume)->toBe(500);
});

it('serializes to array and back', function (): void {
    $zone = new ResolvedZone(
        code: '69',
        type: 'department',
        label: 'Rhône',
        volume: 300,
    );

    $array = $zone->toArray();
    $restored = ResolvedZone::fromArray($array);

    expect($restored->code)->toBe('69')
        ->and($restored->type)->toBe('department')
        ->and($restored->label)->toBe('Rhône')
        ->and($restored->volume)->toBe(300);
});

it('defaults volume to 0 when missing from array', function (): void {
    $zone = ResolvedZone::fromArray([
        'code' => '75001',
        'type' => 'postcode',
        'label' => '75001',
    ]);

    expect($zone->volume)->toBe(0);
});
