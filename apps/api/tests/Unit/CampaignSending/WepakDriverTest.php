<?php

declare(strict_types=1);

use App\Models\Campaign;
use App\Models\Partner;
use App\Models\User;
use App\Services\CampaignSending\Drivers\WepakDriver;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Http;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->config = [
        'base_url' => 'https://wepak.test',
        'api_key' => 'test-key',
        'timeout' => 10,
        'estimate_timeout' => 5,
    ];
});

it('sends prospection campaign successfully', function (): void {
    Http::fake([
        'wepak.test/smsenvoi.php' => Http::response([
            'id_message' => 0,
            'id_campagne_api' => 12345,
            'volume' => 950,
        ]),
    ]);

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->prospection()->create([
        'message' => 'Promo STOP 36111',
        'sender' => 'BRAND',
        'volume_estimated' => 1000,
        'targeting' => ['geo' => ['postcodes' => [['code' => '75001', 'volume' => 1000]]]],
    ]);

    $driver = new WepakDriver($this->config);
    $result = $driver->send($campaign);

    expect($result->success)->toBeTrue()
        ->and($result->externalId)->toBe('12345');

    Http::assertSentCount(1);
});

it('handles wepak error on send', function (): void {
    Http::fake([
        'wepak.test/smsenvoi.php' => Http::response([
            'id_message' => 42,
        ]),
    ]);

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->prospection()->create([
        'message' => 'Test',
        'sender' => 'BRAND',
        'volume_estimated' => 100,
        'targeting' => ['geo' => ['postcodes' => [['code' => '75001', 'volume' => 100]]]],
    ]);

    $driver = new WepakDriver($this->config);
    $result = $driver->send($campaign);

    expect($result->success)->toBeFalse()
        ->and($result->error)->toContain('id_message=42');
});

it('handles http failure on send', function (): void {
    Http::fake([
        'wepak.test/smsenvoi.php' => Http::response('Server Error', 500),
    ]);

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->prospection()->create([
        'message' => 'Test',
        'sender' => 'BRAND',
        'volume_estimated' => 100,
        'targeting' => ['geo' => ['postcodes' => [['code' => '75001', 'volume' => 100]]]],
    ]);

    $driver = new WepakDriver($this->config);
    $result = $driver->send($campaign);

    expect($result->success)->toBeFalse()
        ->and($result->error)->toContain('HTTP 500');
});

it('estimates volume from wepak', function (): void {
    Http::fake([
        'wepak.test/smsenvoi.php' => Http::response([
            'id_message' => 0,
            'volume' => 8500,
        ]),
    ]);

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'volume_estimated' => 10000,
        'targeting' => ['geo' => ['postcodes' => [['code' => '75001', 'volume' => 10000]]]],
    ]);

    $driver = new WepakDriver($this->config);
    $volume = $driver->estimateVolume($campaign);

    expect($volume)->toBe(8500);
});

it('falls back to targeting volume on estimate failure', function (): void {
    Http::fake([
        'wepak.test/smsenvoi.php' => Http::response('Server Error', 500),
    ]);

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'targeting' => ['geo' => ['postcodes' => [['code' => '75001', 'volume' => 5000]]]],
    ]);

    $driver = new WepakDriver($this->config);
    $volume = $driver->estimateVolume($campaign);

    expect($volume)->toBe(5000);
});

it('rejects fidelisation send', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->fidelisation()->create([
        'message' => 'Bonjour {prenom}',
        'sender' => 'BRAND',
        'volume_estimated' => 100,
    ]);

    $driver = new WepakDriver($this->config);
    $result = $driver->send($campaign);

    expect($result->success)->toBeFalse()
        ->and($result->error)->toContain('Fidelisation');
});

it('sends api_key in payload', function (): void {
    Http::fake([
        'wepak.test/smsenvoi.php' => Http::response([
            'id_message' => 0,
            'id_campagne_api' => 1,
            'volume' => 100,
        ]),
    ]);

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->prospection()->create([
        'message' => 'Test',
        'sender' => 'BRAND',
        'volume_estimated' => 100,
        'targeting' => ['geo' => ['postcodes' => [['code' => '75001', 'volume' => 100]]]],
    ]);

    $driver = new WepakDriver($this->config);
    $driver->send($campaign);

    Http::assertSent(function ($request) {
        return str_contains((string) $request->body(), 'test-key');
    });
});
