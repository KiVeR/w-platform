<?php

declare(strict_types=1);

use App\Enums\PartnerFeatureKey;
use App\Models\Partner;
use App\Models\PartnerFeature;

it('can create a partner feature', function (): void {
    $partner = Partner::factory()->create();
    $feature = PartnerFeature::create([
        'partner_id' => $partner->id,
        'key' => PartnerFeatureKey::SHOPS->value,
        'is_enabled' => true,
    ]);

    expect($feature)
        ->key->toBe(PartnerFeatureKey::SHOPS)
        ->is_enabled->toBeTrue();

    $this->assertDatabaseHas('partner_features', [
        'partner_id' => $partner->id,
        'key' => 'shops',
    ]);
});

it('belongs to a partner', function (): void {
    $partner = Partner::factory()->create(['name' => 'Feature Partner']);
    $feature = PartnerFeature::create([
        'partner_id' => $partner->id,
        'key' => PartnerFeatureKey::PAYMENT->value,
        'is_enabled' => false,
    ]);

    expect($feature->partner)
        ->toBeInstanceOf(Partner::class)
        ->name->toBe('Feature Partner');
});

it('casts key to PartnerFeatureKey enum', function (): void {
    $partner = Partner::factory()->create();
    $feature = PartnerFeature::create([
        'partner_id' => $partner->id,
        'key' => PartnerFeatureKey::CAMPAIGN_PROSPECTION->value,
        'is_enabled' => true,
    ]);

    expect($feature->key)->toBeInstanceOf(PartnerFeatureKey::class)
        ->and($feature->key)->toBe(PartnerFeatureKey::CAMPAIGN_PROSPECTION);
});

it('casts is_enabled as boolean', function (): void {
    $partner = Partner::factory()->create();
    $feature = PartnerFeature::create([
        'partner_id' => $partner->id,
        'key' => PartnerFeatureKey::SHORT_URLS->value,
        'is_enabled' => true,
    ]);

    expect($feature->is_enabled)->toBeTrue()->toBeBool();
});

it('enforces unique constraint on partner_id and key', function (): void {
    $partner = Partner::factory()->create();

    PartnerFeature::create([
        'partner_id' => $partner->id,
        'key' => PartnerFeatureKey::SHOPS->value,
        'is_enabled' => true,
    ]);

    PartnerFeature::create([
        'partner_id' => $partner->id,
        'key' => PartnerFeatureKey::SHOPS->value,
        'is_enabled' => false,
    ]);
})->throws(\Illuminate\Database\QueryException::class);
