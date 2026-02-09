<?php

declare(strict_types=1);

use App\Contracts\CampaignStatsProviderInterface;
use App\DTOs\CampaignStats;
use App\Enums\CampaignStatus;
use App\Models\Campaign;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('returns 200 for sent campaign after 72h', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::SENT,
        'sent_at' => now()->subHours(73),
        'volume_estimated' => 1000,
    ]);

    $response = $this->getJson("/api/campaigns/{$campaign->id}/stats");

    $response->assertOk()
        ->assertJsonStructure(['data' => ['sent', 'delivered', 'undeliverable', 'rejected', 'expired', 'stop', 'clicks', 'deliverability_rate', 'ctr']]);
});

it('returns correct stats values', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::SENT,
        'sent_at' => now()->subHours(73),
        'volume_estimated' => 1000,
    ]);

    $mockStats = new CampaignStats(
        sent: 1000, delivered: 950, undeliverable: 20, rejected: 10, expired: 5, stop: 15,
        clicks: 125, deliverabilityRate: 95.0, ctr: 13.16,
    );

    $mockProvider = Mockery::mock(CampaignStatsProviderInterface::class);
    $mockProvider->shouldReceive('getStats')->once()->andReturn($mockStats);
    $this->app->instance(CampaignStatsProviderInterface::class, $mockProvider);

    $response = $this->getJson("/api/campaigns/{$campaign->id}/stats");

    $response->assertOk()
        ->assertJsonPath('data.sent', 1000)
        ->assertJsonPath('data.delivered', 950)
        ->assertJsonPath('data.clicks', 125)
        ->assertJsonPath('data.ctr', 13.16);
});

it('returns 422 for draft campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create();

    $response = $this->getJson("/api/campaigns/{$campaign->id}/stats");

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'Stats only available for sent campaigns.');
});

it('returns 422 for cancelled campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::CANCELLED,
    ]);

    $response = $this->getJson("/api/campaigns/{$campaign->id}/stats");

    $response->assertUnprocessable();
});

it('returns 422 before 72h delay with available_at', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $sentAt = now()->subHours(10);
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::SENT,
        'sent_at' => $sentAt,
    ]);

    $response = $this->getJson("/api/campaigns/{$campaign->id}/stats");

    $response->assertUnprocessable()
        ->assertJsonPath('message', 'Stats not yet available.')
        ->assertJsonStructure(['available_at']);
});

it('includes available_at in 422 response', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $sentAt = now()->subHours(24);
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::SENT,
        'sent_at' => $sentAt,
    ]);

    $response = $this->getJson("/api/campaigns/{$campaign->id}/stats");

    $response->assertUnprocessable();
    $data = $response->json();
    expect($data['available_at'])->not->toBeNull();
});

it('returns 503 when provider returns null', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::SENT,
        'sent_at' => now()->subHours(73),
    ]);

    $mockProvider = Mockery::mock(CampaignStatsProviderInterface::class);
    $mockProvider->shouldReceive('getStats')->once()->andReturnNull();
    $this->app->instance(CampaignStatsProviderInterface::class, $mockProvider);

    $response = $this->getJson("/api/campaigns/{$campaign->id}/stats");

    $response->assertStatus(503)
        ->assertJsonPath('message', 'Stats retrieval failed.');
});

it('allows admin to view stats', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::SENT,
        'sent_at' => now()->subHours(73),
        'volume_estimated' => 1000,
    ]);

    $this->getJson("/api/campaigns/{$campaign->id}/stats")->assertOk();
});

it('allows same partner user to view stats', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::SENT,
        'sent_at' => now()->subHours(73),
        'volume_estimated' => 1000,
    ]);

    $this->getJson("/api/campaigns/{$campaign->id}/stats")->assertOk();
});

it('denies another partner from viewing stats', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner2)->create([
        'status' => CampaignStatus::SENT,
        'sent_at' => now()->subHours(73),
    ]);

    $this->getJson("/api/campaigns/{$campaign->id}/stats")->assertForbidden();
});

it('returns correct resource format', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::SENT,
        'sent_at' => now()->subHours(73),
        'volume_estimated' => 500,
    ]);

    $response = $this->getJson("/api/campaigns/{$campaign->id}/stats");

    $response->assertOk()
        ->assertJsonStructure([
            'data' => ['sent', 'delivered', 'undeliverable', 'rejected', 'expired', 'stop', 'clicks', 'deliverability_rate', 'ctr'],
        ]);
});

it('is accessible via GET route', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::SENT,
        'sent_at' => now()->subHours(73),
        'volume_estimated' => 1000,
    ]);

    $this->getJson("/api/campaigns/{$campaign->id}/stats")->assertOk();
});
