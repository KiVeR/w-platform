<?php

declare(strict_types=1);

use App\Contracts\CampaignSenderInterface;
use App\DTOs\SendResult;
use App\Enums\CampaignStatus;
use App\Jobs\ProcessCampaignSendingJob;
use App\Models\Campaign;
use App\Models\Partner;
use App\Models\PartnerPricing;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// ==================== SEND — CREDITS ====================

it('deducts credits on successful send', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);
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
        ->andReturn(new SendResult(success: true, externalId: 'test-123'));
    $this->app->instance(CampaignSenderInterface::class, $mockSender);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/send");

    $response->assertOk();

    $partner->refresh();
    // unit_price = 0.03 + 0.01 = 0.04, total = 0.04 * 500 = 20
    expect((float) $partner->euro_credits)->toBe(80.0);
});

it('verifies balance in DB after send deduction', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '50.00']);
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
        ->andReturn(new SendResult(success: true, externalId: 'test-456'));
    $this->app->instance(CampaignSenderInterface::class, $mockSender);

    $this->postJson("/api/campaigns/{$campaign->id}/send")->assertOk();

    $this->assertDatabaseHas('partners', [
        'id' => $partner->id,
        'euro_credits' => '30.00',
    ]);
});

it('rejects send when credits are insufficient', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '5.00']);
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
        'targeting' => [
            'zones' => [['code' => '75001', 'type' => 'postcode', 'label' => '75001', 'volume' => 500]],
        ],
    ]);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/send");

    $response->assertUnprocessable()
        ->assertJsonStructure(['message', 'errors' => ['euro_credits']]);

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(5.0);
});

it('does not change credits when send is insufficient', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '5.00']);
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
        'targeting' => [
            'zones' => [['code' => '75001', 'type' => 'postcode', 'label' => '75001', 'volume' => 500]],
        ],
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/send")->assertUnprocessable();

    $this->assertDatabaseHas('partners', [
        'id' => $partner->id,
        'euro_credits' => '5.00',
    ]);
});

it('skips credit deduction for demo campaign on send', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    PartnerPricing::factory()->forPartner($partner)->default()->create([
        'router_price' => 0.03,
        'data_price' => 0.01,
        'ci_price' => 0.005,
    ]);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->demo()->create([
        'message' => 'Test Demo',
        'sender' => 'WELLPACK',
    ]);

    $mockSender = Mockery::mock(CampaignSenderInterface::class);
    $mockSender->shouldReceive('estimateVolumeFromTargeting')
        ->once()
        ->andReturn(500);
    $mockSender->shouldReceive('send')
        ->once()
        ->andReturn(new SendResult(success: true, externalId: 'demo-123'));
    $this->app->instance(CampaignSenderInterface::class, $mockSender);

    $this->postJson("/api/campaigns/{$campaign->id}/send")->assertOk();

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(100.0);
});

it('skips credit deduction when total_price is zero on send', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    PartnerPricing::factory()->forPartner($partner)->default()->create([
        'router_price' => 0,
        'data_price' => 0,
        'ci_price' => 0,
    ]);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => 'Free SMS',
        'sender' => 'WELLPACK',
    ]);

    $mockSender = Mockery::mock(CampaignSenderInterface::class);
    $mockSender->shouldReceive('estimateVolumeFromTargeting')
        ->once()
        ->andReturn(500);
    $mockSender->shouldReceive('send')
        ->once()
        ->andReturn(new SendResult(success: true, externalId: 'free-123'));
    $this->app->instance(CampaignSenderInterface::class, $mockSender);

    $this->postJson("/api/campaigns/{$campaign->id}/send")->assertOk();

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(100.0);
});

it('refunds credits on send failure', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);
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
        ->andReturn(new SendResult(success: false, error: 'API down'));
    $this->app->instance(CampaignSenderInterface::class, $mockSender);

    $this->postJson("/api/campaigns/{$campaign->id}/send")->assertStatus(502);

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(100.0);
});

it('verifies balance restored in DB after send failure', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);
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
        ->andReturn(new SendResult(success: false, error: 'API down'));
    $this->app->instance(CampaignSenderInterface::class, $mockSender);

    $this->postJson("/api/campaigns/{$campaign->id}/send")->assertStatus(502);

    $this->assertDatabaseHas('partners', [
        'id' => $partner->id,
        'euro_credits' => '100.00',
    ]);
});

// ==================== SCHEDULE — CREDITS ====================

it('deducts credits on schedule', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);
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
        'targeting' => [
            'zones' => [['code' => '75001', 'type' => 'postcode', 'label' => '75001', 'volume' => 500]],
        ],
    ]);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/schedule", [
        'scheduled_at' => now()->addDay()->format('Y-m-d H:i:s'),
    ]);

    $response->assertOk()->assertJsonPath('data.status', 'scheduled');

    $partner->refresh();
    // unit_price = 0.03 + 0.01 = 0.04, total = 0.04 * 500 = 20
    expect((float) $partner->euro_credits)->toBe(80.0);
});

