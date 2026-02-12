<?php

declare(strict_types=1);

use App\DTOs\CostEstimate;
use App\Models\Partner;
use App\Models\PartnerPricing;
use App\Services\PricingService;

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

// S3.4 — findNextTier tests
it('findNextTier returns next tier with savings', function (): void {
    $partner = Partner::factory()->create();
    PartnerPricing::factory()->forPartner($partner)->create([
        'volume_min' => 0,
        'volume_max' => 5000,
        'router_price' => 0.0400,
        'data_price' => 0.0100,
        'ci_price' => 0.0050,
    ]);
    PartnerPricing::factory()->forPartner($partner)->create([
        'volume_min' => 5001,
        'volume_max' => 20000,
        'router_price' => 0.0250,
        'data_price' => 0.0080,
        'ci_price' => 0.0040,
    ]);

    $service = app(PricingService::class);
    $result = $service->findNextTier($partner->id, 3000);

    expect($result)
        ->not->toBeNull()
        ->volumeThreshold->toBe(5001)
        ->unitPrice->toBe(0.033);

    expect($result->savingsPercent)->toBeGreaterThan(0);
});

it('findNextTier returns null on the last tier', function (): void {
    $partner = Partner::factory()->create();
    PartnerPricing::factory()->forPartner($partner)->create([
        'volume_min' => 0,
        'volume_max' => null,
        'router_price' => 0.0300,
        'data_price' => 0.0100,
        'ci_price' => 0.0050,
        'is_default' => true,
    ]);

    $service = app(PricingService::class);
    $result = $service->findNextTier($partner->id, 5000);

    expect($result)->toBeNull();
});

it('findNextTier ignores inactive tiers', function (): void {
    $partner = Partner::factory()->create();
    PartnerPricing::factory()->forPartner($partner)->create([
        'volume_min' => 0,
        'volume_max' => 5000,
        'router_price' => 0.0400,
        'data_price' => 0.0100,
        'ci_price' => 0.0050,
    ]);
    PartnerPricing::factory()->forPartner($partner)->inactive()->create([
        'volume_min' => 5001,
        'volume_max' => 20000,
        'router_price' => 0.0200,
        'data_price' => 0.0050,
        'ci_price' => 0.0030,
    ]);

    $service = app(PricingService::class);
    $result = $service->findNextTier($partner->id, 3000);

    expect($result)->toBeNull();
});

it('findNextTier calculates correct savings percent', function (): void {
    $partner = Partner::factory()->create();
    PartnerPricing::factory()->forPartner($partner)->create([
        'volume_min' => 0,
        'volume_max' => 5000,
        'router_price' => 0.0300,
        'data_price' => 0.0100,
        'ci_price' => 0.0050,
    ]);
    PartnerPricing::factory()->forPartner($partner)->create([
        'volume_min' => 5001,
        'volume_max' => 20000,
        'router_price' => 0.0200,
        'data_price' => 0.0100,
        'ci_price' => 0.0050,
    ]);

    $service = app(PricingService::class);
    $result = $service->findNextTier($partner->id, 3000);

    // Current: 0.03 + 0.01 = 0.04, Next: 0.02 + 0.01 = 0.03
    // Savings: (0.04 - 0.03) / 0.04 * 100 = 25%
    expect($result)
        ->not->toBeNull()
        ->savingsPercent->toBe(25.0);
});
