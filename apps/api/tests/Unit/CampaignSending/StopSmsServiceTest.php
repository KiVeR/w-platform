<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\Router;
use App\Services\CampaignSending\StopSmsService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->service = new StopSmsService;
});

it('appends stop to message', function (): void {
    $router = Router::factory()->create(['num_stop' => '36111']);
    $partner = Partner::factory()->create(['router_id' => $router->id]);

    $result = $this->service->appendStop('Promo -20%', $partner);

    expect($result)->toBe('Promo -20% STOP 36111');
});

it('does not duplicate stop if already present', function (): void {
    $router = Router::factory()->create(['num_stop' => '36111']);
    $partner = Partner::factory()->create(['router_id' => $router->id]);

    $result = $this->service->appendStop('Promo -20% STOP 36111', $partner);

    expect($result)->toBe('Promo -20% STOP 36111');
});

it('returns message unchanged when no router', function (): void {
    $partner = Partner::factory()->create(['router_id' => null]);

    $result = $this->service->appendStop('Promo -20%', $partner);

    expect($result)->toBe('Promo -20%');
});

it('returns message unchanged when router has no num_stop', function (): void {
    $router = Router::factory()->create(['num_stop' => null]);
    $partner = Partner::factory()->create(['router_id' => $router->id]);

    $result = $this->service->appendStop('Promo -20%', $partner);

    expect($result)->toBe('Promo -20%');
});

it('uses correct stop number per router', function (): void {
    $sinch = Router::factory()->sinch()->create(['external_id' => 1]);
    $infobip = Router::factory()->infobip()->create(['external_id' => 2]);
    $hc = Router::factory()->highconnexion()->create(['external_id' => 3]);

    $partnerSinch = Partner::factory()->create(['router_id' => $sinch->id]);
    $partnerInfobip = Partner::factory()->create(['router_id' => $infobip->id]);
    $partnerHc = Partner::factory()->create(['router_id' => $hc->id]);

    expect($this->service->appendStop('Test', $partnerSinch))->toBe('Test STOP 36063')
        ->and($this->service->appendStop('Test', $partnerInfobip))->toBe('Test STOP 36111')
        ->and($this->service->appendStop('Test', $partnerHc))->toBe('Test STOP 36173');
});

it('detects blocked domain rsms.co', function (): void {
    expect($this->service->containsBlockedDomain('Visit rsms.co/promo'))->toBeTrue()
        ->and($this->service->containsBlockedDomain('Visit RSMS.CO/promo'))->toBeTrue()
        ->and($this->service->containsBlockedDomain('Visit example.com'))->toBeFalse();
});
