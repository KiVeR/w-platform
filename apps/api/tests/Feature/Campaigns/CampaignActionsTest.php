<?php

declare(strict_types=1);

use App\Contracts\CampaignSenderInterface;
use App\DTOs\SendResult;
use App\Enums\CampaignStatus;
use App\Models\Campaign;
use App\Models\InterestGroup;
use App\Models\Partner;
use App\Models\PartnerPricing;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// ==================== ESTIMATE ====================

it('estimates volume and cost from targeting postcodes', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    PartnerPricing::factory()->forPartner($partner)->default()->create([
        'router_price' => 0.03,
        'data_price' => 0.01,
        'ci_price' => 0.005,
    ]);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'targeting' => [
            'geo' => [
                'postcodes' => [
                    ['code' => '75001', 'volume' => 500],
                    ['code' => '75002', 'volume' => 300],
                ],
            ],
        ],
    ]);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/estimate");

    $response->assertOk()
        ->assertJsonPath('data.volume_estimated', 800)
        ->assertJsonPath('data.unit_price', 0.04)
        ->assertJsonPath('data.total_price', 32);
});

it('estimates with ci_price when campaign has interest groups', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    PartnerPricing::factory()->forPartner($partner)->default()->create([
        'router_price' => 0.03,
        'data_price' => 0.01,
        'ci_price' => 0.005,
    ]);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'targeting' => [
            'geo' => ['postcodes' => [['code' => '75001', 'volume' => 1000]]],
        ],
    ]);

    $group = InterestGroup::factory()->create();
    $campaign->interestGroups()->attach($group->id, ['index' => 0, 'operator' => 'AND']);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/estimate");

    $response->assertOk()
        ->assertJsonPath('data.volume_estimated', 1000)
        ->assertJsonPath('data.unit_price', 0.045)
        ->assertJsonPath('data.total_price', 45);
});

it('estimates zero volume when no targeting', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'targeting' => null,
    ]);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/estimate");

    $response->assertOk()
        ->assertJsonPath('data.volume_estimated', 0);
});

it('denies estimate on another partner campaign', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner2)->create();

    $this->postJson("/api/campaigns/{$campaign->id}/estimate")->assertForbidden();
});

// ==================== SCHEDULE ====================

it('schedules a campaign with valid data', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => 'Hello World',
        'sender' => 'WELLPACK',
    ]);

    $scheduledAt = now()->addDay()->format('Y-m-d H:i:s');

    $response = $this->postJson("/api/campaigns/{$campaign->id}/schedule", [
        'scheduled_at' => $scheduledAt,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.status', 'scheduled');
});

it('rejects schedule without message', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => null,
        'sender' => 'WELLPACK',
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/schedule", [
        'scheduled_at' => now()->addDay()->format('Y-m-d H:i:s'),
    ])->assertUnprocessable();
});

it('rejects schedule without sender', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => 'Hello',
        'sender' => null,
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/schedule", [
        'scheduled_at' => now()->addDay()->format('Y-m-d H:i:s'),
    ])->assertUnprocessable();
});

it('rejects schedule with past date', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => 'Hello',
        'sender' => 'WELLPACK',
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/schedule", [
        'scheduled_at' => now()->subDay()->format('Y-m-d H:i:s'),
    ])->assertUnprocessable();
});

it('denies schedule on another partner campaign', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner2)->create([
        'message' => 'Hello',
        'sender' => 'WELLPACK',
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/schedule", [
        'scheduled_at' => now()->addDay()->format('Y-m-d H:i:s'),
    ])->assertForbidden();
});

// ==================== SEND ====================

it('sends a campaign via the default driver', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    PartnerPricing::factory()->forPartner($partner)->default()->create([
        'router_price' => 0.03,
        'data_price' => 0.01,
        'ci_price' => 0.005,
    ]);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => 'Promo SMS',
        'sender' => 'WELLPACK',
        'volume_estimated' => 500,
    ]);

    $mockSender = Mockery::mock(CampaignSenderInterface::class);
    $mockSender->shouldReceive('send')
        ->once()
        ->andReturn(new SendResult(success: true, externalId: 'test-uuid-123'));

    $this->app->instance(CampaignSenderInterface::class, $mockSender);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/send");

    $response->assertOk()
        ->assertJsonPath('data.status', 'sending');

    $campaign->refresh();
    expect($campaign->trigger_campaign_uuid)->toBe('test-uuid-123');
});

it('rejects send without message', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => null,
        'sender' => 'WELLPACK',
        'volume_estimated' => 500,
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/send")
        ->assertUnprocessable();
});

it('rejects send without sender', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => 'Hello',
        'sender' => null,
        'volume_estimated' => 500,
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/send")
        ->assertUnprocessable();
});

it('rejects send with zero volume', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => 'Hello',
        'sender' => 'WELLPACK',
        'volume_estimated' => 0,
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/send")
        ->assertUnprocessable();
});

it('rejects send on already sent campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'message' => 'Hello',
        'sender' => 'WELLPACK',
        'volume_estimated' => 500,
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/send")
        ->assertForbidden();
});

it('handles sender failure gracefully', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    PartnerPricing::factory()->forPartner($partner)->default()->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => 'Promo SMS',
        'sender' => 'WELLPACK',
        'volume_estimated' => 500,
    ]);

    $mockSender = Mockery::mock(CampaignSenderInterface::class);
    $mockSender->shouldReceive('send')
        ->once()
        ->andReturn(new SendResult(success: false, externalId: null, error: 'API timeout'));

    $this->app->instance(CampaignSenderInterface::class, $mockSender);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/send");

    $response->assertStatus(502)
        ->assertJsonPath('error', 'API timeout');

    $campaign->refresh();
    expect($campaign->status)->toBe(CampaignStatus::DRAFT);
});

it('denies send on another partner campaign', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner2)->create([
        'message' => 'Hello',
        'sender' => 'WELLPACK',
        'volume_estimated' => 500,
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/send")->assertForbidden();
});

// ==================== CANCEL ====================

it('cancels a draft campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create();

    $response = $this->postJson("/api/campaigns/{$campaign->id}/cancel");

    $response->assertOk()
        ->assertJsonPath('data.status', 'cancelled');
});

it('cancels a scheduled campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->scheduled()->create();

    $response = $this->postJson("/api/campaigns/{$campaign->id}/cancel");

    $response->assertOk()
        ->assertJsonPath('data.status', 'cancelled');
});

it('denies cancel on sent campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create();

    $this->postJson("/api/campaigns/{$campaign->id}/cancel")
        ->assertForbidden();
});

it('denies cancel on another partner campaign', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();
    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner2)->create();

    $this->postJson("/api/campaigns/{$campaign->id}/cancel")->assertForbidden();
});
