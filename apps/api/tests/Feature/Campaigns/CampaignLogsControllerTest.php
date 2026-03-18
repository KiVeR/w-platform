<?php

declare(strict_types=1);

use App\Models\Campaign;
use App\Models\CampaignLog;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('lists campaign logs ordered by newest first', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $campaign = Campaign::factory()->create();
    $otherCampaign = Campaign::factory()->create();

    $older = CampaignLog::factory()->for($campaign)->create([
        'data' => ['event' => 'queued'],
        'created_at' => now()->subMinute(),
    ]);

    $newer = CampaignLog::factory()->for($campaign)->create([
        'data' => ['event' => 'dispatched'],
        'created_at' => now(),
    ]);

    CampaignLog::factory()->for($otherCampaign)->create([
        'data' => ['event' => 'ignored'],
    ]);

    $response = $this->getJson("/api/campaigns/{$campaign->id}/logs");

    $response->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.id', $newer->id)
        ->assertJsonPath('data.0.data.event', 'dispatched')
        ->assertJsonPath('data.1.id', $older->id)
        ->assertJsonPath('data.1.data.event', 'queued');
});

it('denies partner from listing another partner campaign logs', function (): void {
    $partner = Partner::factory()->create();
    $otherPartner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($otherPartner)->create();

    $this->getJson("/api/campaigns/{$campaign->id}/logs")
        ->assertForbidden();
});
