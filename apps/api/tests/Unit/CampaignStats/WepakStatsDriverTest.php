<?php

declare(strict_types=1);

use App\Models\Campaign;
use App\Models\Partner;
use App\Models\User;
use App\Services\CampaignStats\Drivers\WepakDriver;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->client = new \App\Services\CampaignSending\WepakClient(
        baseUrl: 'https://wepak.wellpack.fr',
        apiKey: 'test-key',
        timeout: 30,
        estimateTimeout: 10,
    );
});

it('returns stats on success', function (): void {
    Http::fake([
        'wepak.wellpack.fr/*' => Http::response([
            'id_message' => 0,
            'message' => [
                'SENT' => 1000,
                'DELIVERED' => 950,
                'UNDELIVERABLE' => 20,
                'REJECTED' => 10,
                'EXPIRED' => 5,
                'STOP' => 15,
            ],
        ]),
    ]);

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'external_id' => '12345',
    ]);

    $driver = new WepakDriver($this->client);
    $stats = $driver->getStats($campaign);

    expect($stats)->not->toBeNull()
        ->and($stats->sent)->toBe(1000)
        ->and($stats->delivered)->toBe(950);
});

it('returns null without external_id', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'external_id' => null,
    ]);

    $driver = new WepakDriver($this->client);
    $stats = $driver->getStats($campaign);

    expect($stats)->toBeNull();
});

it('returns null on HTTP error', function (): void {
    Http::fake([
        'wepak.wellpack.fr/*' => Http::response('Server Error', 500),
    ]);

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'external_id' => '12345',
    ]);

    $driver = new WepakDriver($this->client);
    $stats = $driver->getStats($campaign);

    expect($stats)->toBeNull();
});

it('returns null when id_message is not zero', function (): void {
    Http::fake([
        'wepak.wellpack.fr/*' => Http::response([
            'id_message' => 1,
            'message' => 'Error occurred',
        ]),
    ]);

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'external_id' => '12345',
    ]);

    $driver = new WepakDriver($this->client);
    $stats = $driver->getStats($campaign);

    expect($stats)->toBeNull();
});

it('logs warning on failure', function (): void {
    Http::fake([
        'wepak.wellpack.fr/*' => Http::response('Server Error', 500),
    ]);

    Log::shouldReceive('info')->zeroOrMoreTimes();
    Log::shouldReceive('warning')->once()->withArgs(function (string $message): bool {
        return $message === 'Wepak stats retrieval failed';
    });

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'external_id' => '12345',
    ]);

    $driver = new WepakDriver($this->client);
    $driver->getStats($campaign);
});
