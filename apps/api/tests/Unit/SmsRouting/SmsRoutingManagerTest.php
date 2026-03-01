<?php

declare(strict_types=1);

use App\Services\SmsRouting\Drivers\HighConnexionDriver;
use App\Services\SmsRouting\Drivers\InfobipDriver;
use App\Services\SmsRouting\Drivers\SinchDriver;
use App\Services\SmsRouting\Drivers\StubDriver;
use App\Services\SmsRouting\SmsRoutingManager;

it('resolves stub driver by default in test env', function (): void {
    $manager = app(SmsRoutingManager::class);

    expect($manager->driver())->toBeInstanceOf(StubDriver::class);
});

it('resolves sinch driver', function (): void {
    $manager = app(SmsRoutingManager::class);

    expect($manager->driver('sinch'))->toBeInstanceOf(SinchDriver::class);
});

it('resolves infobip driver', function (): void {
    $manager = app(SmsRoutingManager::class);

    expect($manager->driver('infobip'))->toBeInstanceOf(InfobipDriver::class);
});

it('resolves highconnexion driver', function (): void {
    $manager = app(SmsRoutingManager::class);

    expect($manager->driver('highconnexion'))->toBeInstanceOf(HighConnexionDriver::class);
});

it('throws on unknown driver', function (): void {
    $manager = app(SmsRoutingManager::class);
    $manager->driver('unknown');
})->throws(InvalidArgumentException::class);

it('is registered as singleton', function (): void {
    $a = app(SmsRoutingManager::class);
    $b = app(SmsRoutingManager::class);

    expect($a)->toBe($b);
});
