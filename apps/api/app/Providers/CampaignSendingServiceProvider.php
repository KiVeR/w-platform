<?php

declare(strict_types=1);

namespace App\Providers;

use App\Contracts\CampaignSenderInterface;
use App\Services\CampaignSending\CampaignSendingManager;
use Illuminate\Contracts\Support\DeferrableProvider;
use Illuminate\Support\ServiceProvider;

class CampaignSendingServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register(): void
    {
        $this->app->singleton('campaign-sending', fn ($app): CampaignSendingManager => new CampaignSendingManager($app));

        $this->app->alias('campaign-sending', CampaignSendingManager::class);

        $this->app->bind(CampaignSenderInterface::class, fn ($app): CampaignSenderInterface => $app->make('campaign-sending')->driver());
    }

    /** @return list<string> */
    public function provides(): array
    {
        return [
            'campaign-sending',
            CampaignSendingManager::class,
            CampaignSenderInterface::class,
        ];
    }
}
