<?php

declare(strict_types=1);

use App\Models\Department;
use App\Models\Partner;
use App\Models\PartnerPricing;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('estimates volume and pricing for department targeting', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    Department::factory()->create(['code' => '75', 'name' => 'Paris']);

    PartnerPricing::factory()->forPartner($partner)->default()->create([
        'router_price' => 0.03,
        'data_price' => 0.01,
        'ci_price' => 0.005,
    ]);

    $response = $this->postJson('/api/estimate', [
        'targeting' => [
            'method' => 'department',
            'departments' => ['75'],
        ],
    ]);

    $response->assertOk()
        ->assertJsonStructure(['data' => ['volume', 'unit_price', 'total_price', 'sms_count']]);
});

it('estimates volume and pricing for postcode targeting', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    PartnerPricing::factory()->forPartner($partner)->default()->create([
        'router_price' => 0.03,
        'data_price' => 0.01,
        'ci_price' => 0.005,
    ]);

    $response = $this->postJson('/api/estimate', [
        'targeting' => [
            'method' => 'postcode',
            'postcodes' => ['75001', '75002'],
        ],
    ]);

    $response->assertOk()
        ->assertJsonStructure(['data' => ['volume', 'unit_price', 'total_price', 'sms_count']]);
});

it('estimates volume and pricing for address targeting', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    PartnerPricing::factory()->forPartner($partner)->default()->create([
        'router_price' => 0.03,
        'data_price' => 0.01,
        'ci_price' => 0.005,
    ]);

    $response = $this->postJson('/api/estimate', [
        'targeting' => [
            'method' => 'address',
            'address' => '1 rue de Rivoli, Paris',
            'lat' => 48.8566,
            'lng' => 2.3522,
            'radius' => 5000,
        ],
    ]);

    $response->assertOk()
        ->assertJsonStructure(['data' => ['volume', 'unit_price', 'total_price', 'sms_count']]);
});

it('returns zero volume when stub driver resolves no zones', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    PartnerPricing::factory()->forPartner($partner)->default()->create();

    $response = $this->postJson('/api/estimate', [
        'targeting' => [
            'method' => 'postcode',
            'postcodes' => ['99999'],
        ],
    ]);

    $response->assertOk()
        ->assertJsonPath('data.volume', 0)
        ->assertJsonPath('data.total_price', null);
});

it('estimates without targeting for all-france volume', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    PartnerPricing::factory()->forPartner($partner)->default()->create();

    $this->postJson('/api/estimate', [])
        ->assertOk()
        ->assertJsonStructure(['data' => ['volume', 'unit_price', 'total_price', 'sms_count']]);
});

it('accepts empty departments for all-france estimate', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    PartnerPricing::factory()->forPartner($partner)->default()->create();

    $this->postJson('/api/estimate', [
        'targeting' => ['method' => 'department', 'departments' => []],
    ])->assertOk()
        ->assertJsonStructure(['data' => ['volume', 'unit_price', 'total_price', 'sms_count']]);
});

it('validates targeting method when targeting is provided', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $this->postJson('/api/estimate', [
        'targeting' => ['method' => 'invalid'],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['targeting.method']);
});

it('admin without partner_id returns volume without pricing', function (): void {
    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->postJson('/api/estimate', [
        'targeting' => ['method' => 'postcode', 'postcodes' => ['75001']],
    ]);

    $response->assertOk()
        ->assertJsonPath('data.unit_price', null)
        ->assertJsonPath('data.total_price', null);
});

it('admin can provide partner_id', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    PartnerPricing::factory()->forPartner($partner)->default()->create();

    $response = $this->postJson('/api/estimate', [
        'targeting' => ['method' => 'postcode', 'postcodes' => ['75001']],
        'partner_id' => $partner->id,
    ]);

    $response->assertOk()
        ->assertJsonStructure(['data' => ['volume', 'unit_price', 'total_price', 'sms_count']]);
});

it('non-admin cannot provide partner_id', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $this->postJson('/api/estimate', [
        'targeting' => ['method' => 'postcode', 'postcodes' => ['75001']],
        'partner_id' => $partner->id,
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['partner_id']);
});

it('returns 401 when unauthenticated', function (): void {
    $this->postJson('/api/estimate', [
        'targeting' => ['method' => 'postcode', 'postcodes' => ['75001']],
    ])->assertUnauthorized();
});

// S3.4 — next_tier in estimate response (via mocked sender to control volume)
it('estimate response includes next_tier when volume lands in lower tier', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    PartnerPricing::factory()->forPartner($partner)->default()->create([
        'volume_min' => 0,
        'volume_max' => 5000,
        'router_price' => 0.03,
        'data_price' => 0.01,
        'ci_price' => 0.005,
    ]);
    PartnerPricing::factory()->forPartner($partner)->create([
        'volume_min' => 5001,
        'volume_max' => null,
        'router_price' => 0.02,
        'data_price' => 0.008,
        'ci_price' => 0.004,
    ]);

    // Mock sender to return a controlled volume
    $mock = Mockery::mock(\App\Contracts\CampaignSenderInterface::class);
    $mock->shouldReceive('estimateVolumeFromTargeting')->andReturn(3000);
    app()->instance(\App\Contracts\CampaignSenderInterface::class, $mock);

    $response = $this->postJson('/api/estimate', [
        'targeting' => ['method' => 'postcode', 'postcodes' => ['75001']],
    ]);

    $response->assertOk()
        ->assertJsonStructure(['data' => ['volume', 'next_tier' => ['volume_threshold', 'unit_price', 'savings_pct']]])
        ->assertJsonPath('data.next_tier.volume_threshold', 5001);
});

it('estimate response has next_tier null when on last tier', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    PartnerPricing::factory()->forPartner($partner)->default()->create([
        'volume_min' => 0,
        'volume_max' => null,
        'router_price' => 0.03,
        'data_price' => 0.01,
        'ci_price' => 0.005,
    ]);

    $response = $this->postJson('/api/estimate', [
        'targeting' => ['method' => 'postcode', 'postcodes' => ['75001']],
    ]);

    $response->assertOk()
        ->assertJsonPath('data.next_tier', null);
});
