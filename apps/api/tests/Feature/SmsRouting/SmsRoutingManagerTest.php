<?php

declare(strict_types=1);

use App\Services\SmsRouting\Drivers\HighConnexionDriver;
use App\Services\SmsRouting\Drivers\InfobipDriver;
use App\Services\SmsRouting\Drivers\SinchDriver;
use App\Services\SmsRouting\Drivers\StubDriver;
use App\Services\SmsRouting\SmsRoutingManager;

it('returns stub as default driver', function (): void {
    $manager = app(SmsRoutingManager::class);

    expect($manager->getDefaultDriver())->toBe('stub');
});

it('resolves stub driver instance', function (): void {
    $manager = app(SmsRoutingManager::class);

    expect($manager->driver('stub'))->toBeInstanceOf(StubDriver::class);
});

it('resolves sinch driver instance', function (): void {
    config()->set('sms-routing.drivers.sinch', [
        'region' => 'eu',
        'service_plan_id' => 'plan-123',
        'api_token' => 'token-abc',
        'callback_url' => 'https://example.com/sinch',
        'dry_run' => false,
        'allow_dry_run' => false,
    ]);

    $manager = app(SmsRoutingManager::class);

    expect($manager->driver('sinch'))->toBeInstanceOf(SinchDriver::class);
});

it('resolves infobip driver instance', function (): void {
    config()->set('sms-routing.drivers.infobip', [
        'base_url' => 'xyz',
        'api_token' => 'token-xyz',
        'notify_url' => 'https://example.com/infobip',
        'dry_run' => false,
        'from_testing' => 'InfoSMS',
    ]);

    $manager = app(SmsRoutingManager::class);

    expect($manager->driver('infobip'))->toBeInstanceOf(InfobipDriver::class);
});

it('resolves highconnexion driver instance', function (): void {
    config()->set('sms-routing.drivers.highconnexion', [
        'base_url' => 'api',
        'account_id' => 'acct-123',
        'password' => 'pass',
        'callback_url' => 'https://example.com/hc',
        'dry_run' => false,
        'from_testing' => 'TestSMS',
    ]);

    $manager = app(SmsRoutingManager::class);

    expect($manager->driver('highconnexion'))->toBeInstanceOf(HighConnexionDriver::class);
});

it('passes sinch config correctly to the driver', function (): void {
    config()->set('sms-routing.drivers.sinch', [
        'region' => 'us',
        'service_plan_id' => 'my-plan',
        'api_token' => 'my-token',
        'callback_url' => 'https://cb.example.com',
        'dry_run' => true,
        'allow_dry_run' => true,
    ]);

    $manager = app(SmsRoutingManager::class);
    /** @var SinchDriver $driver */
    $driver = $manager->driver('sinch');

    expect($driver)->toBeInstanceOf(SinchDriver::class);
    expect($driver->getUrl())->toContain('us.sms.api.sinch.com')
        ->toContain('my-plan')
        ->toContain('/dry_run');
});

it('passes infobip config correctly to the driver', function (): void {
    config()->set('sms-routing.drivers.infobip', [
        'base_url' => 'mybase',
        'api_token' => 'my-infobip-token',
        'notify_url' => 'https://notify.example.com',
        'dry_run' => false,
        'from_testing' => 'InfoSMS',
    ]);

    $manager = app(SmsRoutingManager::class);
    /** @var InfobipDriver $driver */
    $driver = $manager->driver('infobip');

    expect($driver)->toBeInstanceOf(InfobipDriver::class);
    expect($driver->getUrl())->toBe('https://mybase.api.infobip.com/sms/3/messages');
});

it('passes highconnexion config correctly to the driver', function (): void {
    config()->set('sms-routing.drivers.highconnexion', [
        'base_url' => 'myapi',
        'account_id' => 'acct-456',
        'password' => 'pass456',
        'callback_url' => 'https://hc.example.com/cb',
        'dry_run' => false,
        'from_testing' => 'TestSMS',
    ]);

    $manager = app(SmsRoutingManager::class);
    /** @var HighConnexionDriver $driver */
    $driver = $manager->driver('highconnexion');

    expect($driver)->toBeInstanceOf(HighConnexionDriver::class);
    expect($driver->getUrl())->toBe('https://myapi.hcnx.eu/api');
});

it('returns same driver instance on repeated calls', function (): void {
    $manager = app(SmsRoutingManager::class);

    $driver1 = $manager->driver('stub');
    $driver2 = $manager->driver('stub');

    expect($driver1)->toBe($driver2);
});

it('reads default driver from config', function (): void {
    config()->set('sms-routing.default', 'sinch');

    $manager = app(SmsRoutingManager::class);

    expect($manager->getDefaultDriver())->toBe('sinch');
});