it('verifies balance in DB after schedule deduction', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);
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
        'targeting' => [
            'zones' => [['code' => '75001', 'type' => 'postcode', 'label' => '75001', 'volume' => 500]],
        ],
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/schedule", [
        'scheduled_at' => now()->addDay()->format('Y-m-d H:i:s'),
    ])->assertOk();

    $this->assertDatabaseHas('partners', [
        'id' => $partner->id,
        'euro_credits' => '80.00',
    ]);
});

it('rejects schedule when credits are insufficient', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '5.00']);
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
        'targeting' => [
            'zones' => [['code' => '75001', 'type' => 'postcode', 'label' => '75001', 'volume' => 500]],
        ],
    ]);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/schedule", [
        'scheduled_at' => now()->addDay()->format('Y-m-d H:i:s'),
    ]);

    $response->assertUnprocessable()
        ->assertJsonStructure(['message', 'errors' => ['euro_credits']]);
});

it('does not change credits when schedule is insufficient', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '5.00']);
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
        'targeting' => [
            'zones' => [['code' => '75001', 'type' => 'postcode', 'label' => '75001', 'volume' => 500]],
        ],
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/schedule", [
        'scheduled_at' => now()->addDay()->format('Y-m-d H:i:s'),
    ])->assertUnprocessable();

    $this->assertDatabaseHas('partners', [
        'id' => $partner->id,
        'euro_credits' => '5.00',
    ]);
});

it('skips credit deduction for demo campaign on schedule', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    PartnerPricing::factory()->forPartner($partner)->default()->create([
        'router_price' => 0.03,
        'data_price' => 0.01,
        'ci_price' => 0.005,
    ]);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->demo()->create([
        'message' => 'Demo SMS',
        'sender' => 'WELLPACK',
        'targeting' => [
            'zones' => [['code' => '75001', 'type' => 'postcode', 'label' => '75001', 'volume' => 500]],
        ],
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/schedule", [
        'scheduled_at' => now()->addDay()->format('Y-m-d H:i:s'),
    ])->assertOk();

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(100.0);
});

// ==================== CANCEL — CREDITS ====================

it('refunds credits on cancel of scheduled campaign', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '80.00']);
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->scheduled()->create([
        'total_price' => 20.0,
    ]);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/cancel");

    $response->assertOk()->assertJsonPath('data.status', 'cancelled');

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(100.0);
});

it('verifies balance restored in DB after cancel refund', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '80.00']);
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->scheduled()->create([
        'total_price' => 20.0,
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/cancel")->assertOk();

    $this->assertDatabaseHas('partners', [
        'id' => $partner->id,
        'euro_credits' => '100.00',
    ]);
});

it('does not refund credits on cancel of draft campaign', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '80.00']);
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'total_price' => 20.0,
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/cancel")->assertOk();

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(80.0);
});

// ==================== DESTROY — CREDITS ====================

it('refunds credits on destroy of scheduled campaign', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '80.00']);
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->scheduled()->create([
        'total_price' => 20.0,
    ]);

    $response = $this->deleteJson("/api/campaigns/{$campaign->id}");

    $response->assertOk();

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(100.0);
});

it('verifies balance restored in DB after destroy refund', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '80.00']);
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->scheduled()->create([
        'total_price' => 20.0,
    ]);

    $this->deleteJson("/api/campaigns/{$campaign->id}")->assertOk();

    $this->assertDatabaseHas('partners', [
        'id' => $partner->id,
        'euro_credits' => '100.00',
    ]);
});

it('does not refund credits on destroy of sent campaign', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '80.00']);
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'total_price' => 20.0,
    ]);

    $this->deleteJson("/api/campaigns/{$campaign->id}")->assertOk();

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(80.0);
});

it('does not refund credits on destroy of draft campaign', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '80.00']);
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'total_price' => 20.0,
    ]);

    $this->deleteJson("/api/campaigns/{$campaign->id}")->assertOk();

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(80.0);
});

// ==================== JOB FAILURE — CREDITS ====================

it('refunds credits when job fails', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '80.00']);
    $user = User::factory()->forPartner($partner)->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'status' => CampaignStatus::SENDING,
        'message' => 'Test',
        'sender' => 'BRAND',
        'volume_estimated' => 500,
        'total_price' => 20.0,
    ]);

    $mockSender = Mockery::mock(CampaignSenderInterface::class);
    $mockSender->shouldReceive('send')
        ->once()
        ->andReturn(new SendResult(success: false, error: 'Wepak timeout'));

    $job = new ProcessCampaignSendingJob($campaign);
    $job->handle($mockSender);

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(100.0);
});

it('does not refund credits when demo job fails', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '80.00']);
    $user = User::factory()->forPartner($partner)->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->demo()->create([
        'status' => CampaignStatus::SENDING,
        'message' => 'Test',
        'sender' => 'BRAND',
        'volume_estimated' => 500,
        'total_price' => 20.0,
    ]);

    $mockSender = Mockery::mock(CampaignSenderInterface::class);
    $mockSender->shouldReceive('send')
        ->once()
        ->andReturn(new SendResult(success: false, error: 'Wepak timeout'));

    $job = new ProcessCampaignSendingJob($campaign);
    $job->handle($mockSender);

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(80.0);
});
