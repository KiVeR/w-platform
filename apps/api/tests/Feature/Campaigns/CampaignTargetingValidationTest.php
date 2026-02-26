<?php

declare(strict_types=1);

use App\Models\Department;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);

    $partner = Partner::factory()->create();
    $this->user = User::factory()->forPartner($partner)->create();
    $this->user->assignRole('partner');
    Passport::actingAs($this->user);

    $this->basePayload = [
        'type' => 'prospection',
        'channel' => 'sms',
        'name' => 'Test Targeting',
    ];
});

// --- Rejection tests ---

it('rejects targeting without method', function (): void {
    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => ['departments' => ['75']],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['targeting.method']);
});

it('rejects department targeting without departments array', function (): void {
    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => ['method' => 'department'],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['targeting.departments']);
});

it('rejects department targeting with invalid department code', function (): void {
    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => [
            'method' => 'department',
            'departments' => ['INVALID'],
        ],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['targeting.departments.0']);
});

it('rejects postcode targeting without postcodes array', function (): void {
    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => ['method' => 'postcode'],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['targeting.postcodes']);
});

it('rejects postcode targeting with invalid postcode format', function (): void {
    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => [
            'method' => 'postcode',
            'postcodes' => ['123'],
        ],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['targeting.postcodes.0']);
});

it('rejects address targeting without lat/lng/radius', function (): void {
    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => [
            'method' => 'address',
            'address' => '1 rue de Rivoli',
        ],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['targeting.lat', 'targeting.lng', 'targeting.radius']);
});

it('rejects radius below 100', function (): void {
    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => [
            'method' => 'address',
            'address' => '1 rue de Rivoli',
            'lat' => 48.85,
            'lng' => 2.34,
            'radius' => 50,
        ],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['targeting.radius']);
});

it('rejects radius above 50000', function (): void {
    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => [
            'method' => 'address',
            'address' => '1 rue de Rivoli',
            'lat' => 48.85,
            'lng' => 2.34,
            'radius' => 100000,
        ],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['targeting.radius']);
});

it('rejects age_min below 18', function (): void {
    Department::factory()->create(['code' => '75', 'name' => 'Paris']);

    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => [
            'method' => 'department',
            'departments' => ['75'],
            'age_min' => 10,
        ],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['targeting.age_min']);
});

it('rejects age_max below age_min', function (): void {
    Department::factory()->create(['code' => '75', 'name' => 'Paris']);

    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => [
            'method' => 'department',
            'departments' => ['75'],
            'age_min' => 30,
            'age_max' => 20,
        ],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['targeting.age_max']);
});

// --- Acceptance tests ---

it('accepts valid department targeting', function (): void {
    Department::factory()->create(['code' => '75', 'name' => 'Paris']);
    Department::factory()->create(['code' => '69', 'name' => 'Rhône']);

    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => [
            'method' => 'department',
            'departments' => ['75', '69'],
        ],
    ])->assertCreated();
});

it('accepts valid postcode targeting', function (): void {
    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => [
            'method' => 'postcode',
            'postcodes' => ['75001', '75002'],
        ],
    ])->assertCreated();
});

it('accepts targeting with demographics', function (): void {
    Department::factory()->create(['code' => '75', 'name' => 'Paris']);

    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => [
            'method' => 'department',
            'departments' => ['75'],
            'gender' => 'M',
            'age_min' => 25,
            'age_max' => 50,
        ],
    ])->assertCreated();
});

// --- Commune method validation ---

it('rejects commune targeting without communes array', function (): void {
    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => ['method' => 'commune'],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['targeting.communes']);
});

it('rejects commune targeting with invalid commune code format', function (): void {
    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => [
            'method' => 'commune',
            'communes' => ['ABC'],
        ],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['targeting.communes.0']);
});

it('accepts valid commune targeting', function (): void {
    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => [
            'method' => 'commune',
            'communes' => ['17109', '75056'],
        ],
    ])->assertCreated();
});

// --- IRIS method validation ---

it('rejects iris targeting without iris_codes array', function (): void {
    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => ['method' => 'iris'],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['targeting.iris_codes']);
});

it('rejects iris targeting with invalid code format', function (): void {
    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => [
            'method' => 'iris',
            'iris_codes' => ['12345'],
        ],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['targeting.iris_codes.0']);
});

it('accepts valid iris targeting', function (): void {
    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => [
            'method' => 'iris',
            'iris_codes' => ['751040101', '751040102'],
        ],
    ])->assertCreated();
});

it('accepts targeting with null gender', function (): void {
    Department::factory()->create(['code' => '75', 'name' => 'Paris']);

    $this->postJson('/api/campaigns', [
        ...$this->basePayload,
        'targeting' => [
            'method' => 'department',
            'departments' => ['75'],
            'gender' => null,
        ],
    ])->assertCreated();
});
