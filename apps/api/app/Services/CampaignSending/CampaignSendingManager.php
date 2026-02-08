<?php

declare(strict_types=1);

namespace App\Services\CampaignSending;

use App\Services\CampaignSending\Drivers\TriggerApiDriver;
use App\Services\CampaignSending\Drivers\WepakDriver;
use Illuminate\Support\Manager;

class CampaignSendingManager extends Manager
{
    public function getDefaultDriver(): string
    {
        /** @var string */
        return $this->config->get('campaign-sending.default', 'trigger');
    }

    protected function createTriggerDriver(): TriggerApiDriver
    {
        /** @var array<string, mixed> $config */
        $config = $this->config->get('campaign-sending.drivers.trigger', []);

        return new TriggerApiDriver($config);
    }

    protected function createWepakDriver(): WepakDriver
    {
        /** @var array<string, mixed> $config */
        $config = $this->config->get('campaign-sending.drivers.wepak', []);

        return new WepakDriver($config);
    }
}
