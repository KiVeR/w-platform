<?php

declare(strict_types=1);

use App\Contracts\CampaignStatsProviderInterface;
use App\DTOs\CampaignStats;
use App\Enums\CampaignStatus;
use App\Models\Campaign;
use App\Models\Partner;
use App\Models\User;
use App\Services\CampaignExportService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('generates csv with campaign details', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'name' => 'Test Campaign',
        'message' => 'Hello World',
        'sender' => 'BRAND',
    ]);

    $mockProvider = Mockery::mock(CampaignStatsProviderInterface::class);
    $mockProvider->shouldReceive('getStats')->andReturnNull();

    $service = new CampaignExportService($mockProvider);
    $csv = $service->generateCsv($campaign);

    expect($csv)->toContain('Test Campaign')
        ->and($csv)->toContain('Hello World')
        ->and($csv)->toContain('BRAND');
});

it('generates csv with pricing', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'volume_estimated' => 1000,
        'unit_price' => 0.04,
        'total_price' => 40.0,
    ]);

    $mockProvider = Mockery::mock(CampaignStatsProviderInterface::class);
    $mockProvider->shouldReceive('getStats')->andReturnNull();

    $service = new CampaignExportService($mockProvider);
    $csv = $service->generateCsv($campaign);

    expect($csv)->toContain('1000')
        ->and($csv)->toContain('0.04')
        ->and($csv)->toContain('40');
});

it('generates csv with targeting postcodes', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'targeting' => [
            'gender' => 'M',
            'geo' => [
                'postcodes' => [
                    ['code' => '75001', 'volume' => 500],
                    ['code' => '75002', 'volume' => 300],
                ],
            ],
        ],
    ]);

    $mockProvider = Mockery::mock(CampaignStatsProviderInterface::class);
    $mockProvider->shouldReceive('getStats')->andReturnNull();

    $service = new CampaignExportService($mockProvider);
    $csv = $service->generateCsv($campaign);

    expect($csv)->toContain('75001')
        ->and($csv)->toContain('500')
        ->and($csv)->toContain('75002');
});

it('generates csv with stats when available', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
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

    $service = new CampaignExportService($mockProvider);
    $csv = $service->generateCsv($campaign);

    expect($csv)->toContain('"Stats"')
        ->and($csv)->toContain('950')
        ->and($csv)->toContain('95');
});

it('generates csv with null targeting', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->sent()->create([
        'targeting' => null,
    ]);

    $mockProvider = Mockery::mock(CampaignStatsProviderInterface::class);
    $mockProvider->shouldReceive('getStats')->andReturnNull();

    $service = new CampaignExportService($mockProvider);
    $csv = $service->generateCsv($campaign);

    expect($csv)->not->toContain('75001');
});

it('generates correct filename', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'name' => 'My Test Campaign',
    ]);

    $mockProvider = Mockery::mock(CampaignStatsProviderInterface::class);
    $service = new CampaignExportService($mockProvider);
    $filename = $service->getFilename($campaign);

    expect($filename)->toStartWith("campaign_{$campaign->id}_my-test-campaign_")
        ->and($filename)->toEndWith('.csv');
});
