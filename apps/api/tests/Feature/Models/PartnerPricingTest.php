<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\PartnerPricing;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('can create a partner pricing with required fields', function (): void {
    $partner = Partner::factory()->create();
    $pricing = PartnerPricing::factory()->forPartner($partner)->create([
        'name' => 'Standard',
    ]);

    expect($pricing)
        ->name->toBe('Standard')
        ->partner_id->toBe($partner->id)
        ->is_active->toBeTrue()
        ->is_default->toBeFalse();

    $this->assertDatabaseHas('partner_pricings', ['name' => 'Standard']);
});

it('belongs to a partner', function (): void {
    $partner = Partner::factory()->create(['name' => 'Partner Pricing']);
    $pricing = PartnerPricing::factory()->forPartner($partner)->create();

    expect($pricing->partner)
        ->toBeInstanceOf(Partner::class)
        ->name->toBe('Partner Pricing');
});

it('partner has many pricings', function (): void {
    $partner = Partner::factory()->create();
    PartnerPricing::factory()->count(3)->forPartner($partner)->create();

    expect($partner->pricings)->toHaveCount(3);
});

it('casts decimal prices correctly', function (): void {
    $pricing = PartnerPricing::factory()->create([
        'router_price' => 0.0325,
        'data_price' => 0.0100,
        'ci_price' => 0.0050,
    ]);
    $pricing->refresh();

    expect($pricing->router_price)->toBeFloat()
        ->and($pricing->data_price)->toBeFloat()
        ->and($pricing->ci_price)->toBeFloat();
});

it('casts is_active and is_default as booleans', function (): void {
    $pricing = PartnerPricing::factory()->create([
        'is_active' => true,
        'is_default' => false,
    ]);

    expect($pricing->is_active)->toBeTrue()->toBeBool()
        ->and($pricing->is_default)->toBeFalse()->toBeBool();
});

it('casts volume fields as integers', function (): void {
    $pricing = PartnerPricing::factory()->create([
        'volume_min' => 0,
        'volume_max' => 10000,
    ]);

    expect($pricing->volume_min)->toBeInt()
        ->and($pricing->volume_max)->toBeInt();
});

it('allows nullable volume_max for unlimited tier', function (): void {
    $pricing = PartnerPricing::factory()->create([
        'volume_max' => null,
    ]);

    expect($pricing->volume_max)->toBeNull();
});

it('can be marked as default', function (): void {
    $pricing = PartnerPricing::factory()->default()->create();

    expect($pricing->is_default)->toBeTrue();
});
