<?php

declare(strict_types=1);

use App\Enums\CampaignStatus;
use App\Models\Campaign;
use App\Models\Partner;
use App\Models\User;
use App\Services\CampaignStats\Drivers\StubDriver;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('returns stats for sent campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'volume_estimated' => 1000,
    ]);

    $driver = new StubDriver;
    $stats = $driver->getStats($campaign);

    expect($stats)->not->toBeNull()
        ->and($stats->sent)->toBe(1000)
        ->and($stats->deliverabilityRate)->toBe(95.0);
});

it('returns null for non-sent campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::DRAFT,
    ]);

    $driver = new StubDriver;
    $stats = $driver->getStats($campaign);

    expect($stats)->toBeNull();
});
