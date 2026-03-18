<?php

declare(strict_types=1);

use App\Console\Commands\BackfillCampaignStatsCommand;
use App\Enums\CampaignRecipientStatus;
use App\Models\Campaign;
use App\Models\CampaignRecipient;

it('is registered as an artisan command', function (): void {
    $commands = Artisan::all();

    expect($commands)->toHaveKey('app:backfill-campaign-stats');
    expect($commands['app:backfill-campaign-stats'])->toBeInstanceOf(BackfillCampaignStatsCommand::class);
});

it('recomputes volume_sent from non-queued recipients', function (): void {
    $campaign = Campaign::factory()->sent()->create([
        'volume_sent' => 0,
    ]);

    CampaignRecipient::factory()->for($campaign)->create([
        'status' => CampaignRecipientStatus::Delivered,
    ]);
    CampaignRecipient::factory()->for($campaign)->create([
        'status' => CampaignRecipientStatus::Rejected,
    ]);
    CampaignRecipient::factory()->for($campaign)->create([
        'status' => CampaignRecipientStatus::Queued,
    ]);

    $this->artisan('app:backfill-campaign-stats')
        ->expectsOutputToContain('Scanned 1 sent campaign(s); updated 1 campaign(s).')
        ->assertSuccessful();

    expect($campaign->refresh()->volume_sent)->toBe(2);
});

it('supports dry-run without persisting changes', function (): void {
    $campaign = Campaign::factory()->sent()->create([
        'volume_sent' => 0,
    ]);

    CampaignRecipient::factory()->for($campaign)->count(2)->create([
        'status' => CampaignRecipientStatus::Delivered,
    ]);

    $this->artisan('app:backfill-campaign-stats', ['--dry-run' => true])
        ->expectsOutputToContain("Would update campaign #{$campaign->id} volume_sent: 0 -> 2")
        ->expectsOutputToContain('Scanned 1 sent campaign(s); would update 1 campaign(s).')
        ->assertSuccessful();

    expect($campaign->refresh()->volume_sent)->toBe(0);
});
