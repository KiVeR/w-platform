<?php

declare(strict_types=1);

use App\Models\Campaign;
use App\Models\Partner;
use App\Models\User;
use App\Services\CampaignStats\Drivers\TriggerApiDriver;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->driver = new TriggerApiDriver('https://trigger.example.com', 'test-token');
});

it('returns stats on success', function (): void {
    Http::fake([
        'trigger.example.com/*' => Http::response([
            'data' => [
                'total' => 1000,
                'delivered' => 950,
                'clicks' => 125,
                'deliverability_rate' => 95.0,
                'ctr' => 13.16,
            ],
        ]),
    ]);

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'trigger_campaign_uuid' => '550e8400-e29b-41d4-a716-446655440000',
    ]);

    $stats = $this->driver->getStats($campaign);

    expect($stats)->not->toBeNull()
        ->and($stats->sent)->toBe(1000)
        ->and($stats->clicks)->toBe(125)
        ->and($stats->ctr)->toBe(13.16);
});

it('returns null without trigger_campaign_uuid', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'trigger_campaign_uuid' => null,
    ]);

    $stats = $this->driver->getStats($campaign);

    expect($stats)->toBeNull();
});

it('returns null on HTTP error', function (): void {
    Http::fake([
        'trigger.example.com/*' => Http::response('Internal Server Error', 500),
    ]);

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'trigger_campaign_uuid' => '550e8400-e29b-41d4-a716-446655440000',
    ]);

    $stats = $this->driver->getStats($campaign);

    expect($stats)->toBeNull();
});

it('returns null on timeout exception', function (): void {
    Http::fake([
        'trigger.example.com/*' => fn () => throw new \Illuminate\Http\Client\ConnectionException('Connection timed out'),
    ]);

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'trigger_campaign_uuid' => '550e8400-e29b-41d4-a716-446655440000',
    ]);

    $stats = $this->driver->getStats($campaign);

    expect($stats)->toBeNull();
});

it('logs error on exception', function (): void {
    Http::fake([
        'trigger.example.com/*' => fn () => throw new \RuntimeException('Connection refused'),
    ]);

    Log::shouldReceive('error')->once()->withArgs(function (string $message): bool {
        return $message === 'TriggerApi stats exception';
    });

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'trigger_campaign_uuid' => '550e8400-e29b-41d4-a716-446655440000',
    ]);

    $this->driver->getStats($campaign);
});
