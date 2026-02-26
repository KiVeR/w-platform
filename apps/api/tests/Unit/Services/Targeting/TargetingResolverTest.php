<?php

declare(strict_types=1);

use App\DTOs\Targeting\CanonicalTargeting;
use App\DTOs\Targeting\TargetingInput;
use App\Models\Department;
use App\Models\IrisZone;
use App\Services\Targeting\TargetingResolver;

// --- Cycle 2: Departments ---

it('resolves department codes to zones with names from DB', function (): void {
    Department::factory()->create(['code' => '75', 'name' => 'Paris']);
    Department::factory()->create(['code' => '69', 'name' => 'Rhône']);

    $resolver = new TargetingResolver;
    $input = new TargetingInput(method: 'department', departments: ['75', '69']);
    $result = $resolver->resolve($input);

    expect($result)->toBeInstanceOf(CanonicalTargeting::class)
        ->and($result->method)->toBe('department')
        ->and($result->zones)->toHaveCount(2)
        ->and($result->zones[0]->code)->toBe('69')
        ->and($result->zones[0]->type)->toBe('department')
        ->and($result->zones[0]->label)->toBe('Rhône')
        ->and($result->zones[0]->volume)->toBe(0)
        ->and($result->zones[1]->code)->toBe('75')
        ->and($result->zones[1]->label)->toBe('Paris');
});

it('preserves demographics in resolved targeting', function (): void {
    Department::factory()->create(['code' => '75', 'name' => 'Paris']);

    $resolver = new TargetingResolver;
    $input = new TargetingInput(
        method: 'department',
        departments: ['75'],
        gender: 'M',
        ageMin: 25,
        ageMax: 50,
    );
    $result = $resolver->resolve($input);

    expect($result->demographics)->not->toBeNull()
        ->and($result->demographics->gender)->toBe('M')
        ->and($result->demographics->ageMin)->toBe(25)
        ->and($result->demographics->ageMax)->toBe(50);
});

it('returns empty zones for empty departments array', function (): void {
    $resolver = new TargetingResolver;
    $input = new TargetingInput(method: 'department', departments: []);
    $result = $resolver->resolve($input);

    expect($result->zones)->toBeEmpty();
});

it('stores input in resolved targeting', function (): void {
    Department::factory()->create(['code' => '75', 'name' => 'Paris']);

    $resolver = new TargetingResolver;
    $input = new TargetingInput(method: 'department', departments: ['75']);
    $result = $resolver->resolve($input);

    expect($result->input->method)->toBe('department')
        ->and($result->input->departments)->toBe(['75']);
});

// --- Cycle 3: Postcodes ---

it('resolves postcodes to zones directly', function (): void {
    $resolver = new TargetingResolver;
    $input = new TargetingInput(method: 'postcode', postcodes: ['75001', '75002']);
    $result = $resolver->resolve($input);

    expect($result->method)->toBe('postcode')
        ->and($result->zones)->toHaveCount(2)
        ->and($result->zones[0]->code)->toBe('75001')
        ->and($result->zones[0]->type)->toBe('postcode')
        ->and($result->zones[0]->label)->toBe('75001')
        ->and($result->zones[1]->code)->toBe('75002');
});

it('creates postcode zones with code as label', function (): void {
    $resolver = new TargetingResolver;
    $input = new TargetingInput(method: 'postcode', postcodes: ['13001']);
    $result = $resolver->resolve($input);

    expect($result->zones[0]->label)->toBe('13001')
        ->and($result->zones[0]->volume)->toBe(0);
});

// --- Cycle 4: Address (PostGIS) ---

it('resolves address to iris zones via PostGIS ST_DWithin', function (): void {
    $department = Department::factory()->create(['code' => '75', 'name' => 'Paris']);
    IrisZone::factory()->forDepartment($department)->withGeometry()->create([
        'code' => '751040101',
        'name' => 'Les Halles',
        'commune_name' => 'Paris 1er',
    ]);

    $resolver = new TargetingResolver;
    $input = new TargetingInput(
        method: 'address',
        address: '1 rue de Rivoli, Paris',
        lat: 48.855,
        lng: 2.345,
        radius: 5000,
    );
    $result = $resolver->resolve($input);

    expect($result->method)->toBe('address')
        ->and($result->zones)->not->toBeEmpty()
        ->and($result->zones[0]->type)->toBe('iris')
        ->and($result->zones[0]->code)->toBe('751040101')
        ->and($result->zones[0]->label)->toBe('Paris 1er - Les Halles');
});

