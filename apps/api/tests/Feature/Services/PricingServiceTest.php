<?php

declare(strict_types=1);

use App\DTOs\CostEstimate;
use App\Models\Partner;
use App\Models\PartnerPricing;
use App\Services\PricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('calculates unit price from matching volume tier', function (): void {
    $partner = Partner::factory()->create();
    PartnerPricing::factory()->forPartner($partner)->create([
        'volume_min' => 0,
        'volume_max' => 10000,
        'router_price' => 0.0300,
        'data_price' => 0.0100,
        'ci_price' => 0.0050,
    ]);

    $service = app(PricingService::class);
    $result = $service->calculate($partner->id, 5000);

    expect($result)
        ->toBeInstanceOf(CostEstimate::class)
        ->unitPrice->toBe(0.04)
        ->totalPrice->toBe(200.0);
});

it('includes ci_price when useCi is true', function (): void {
    $partner = Partner::factory()->create();
    PartnerPricing::factory()->forPartner($partner)->create([
        'volume_min' => 0,
        'volume_max' => 10000,
        'router_price' => 0.0300,
        'data_price' => 0.0100,
        'ci_price' => 0.0050,
    ]);

    $service = app(PricingService::class);
    $result = $service->calculate($partner->id, 5000, useCi: true);

    expect($result)
        ->unitPrice->toBe(0.045)
        ->totalPrice->toBe(225.0);
});

it('selects best matching tier by volume_min DESC', function (): void {
    $partner = Partner::factory()->create();
    PartnerPricing::factory()->forPartner($partner)->create([
        'volume_min' => 0,
        'volume_max' => 5000,
        'router_price' => 0.0400,
        'data_price' => 0.0100,
        'ci_price' => 0.0050,
    ]);
    $tier2 = PartnerPricing::factory()->forPartner($partner)->create([
        'volume_min' => 5001,
        'volume_max' => 20000,
        'router_price' => 0.0250,
        'data_price' => 0.0080,
        'ci_price' => 0.0040,
    ]);

    $service = app(PricingService::class);
    $result = $service->calculate($partner->id, 10000);

    expect($result)
        ->pricingId->toBe($tier2->id)
        ->unitPrice->toBe(0.033);
});

it('falls back to default tier when no volume match', function (): void {
    $partner = Partner::factory()->create();
    PartnerPricing::factory()->forPartner($partner)->create([
        'volume_min' => 0,
        'volume_max' => 1000,
        'router_price' => 0.0400,
        'data_price' => 0.0100,
        'ci_price' => 0.0050,
    ]);
    $default = PartnerPricing::factory()->forPartner($partner)->default()->create([
        'volume_min' => 0,
        'volume_max' => null,
        'router_price' => 0.0350,
        'data_price' => 0.0090,
        'ci_price' => 0.0045,
    ]);

    $service = app(PricingService::class);
    $result = $service->calculate($partner->id, 50000);

    expect($result)->pricingId->toBe($default->id);
});

it('throws exception when no pricing found', function (): void {
    $partner = Partner::factory()->create();

    $service = app(PricingService::class);
    $service->calculate($partner->id, 5000);
})->throws(\RuntimeException::class);

it('ignores inactive pricing tiers', function (): void {
    $partner = Partner::factory()->create();
    PartnerPricing::factory()->forPartner($partner)->inactive()->create([
        'volume_min' => 0,
        'volume_max' => 10000,
        'router_price' => 0.0300,
        'data_price' => 0.0100,
        'ci_price' => 0.0050,
    ]);

    $service = app(PricingService::class);
    $service->calculate($partner->id, 5000);
})->throws(\RuntimeException::class);
