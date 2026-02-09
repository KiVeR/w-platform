<?php

declare(strict_types=1);

namespace App\Services\CampaignStats;

use App\Services\CampaignSending\WepakClient;
use App\Services\CampaignStats\Drivers\StubDriver;
use App\Services\CampaignStats\Drivers\TriggerApiDriver;
use App\Services\CampaignStats\Drivers\WepakDriver;
use Illuminate\Support\Manager;

class CampaignStatsManager extends Manager
{
    public function getDefaultDriver(): string
    {
        /** @var string */
        return $this->config->get('campaign-stats.default', 'stub');
    }

    protected function createStubDriver(): StubDriver
    {
        return new StubDriver;
    }

    protected function createWepakDriver(): WepakDriver
    {
        /** @var array{base_url: string, api_key: string, timeout: int, estimate_timeout: int} $config */
        $config = $this->config->get('campaign-sending.drivers.wepak', []);

        $client = new WepakClient(
            baseUrl: $config['base_url'],
            apiKey: $config['api_key'],
            timeout: $config['timeout'],
            estimateTimeout: $config['estimate_timeout'],
        );

        return new WepakDriver($client);
    }

    protected function createTriggerApiDriver(): TriggerApiDriver
    {
        /** @var string $baseUrl */
        $baseUrl = $this->config->get('campaign-stats.drivers.trigger_api.base_url', '');
        /** @var string $apiKey */
        $apiKey = $this->config->get('campaign-stats.drivers.trigger_api.api_key', '');

        return new TriggerApiDriver($baseUrl, $apiKey);
    }
}