it('preserves origin for address method', function (): void {
    $resolver = new TargetingResolver;
    $input = new TargetingInput(
        method: 'address',
        address: '1 rue de Rivoli, Paris',
        lat: 48.855,
        lng: 2.345,
        radius: 5000,
    );
    $result = $resolver->resolve($input);

    expect($result->origin)->not->toBeNull()
        ->and($result->origin->address)->toBe('1 rue de Rivoli, Paris')
        ->and($result->origin->lat)->toBe(48.855)
        ->and($result->origin->lng)->toBe(2.345)
        ->and($result->origin->radius)->toBe(5000);
});

it('returns empty zones when lat/lng/radius are null', function (): void {
    $resolver = new TargetingResolver;
    $input = new TargetingInput(method: 'address');
    $result = $resolver->resolve($input);

    expect($result->zones)->toBeEmpty()
        ->and($result->origin)->toBeNull();
});

// --- Cycle 5: Invalid method ---

it('throws exception for unknown targeting method', function (): void {
    $resolver = new TargetingResolver;
    $input = new TargetingInput(method: 'unknown');
    $resolver->resolve($input);
})->throws(\InvalidArgumentException::class, 'Unknown targeting method: unknown');

// --- Cycle 15: refreshFromInput ---

it('re-resolves zones from stored input for department method', function (): void {
    Department::factory()->create(['code' => '75', 'name' => 'Paris']);

    $stored = [
        'method' => 'department',
        'input' => [
            'method' => 'department',
            'departments' => ['75'],
            'postcodes' => [],
        ],
        'zones' => [
            ['code' => '75', 'type' => 'department', 'label' => 'Old Label', 'volume' => 500],
        ],
        'demographics' => null,
    ];

    $resolver = new TargetingResolver;
    $result = $resolver->refreshFromInput($stored);

    expect($result)->not->toBeNull()
        ->and($result->zones)->toHaveCount(1)
        ->and($result->zones[0]->label)->toBe('Paris')
        ->and($result->zones[0]->volume)->toBe(0);
});

it('re-resolves zones from stored input for postcode method', function (): void {
    $stored = [
        'method' => 'postcode',
        'input' => [
            'method' => 'postcode',
            'departments' => [],
            'postcodes' => ['75001', '75002'],
        ],
        'zones' => [],
        'demographics' => null,
    ];

    $resolver = new TargetingResolver;
    $result = $resolver->refreshFromInput($stored);

    expect($result)->not->toBeNull()
        ->and($result->zones)->toHaveCount(2)
        ->and($result->zones[0]->code)->toBe('75001');
});

it('preserves demographics during refresh', function (): void {
    Department::factory()->create(['code' => '75', 'name' => 'Paris']);

    $stored = [
        'method' => 'department',
        'input' => [
            'method' => 'department',
            'departments' => ['75'],
            'postcodes' => [],
            'gender' => 'F',
            'age_min' => 30,
            'age_max' => 60,
        ],
        'zones' => [],
        'demographics' => ['gender' => 'F', 'age_min' => 30, 'age_max' => 60],
    ];

    $resolver = new TargetingResolver;
    $result = $resolver->refreshFromInput($stored);

    expect($result->demographics->gender)->toBe('F')
        ->and($result->demographics->ageMin)->toBe(30)
        ->and($result->demographics->ageMax)->toBe(60);
});

it('returns null for targeting without input key', function (): void {
    $stored = [
        'method' => 'department',
        'zones' => [['code' => '75', 'type' => 'department', 'label' => 'Paris', 'volume' => 0]],
    ];

    $resolver = new TargetingResolver;
    $result = $resolver->refreshFromInput($stored);

    expect($result)->toBeNull();
});

