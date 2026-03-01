<?php

declare(strict_types=1);

namespace App\Services\SmsRouting;

use App\Services\SmsRouting\Drivers\HighConnexionDriver;
use App\Services\SmsRouting\Drivers\InfobipDriver;
use App\Services\SmsRouting\Drivers\SinchDriver;
use App\Services\SmsRouting\Drivers\StubDriver;
use Illuminate\Support\Manager;

class SmsRoutingManager extends Manager
{
    public function getDefaultDriver(): string
    {
        /** @var string */
        return $this->config->get('sms-routing.default', 'stub');
    }

    protected function createStubDriver(): StubDriver
    {
        return new StubDriver;
    }

    protected function createSinchDriver(): SinchDriver
    {
        /** @var array{region: string, service_plan_id: string, api_token: string, callback_url: string, dry_run: bool, allow_dry_run: bool} $config */
        $config = $this->config->get('sms-routing.drivers.sinch', []);

        return new SinchDriver($config);
    }

    protected function createInfobipDriver(): InfobipDriver
    {
        /** @var array{base_url: string, api_token: string, notify_url: string, dry_run: bool, from_testing: string} $config */
        $config = $this->config->get('sms-routing.drivers.infobip', []);

        return new InfobipDriver($config);
    }

    protected function createHighconnexionDriver(): HighConnexionDriver
    {
        /** @var array{base_url: string, account_id: string, password: string, callback_url: string, dry_run: bool, from_testing: string} $config */
        $config = $this->config->get('sms-routing.drivers.highconnexion', []);

        return new HighConnexionDriver($config);
    }
}
