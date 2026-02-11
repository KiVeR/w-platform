<?php

declare(strict_types=1);

use App\Models\Campaign;
use App\Models\Department;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->partner = Partner::factory()->create();
    $this->user = User::factory()->forPartner($this->partner)->create();
    $this->user->assignRole('partner');
    Passport::actingAs($this->user);
});

it('normalizes department targeting on store', function (): void {
    Department::factory()->create(['code' => '75', 'name' => 'Paris']);

    $response = $this->postJson('/api/campaigns', [
        'type' => 'prospection',
        'channel' => 'sms',
        'name' => 'Test Normalize',
        'targeting' => [
            'method' => 'department',
            'departments' => ['75'],
        ],
    ]);

    $response->assertCreated();

    $campaign = Campaign::first();
    $targeting = $campaign->targeting;

    expect($targeting['method'])->toBe('department')
        ->and($targeting['input']['method'])->toBe('department')
        ->and($targeting['input']['departments'])->toBe(['75'])
        ->and($targeting['zones'])->toHaveCount(1)
        ->and($targeting['zones'][0]['code'])->toBe('75')
        ->and($targeting['zones'][0]['type'])->toBe('department')
        ->and($targeting['zones'][0]['label'])->toBe('Paris');
});

it('normalizes postcode targeting on store', function (): void {
    $response = $this->postJson('/api/campaigns', [
        'type' => 'prospection',
        'channel' => 'sms',
        'name' => 'Test Postcode',
        'targeting' => [
            'method' => 'postcode',
            'postcodes' => ['75001', '75002'],
        ],
    ]);

    $response->assertCreated();

    $campaign = Campaign::first();
    $targeting = $campaign->targeting;

    expect($targeting['method'])->toBe('postcode')
        ->and($targeting['zones'])->toHaveCount(2)
        ->and($targeting['zones'][0]['code'])->toBe('75001')
        ->and($targeting['zones'][0]['type'])->toBe('postcode');
});

it('normalizes targeting on update', function (): void {
    Department::factory()->create(['code' => '69', 'name' => 'Rhône']);

    $campaign = Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create();

    $this->putJson("/api/campaigns/{$campaign->id}", [
        'targeting' => [
            'method' => 'department',
            'departments' => ['69'],
        ],
    ])->assertOk();

    $campaign->refresh();
    $targeting = $campaign->targeting;

    expect($targeting['method'])->toBe('department')
        ->and($targeting['zones'][0]['code'])->toBe('69')
        ->and($targeting['zones'][0]['label'])->toBe('Rhône');
});

it('stores null targeting when not provided', function (): void {
    $response = $this->postJson('/api/campaigns', [
        'type' => 'prospection',
        'channel' => 'sms',
        'name' => 'No Targeting',
    ]);

    $response->assertCreated();

    $campaign = Campaign::first();
    expect($campaign->targeting)->toBeNull();
});

it('stores demographics in canonical targeting', function (): void {
    Department::factory()->create(['code' => '75', 'name' => 'Paris']);

    $response = $this->postJson('/api/campaigns', [
        'type' => 'prospection',
        'channel' => 'sms',
        'name' => 'With Demographics',
        'targeting' => [
            'method' => 'department',
            'departments' => ['75'],
            'gender' => 'M',
            'age_min' => 25,
            'age_max' => 50,
        ],
    ]);

    $response->assertCreated();

    $campaign = Campaign::first();
    $targeting = $campaign->targeting;

    expect($targeting['demographics']['gender'])->toBe('M')
        ->and($targeting['demographics']['age_min'])->toBe(25)
        ->and($targeting['demographics']['age_max'])->toBe(50);
});
