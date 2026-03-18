<?php

declare(strict_types=1);

use App\Enums\CampaignRecipientStatus;
use App\Enums\CampaignStatus;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\Partner;
use App\Models\User;
use App\Services\CampaignStats\Drivers\LocalCampaignStatsDriver;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->driver = new LocalCampaignStatsDriver;
});

it('returns null for non-sent campaigns', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::DRAFT,
    ]);

    expect($this->driver->getStats($campaign))->toBeNull();
});

it('computes legacy-compatible stats from local recipients', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create();

    CampaignRecipient::factory()->for($campaign)->delivered()->create(['short_url_click' => 2]);
    CampaignRecipient::factory()->for($campaign)->create([
        'status' => CampaignRecipientStatus::Delivered,
        'short_url_click' => 0,
    ]);
    CampaignRecipient::factory()->for($campaign)->create([
        'status' => CampaignRecipientStatus::Rejected,
        'short_url_click' => 1,
    ]);
    CampaignRecipient::factory()->for($campaign)->create([
        'status' => CampaignRecipientStatus::Queued,
        'short_url_click' => 3,
    ]);

    $stats = $this->driver->getStats($campaign);

    expect($stats)->not->toBeNull()
        ->and($stats->sent)->toBe(3)
        ->and($stats->delivered)->toBe(2)
        ->and($stats->clicks)->toBe(2)
        ->and($stats->undeliverable)->toBe(0)
        ->and($stats->rejected)->toBe(0)
        ->and($stats->expired)->toBe(0)
        ->and($stats->stop)->toBe(0)
        ->and($stats->deliverabilityRate)->toBe(66.67)
        ->and($stats->ctr)->toBe(100.0);
});
