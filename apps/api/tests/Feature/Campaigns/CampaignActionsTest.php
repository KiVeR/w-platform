<?php

declare(strict_types=1);

use App\Contracts\CampaignSenderInterface;
use App\DTOs\SendResult;
use App\Enums\CampaignStatus;
use App\Models\Campaign;
use App\Models\Partner;
use App\Models\PartnerPricing;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// ==================== SCHEDULE ====================

it('schedules a campaign with valid data', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '1000.00']);
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    PartnerPricing::factory()->forPartner($partner)->default()->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => 'Hello World',
        'sender' => 'WELLPACK',
        'targeting' => [
            'zones' => [
                ['code' => '75001', 'type' => 'postcode', 'label' => '75001', 'volume' => 500],
            ],
        ],
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
    $partner = Partner::factory()->create(['euro_credits' => '1000.00']);
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
    ]);

    $mockSender = Mockery::mock(CampaignSenderInterface::class);
    $mockSender->shouldReceive('estimateVolumeFromTargeting')
        ->once()
        ->andReturn(500);
    $mockSender->shouldReceive('send')
        ->once()
        ->andReturn(new SendResult(success: true, externalId: 'test-uuid-123'));

    $this->app->instance(CampaignSenderInterface::class, $mockSender);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/send");

    $response->assertOk()
        ->assertJsonPath('data.status', 'sending');

    $campaign->refresh();
    expect($campaign->external_id)->toBe('test-uuid-123');
});

it('rejects send without message', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => null,
        'sender' => 'WELLPACK',
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
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/send")
        ->assertForbidden();
});

it('handles sender failure gracefully', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '1000.00']);
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    PartnerPricing::factory()->forPartner($partner)->default()->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => 'Promo SMS',
        'sender' => 'WELLPACK',
    ]);

    $mockSender = Mockery::mock(CampaignSenderInterface::class);
    $mockSender->shouldReceive('estimateVolumeFromTargeting')
        ->once()
        ->andReturn(500);
    $mockSender->shouldReceive('send')
        ->once()
        ->andReturn(new SendResult(success: false, externalId: null, error: 'API timeout'));

    $this->app->instance(CampaignSenderInterface::class, $mockSender);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/send");

    $response->assertStatus(502)
        ->assertJsonPath('message', 'API timeout');

    $campaign->refresh();
    expect($campaign->status)->toBe(CampaignStatus::FAILED);
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

// ==================== RSMS.CO VALIDATION ====================

it('rejects send with rsms.co domain in message', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => 'Visit rsms.co/promo',
        'sender' => 'WELLPACK',
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/send")
        ->assertUnprocessable()
        ->assertJsonPath('errors.message.0', 'The domain rsms.co is not allowed.');
});

it('rejects schedule with rsms.co domain in message', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => 'Click rsms.co/offer',
        'sender' => 'WELLPACK',
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/schedule", [
        'scheduled_at' => now()->addDay()->format('Y-m-d H:i:s'),
    ])->assertUnprocessable()
        ->assertJsonPath('errors.message.0', 'The domain rsms.co is not allowed.');
});
