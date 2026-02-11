<?php

declare(strict_types=1);

use App\Contracts\CampaignSenderInterface;
use App\DTOs\SendResult;
use App\Enums\PartnerFeatureKey;
use App\Models\Campaign;
use App\Models\Partner;
use App\Models\PartnerFeature;
use App\Models\PartnerPricing;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Http;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('creates a campaign with is_demo true', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/campaigns', [
        'name' => 'Demo Campaign',
        'type' => 'prospection',
        'channel' => 'sms',
        'is_demo' => true,
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.is_demo', true);
});

it('updates additional_phone on a campaign', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->demo()->create();

    $response = $this->putJson("/api/campaigns/{$campaign->id}", [
        'additional_phone' => '+33611223344',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.additional_phone', '+33611223344');
});

it('returns is_demo and additional_phone in resource', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->demo()->create([
        'additional_phone' => '+33600000000',
    ]);

    $response = $this->getJson("/api/campaigns/{$campaign->id}");

    $response->assertOk()
        ->assertJsonPath('data.is_demo', true)
        ->assertJsonPath('data.additional_phone', '+33600000000');
});

it('sends demo campaign via wepak with query send_test', function (): void {
    Http::fake([
        'wepak.wellpack.fr/*' => Http::response([
            'id_message' => 0,
            'message' => 'OK',
            'idcampagne' => 999,
        ]),
    ]);

    config([
        'campaign-sending.default' => 'wepak',
        'campaign-sending.drivers.wepak.base_url' => 'https://wepak.wellpack.fr',
        'campaign-sending.drivers.wepak.api_key' => 'test-key',
        'campaign-sending.drivers.wepak.timeout' => 30,
        'campaign-sending.drivers.wepak.estimate_timeout' => 10,
    ]);

    $partner = Partner::factory()->create(['euro_credits' => '1000.00', 'phone' => '+33600000000']);
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    PartnerPricing::factory()->forPartner($partner)->default()->create([
        'router_price' => 0.03,
        'data_price' => 0.01,
        'ci_price' => 0.005,
    ]);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->demo()->create([
        'message' => 'Test Demo STOP 36111',
        'sender' => 'BRAND',
        'volume_estimated' => 1,
    ]);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/send");

    $response->assertOk();

    Http::assertSent(function ($request) {
        return str_contains($request->url(), 'smsenvoi.php')
            && $request['query'] === 'send_test';
    });
});

it('does not deduct credits on demo send', function (): void {
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
        'volume_estimated' => 500,
    ]);

    $mockSender = Mockery::mock(CampaignSenderInterface::class);
    $mockSender->shouldReceive('send')
        ->once()
        ->andReturn(new SendResult(success: true, externalId: 'demo-123'));
    $this->app->instance(CampaignSenderInterface::class, $mockSender);

    $this->postJson("/api/campaigns/{$campaign->id}/send")->assertOk();

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(100.0);
});

it('does not deduct credits on demo schedule', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->demo()->create([
        'message' => 'Demo SMS',
        'sender' => 'WELLPACK',
        'total_price' => 20.0,
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/schedule", [
        'scheduled_at' => now()->addDay()->format('Y-m-d H:i:s'),
    ])->assertOk();

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(100.0);
});

it('does not refund credits on demo cancel', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '80.00']);
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->demo()->scheduled()->create([
        'total_price' => 20.0,
    ]);

    $this->postJson("/api/campaigns/{$campaign->id}/cancel")->assertOk();

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(80.0);
});

it('handles stub driver with demo campaign', function (): void {
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
        'message' => 'Stub Demo',
        'sender' => 'WELLPACK',
        'volume_estimated' => 100,
    ]);

    $response = $this->postJson("/api/campaigns/{$campaign->id}/send");

    $response->assertOk()
        ->assertJsonPath('data.status', 'sending');
});

it('checks PartnerFeature DEMO_MODE enabled', function (): void {
    $partner = Partner::factory()->create();

    PartnerFeature::create([
        'partner_id' => $partner->id,
        'key' => PartnerFeatureKey::DEMO_MODE->value,
        'is_enabled' => true,
    ]);

    expect($partner->hasFeature(PartnerFeatureKey::DEMO_MODE))->toBeTrue();
});

it('checks PartnerFeature DEMO_MODE disabled', function (): void {
    $partner = Partner::factory()->create();

    PartnerFeature::create([
        'partner_id' => $partner->id,
        'key' => PartnerFeatureKey::DEMO_MODE->value,
        'is_enabled' => false,
    ]);

    expect($partner->hasFeature(PartnerFeatureKey::DEMO_MODE))->toBeFalse();
});
