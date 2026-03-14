<?php

declare(strict_types=1);

use App\Events\CampaignCreated;
use App\Events\CampaignRefresh;
use App\Events\CampaignUpdated;
use App\Jobs\SmsRouting\DigestDeliveryReportsJob;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\DeliveryReport;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Event;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);

    config()->set('broadcasting.default', 'pusher');
    config()->set('broadcasting.connections.pusher.key', 'test-key');
    config()->set('broadcasting.connections.pusher.secret', 'test-secret');
    config()->set('broadcasting.connections.pusher.app_id', 'test-app');
    config()->set('broadcasting.connections.pusher.options.cluster', 'eu');
    config()->set('broadcasting.connections.pusher.options.host', 'ws.test');
    config()->set('broadcasting.connections.pusher.options.port', 443);
    config()->set('broadcasting.connections.pusher.options.scheme', 'https');
    config()->set('broadcasting.connections.pusher.options.useTLS', true);
});

it('authenticates the private campaign channel for users who can view campaigns', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user, [], 'api');

    $response = $this->postJson('/api/broadcasting/auth', [
        'socket_id' => '1234.5678',
        'channel_name' => 'private-campaign',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['auth']);
});

it('forbids the private campaign channel for users without campaign access', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user, [], 'api');

    $this->postJson('/api/broadcasting/auth', [
        'socket_id' => '1234.5678',
        'channel_name' => 'private-campaign',
    ])->assertForbidden();
});

it('dispatches CampaignCreated when a campaign is created', function (): void {
    Event::fake([CampaignCreated::class, CampaignUpdated::class, CampaignRefresh::class]);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create();

    $response = $this->postJson('/api/campaigns', [
        'partner_id' => $partner->id,
        'type' => 'prospection',
        'channel' => 'sms',
        'name' => 'Campaign with realtime',
    ]);

    $response->assertCreated();

    $campaignId = (int) $response->json('data.id');

    Event::assertDispatched(CampaignCreated::class, function (CampaignCreated $event) use ($campaignId): bool {
        return $event->id === $campaignId;
    });
});

it('dispatches CampaignUpdated when a campaign is updated', function (): void {
    Event::fake([CampaignCreated::class, CampaignUpdated::class, CampaignRefresh::class]);

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $campaign = Campaign::factory()->forPartner($partner)->create([
        'name' => 'Original name',
    ]);

    $this->putJson("/api/campaigns/{$campaign->id}", [
        'name' => 'Updated name',
    ])->assertOk()
        ->assertJsonPath('data.name', 'Updated name');

    Event::assertDispatched(CampaignUpdated::class, function (CampaignUpdated $event) use ($campaign): bool {
        return $event->id === $campaign->id;
    });
});

it('dispatches CampaignRefresh when delivery report digestion updates recipients', function (): void {
    Event::fake([CampaignCreated::class, CampaignUpdated::class, CampaignRefresh::class]);

    $campaign = Campaign::factory()->create();
    $recipient = CampaignRecipient::factory()
        ->for($campaign)
        ->withBatch('4cc79bd0-3fb1-4c68-8d54-b3a7f0b16c2d')
        ->create([
            'phone_number' => '+33612345678',
        ]);

    DeliveryReport::factory()
        ->sinch()
        ->create([
            'report' => [
                'type' => 'recipient_delivery_report_sms',
                'status' => 'delivered',
                'recipient' => $recipient->phone_number,
                'client_reference' => '4cc79bd0-3fb1-4c68-8d54-b3a7f0b16c2d',
                'at' => '2026-03-01T12:00:00Z',
            ],
        ]);

    (new DigestDeliveryReportsJob('sinch'))->handle();

    Event::assertDispatched(CampaignRefresh::class);
});
