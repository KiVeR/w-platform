<?php

declare(strict_types=1);

namespace App\Providers;

use App\Contracts\CampaignStatsProviderInterface;
use App\Services\CampaignStats\CampaignStatsManager;
use Illuminate\Contracts\Support\DeferrableProvider;
use Illuminate\Support\ServiceProvider;

class CampaignStatsServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register(): void
    {
        $this->app->singleton('campaign-stats', fn ($app): CampaignStatsManager => new CampaignStatsManager($app));

        $this->app->alias('campaign-stats', CampaignStatsManager::class);

        $this->app->bind(CampaignStatsProviderInterface::class, fn ($app): CampaignStatsProviderInterface => $app->make('campaign-stats')->driver());
    }

    /** @return list<string> */
    public function provides(): array
    {
        return [
            'campaign-stats',
            CampaignStatsManager::class,
            CampaignStatsProviderInterface::class,
        ];
    }
}