// --- Commune method ---

it('resolves commune codes to IRIS zones from DB', function (): void {
    $department = Department::factory()->create(['code' => '17', 'name' => 'Charente-Maritime']);
    IrisZone::factory()->forDepartment($department)->create([
        'code' => '171090101',
        'name' => 'Centre',
        'commune_code' => '17109',
        'commune_name' => 'Clavette',
    ]);
    IrisZone::factory()->forDepartment($department)->create([
        'code' => '171090102',
        'name' => 'Nord',
        'commune_code' => '17109',
        'commune_name' => 'Clavette',
    ]);

    $resolver = new TargetingResolver;
    $input = new TargetingInput(method: 'commune', communes: ['17109']);
    $result = $resolver->resolve($input);

    expect($result->method)->toBe('commune')
        ->and($result->zones)->toHaveCount(2)
        ->and($result->zones[0]->type)->toBe('iris')
        ->and($result->zones[0]->code)->toBe('171090101')
        ->and($result->zones[0]->label)->toBe('Clavette - Centre')
        ->and($result->zones[1]->code)->toBe('171090102');
});

it('returns empty zones for empty communes array', function (): void {
    $resolver = new TargetingResolver;
    $input = new TargetingInput(method: 'commune', communes: []);
    $result = $resolver->resolve($input);

    expect($result->zones)->toBeEmpty();
});

it('resolves multiple communes to their IRIS zones', function (): void {
    $department = Department::factory()->create(['code' => '75', 'name' => 'Paris']);
    IrisZone::factory()->forDepartment($department)->create([
        'code' => '751010101',
        'name' => 'Louvre',
        'commune_code' => '75101',
        'commune_name' => 'Paris 1er',
    ]);
    IrisZone::factory()->forDepartment($department)->create([
        'code' => '751020101',
        'name' => 'Bourse',
        'commune_code' => '75102',
        'commune_name' => 'Paris 2e',
    ]);

    $resolver = new TargetingResolver;
    $input = new TargetingInput(method: 'commune', communes: ['75101', '75102']);
    $result = $resolver->resolve($input);

    expect($result->zones)->toHaveCount(2)
        ->and($result->zones[0]->label)->toBe('Paris 1er - Louvre')
        ->and($result->zones[1]->label)->toBe('Paris 2e - Bourse');
});

it('stores commune input in resolved targeting', function (): void {
    $resolver = new TargetingResolver;
    $input = new TargetingInput(method: 'commune', communes: ['17109']);
    $result = $resolver->resolve($input);

    expect($result->input->method)->toBe('commune')
        ->and($result->input->communes)->toBe(['17109']);
});

// --- IRIS method ---

it('resolves IRIS codes to zones from DB', function (): void {
    $department = Department::factory()->create(['code' => '75', 'name' => 'Paris']);
    IrisZone::factory()->forDepartment($department)->create([
        'code' => '751040101',
        'name' => 'Les Halles',
        'commune_name' => 'Paris 1er',
    ]);

    $resolver = new TargetingResolver;
    $input = new TargetingInput(method: 'iris', iris_codes: ['751040101']);
    $result = $resolver->resolve($input);

    expect($result->method)->toBe('iris')
        ->and($result->zones)->toHaveCount(1)
        ->and($result->zones[0]->type)->toBe('iris')
        ->and($result->zones[0]->code)->toBe('751040101')
        ->and($result->zones[0]->label)->toBe('Paris 1er - Les Halles');
});

it('returns empty zones for empty iris_codes array', function (): void {
    $resolver = new TargetingResolver;
    $input = new TargetingInput(method: 'iris', iris_codes: []);
    $result = $resolver->resolve($input);

    expect($result->zones)->toBeEmpty();
});

it('stores iris input in resolved targeting', function (): void {
    $resolver = new TargetingResolver;
    $input = new TargetingInput(method: 'iris', iris_codes: ['751040101']);
    $result = $resolver->resolve($input);

    expect($result->input->method)->toBe('iris')
        ->and($result->input->iris_codes)->toBe(['751040101']);
});
