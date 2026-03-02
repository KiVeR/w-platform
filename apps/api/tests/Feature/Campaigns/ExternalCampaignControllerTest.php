<?php

declare(strict_types=1);

use App\Enums\CampaignRoutingStatus;
use App\Enums\CampaignStatus;
use App\Models\Campaign;
use App\Models\Partner;
use App\Models\Router;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Client;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->partner = Partner::factory()->create();
    $this->router = Router::factory()->sinch()->create();
    $this->client = Client::factory()->asClientCredentials()->create();
});

it('creates a query-based campaign via external endpoint', function (): void {
    Passport::actingAsClient($this->client);

    $response = $this->postJson('/api/external/campaigns', [
        'wp_campaign_id' => 'WP-12345',
        'wp_routing_id' => 'WR-67890',
        'name' => 'Test External Campaign',
        'partner_id' => $this->partner->id,
        'router_id' => $this->router->id,
        'routing_at' => now()->addHour()->toIso8601String(),
        'source_name' => 'wepak',
        'type' => 'prospection',
        'format' => 'sms',
        'message' => [
            'content' => 'Hello {{ name }}, check this out!',
            'short_url' => 'https://example.com/short',
            'short_url_key' => 'abc123',
        ],
        'query_data' => ['zones' => [['code' => '77', 'type' => 'dept']]],
    ]);

    $response->assertCreated();

    $campaign = Campaign::latest('id')->first();
    expect($campaign)
        ->routing_status->toBe(CampaignRoutingStatus::QueryPending)
        ->status->toBe(CampaignStatus::SCHEDULED)
        ->external_id->toBe('WP-12345')
        ->wp_routing_id->toBe('WR-67890')
        ->partner_id->toBe($this->partner->id)
        ->router_id->toBe($this->router->id)
        ->targeting->toBe(['zones' => [['code' => '77', 'type' => 'dept']]]);
});

it('creates a list-based campaign with routing pending', function (): void {
    Passport::actingAsClient($this->client);

    $response = $this->postJson('/api/external/campaigns', [
        'wp_campaign_id' => 'WP-99999',
        'wp_routing_id' => 'WR-11111',
        'name' => 'List-based Campaign',
        'partner_id' => $this->partner->id,
        'router_id' => $this->router->id,
        'routing_at' => now()->addHour()->toIso8601String(),
        'type' => 'fidelisation',
        'message' => [
            'content' => 'Promo for you!',
        ],
        'recipients' => ['+33612345678', '+33698765432'],
    ]);

    $response->assertCreated();

    $campaign = Campaign::latest('id')->first();
    expect($campaign)
        ->routing_status->toBe(CampaignRoutingStatus::RoutingPending)
        ->targeting->toBeNull();
});

it('rejects request without client credentials', function (): void {
    $response = $this->postJson('/api/external/campaigns', [
        'wp_campaign_id' => 'WP-00001',
        'wp_routing_id' => 'WR-00001',
        'name' => 'Unauthorized',
        'partner_id' => $this->partner->id,
        'router_id' => $this->router->id,
        'routing_at' => now()->addHour()->toIso8601String(),
        'type' => 'prospection',
        'message' => ['content' => 'Test'],
    ]);

    $response->assertUnauthorized();
});

it('validates required fields', function (): void {
    Passport::actingAsClient($this->client);

    $response = $this->postJson('/api/external/campaigns', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['wp_campaign_id', 'wp_routing_id', 'name', 'partner_id', 'router_id', 'routing_at', 'type', 'message']);
});

it('validates router_id exists', function (): void {
    Passport::actingAsClient($this->client);

    $response = $this->postJson('/api/external/campaigns', [
        'wp_campaign_id' => 'WP-00002',
        'wp_routing_id' => 'WR-00002',
        'name' => 'Bad Router',
        'partner_id' => $this->partner->id,
        'router_id' => 99999,
        'routing_at' => now()->addHour()->toIso8601String(),
        'type' => 'prospection',
        'message' => ['content' => 'Test'],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['router_id']);
});

it('validates type is a valid enum', function (): void {
    Passport::actingAsClient($this->client);

    $response = $this->postJson('/api/external/campaigns', [
        'wp_campaign_id' => 'WP-00003',
        'wp_routing_id' => 'WR-00003',
        'name' => 'Bad Type',
        'partner_id' => $this->partner->id,
        'router_id' => $this->router->id,
        'routing_at' => now()->addHour()->toIso8601String(),
        'type' => 'invalid_type',
        'message' => ['content' => 'Test'],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['type']);
});
