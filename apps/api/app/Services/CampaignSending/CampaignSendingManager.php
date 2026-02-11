<?php

declare(strict_types=1);

namespace App\Services\CampaignSending;

use App\Contracts\TargetingAdapterInterface;
use App\Services\CampaignSending\Drivers\StubDriver;
use App\Services\CampaignSending\Drivers\WepakDriver;
use Illuminate\Support\Manager;

class CampaignSendingManager extends Manager
{
    public function getDefaultDriver(): string
    {
        /** @var string */
        return $this->config->get('campaign-sending.default', 'stub');
    }

    protected function createStubDriver(): StubDriver
    {
        return new StubDriver;
    }

    protected function createWepakDriver(): WepakDriver
    {
        /** @var array{base_url: string, api_key: string, timeout: int, estimate_timeout: int} $config */
        $config = $this->config->get('campaign-sending.drivers.wepak', []);

        /** @var TargetingAdapterInterface $adapter */
        $adapter = $this->container->make(TargetingAdapterInterface::class);

        return new WepakDriver($config, $adapter);
    }
}
