<?php

declare(strict_types=1);

use App\Models\Campaign;
use App\Models\Partner;
use App\Models\User;
use App\Services\CampaignSending\Drivers\StubDriver;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('returns success on send', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create();

    $driver = new StubDriver;
    $result = $driver->send($campaign);

    expect($result->success)->toBeTrue()
        ->and($result->externalId)->toBe('stub-'.$campaign->id);
});

it('estimates volume from targeting', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'targeting' => [
            'geo' => ['postcodes' => [
                ['code' => '75001', 'volume' => 300],
                ['code' => '75002', 'volume' => 200],
            ]],
        ],
    ]);

    $driver = new StubDriver;
    expect($driver->estimateVolume($campaign))->toBe(500);
});

it('returns zero volume without targeting', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'targeting' => null,
    ]);

    $driver = new StubDriver;
    expect($driver->estimateVolume($campaign))->toBe(0);
});
