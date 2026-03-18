<?php

declare(strict_types=1);

use App\Contracts\CampaignStatsProviderInterface;
use App\Services\CampaignStats\CampaignStatsManager;
use App\Services\CampaignStats\Drivers\LocalCampaignStatsDriver;
use App\Services\CampaignStats\Drivers\StubDriver;
use App\Services\CampaignStats\Drivers\WepakDriver;

it('resolves stub driver', function (): void {
    config(['campaign-stats.default' => 'stub']);

    $manager = app(CampaignStatsManager::class);
    $driver = $manager->driver();

    expect($driver)->toBeInstanceOf(StubDriver::class);
});

it('resolves local driver', function (): void {
    $manager = app(CampaignStatsManager::class);
    $driver = $manager->driver('local');

    expect($driver)->toBeInstanceOf(LocalCampaignStatsDriver::class);
});

it('resolves wepak driver', function (): void {
    config([
        'campaign-stats.default' => 'wepak',
        'campaign-sending.drivers.wepak.base_url' => 'https://wepak.wellpack.fr',
        'campaign-sending.drivers.wepak.api_key' => 'test-key',
        'campaign-sending.drivers.wepak.timeout' => 30,
        'campaign-sending.drivers.wepak.estimate_timeout' => 10,
    ]);

    $manager = app(CampaignStatsManager::class);
    $driver = $manager->driver('wepak');

    expect($driver)->toBeInstanceOf(WepakDriver::class);
});

it('respects CAMPAIGN_STATS_DRIVER env', function (): void {
    config(['campaign-stats.default' => 'stub']);

    $manager = app(CampaignStatsManager::class);

    expect($manager->getDefaultDriver())->toBe('stub');
});

it('binds interface via service provider', function (): void {
    config(['campaign-stats.default' => 'stub']);

    $provider = app(CampaignStatsProviderInterface::class);

    expect($provider)->toBeInstanceOf(StubDriver::class);
});
