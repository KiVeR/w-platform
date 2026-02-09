<?php

declare(strict_types=1);

use App\Enums\PartnerFeatureKey;
use App\Models\Partner;
use App\Models\PartnerFeature;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('can create a partner with required fields', function (): void {
    $partner = Partner::factory()->create([
        'name' => 'Acme Corp',
        'code' => 'ACME',
    ]);

    expect($partner)
        ->name->toBe('Acme Corp')
        ->code->toBe('ACME')
        ->is_active->toBeTrue();

    $this->assertDatabaseHas('partners', ['code' => 'ACME']);
});

it('can create a partner with all fields', function (): void {
    $partner = Partner::factory()->create([
        'name' => 'Full Partner',
        'code' => 'FULL',
        'email' => 'contact@full.com',
        'phone' => '+33123456789',
        'address' => '1 rue de la Paix',
        'city' => 'Paris',
        'zip_code' => '75001',
        'logo_url' => 'https://example.com/logo.png',
        'euro_credits' => '500.00',
    ]);

    expect($partner)
        ->email->toBe('contact@full.com')
        ->phone->toBe('+33123456789')
        ->address->toBe('1 rue de la Paix')
        ->city->toBe('Paris')
        ->zip_code->toBe('75001')
        ->logo_url->toBe('https://example.com/logo.png')
        ->euro_credits->toBe('500.00');
});

it('has many users', function (): void {
    $partner = Partner::factory()->create();
    User::factory()->count(3)->forPartner($partner)->create();

    expect($partner->users)->toHaveCount(3);
});

it('has many shops', function (): void {
    $partner = Partner::factory()->create();
    Shop::factory()->count(2)->forPartner($partner)->create();

    expect($partner->shops)->toHaveCount(2);
});

it('has many features', function (): void {
    $partner = Partner::factory()->create();
    PartnerFeature::create([
        'partner_id' => $partner->id,
        'key' => PartnerFeatureKey::SHOPS->value,
        'is_enabled' => true,
    ]);

    expect($partner->features)->toHaveCount(1);
});

it('checks if partner has a feature enabled', function (): void {
    $partner = Partner::factory()->create();

    PartnerFeature::create([
        'partner_id' => $partner->id,
        'key' => PartnerFeatureKey::SHOPS->value,
        'is_enabled' => true,
    ]);

    PartnerFeature::create([
        'partner_id' => $partner->id,
        'key' => PartnerFeatureKey::PAYMENT->value,
        'is_enabled' => false,
    ]);

    expect($partner->hasFeature(PartnerFeatureKey::SHOPS))->toBeTrue()
        ->and($partner->hasFeature(PartnerFeatureKey::PAYMENT))->toBeFalse()
        ->and($partner->hasFeature(PartnerFeatureKey::SMS_TEMPLATES))->toBeFalse();
});

it('supports soft deletes', function (): void {
    $partner = Partner::factory()->create();
    $partner->delete();

    expect(Partner::count())->toBe(0)
        ->and(Partner::withTrashed()->count())->toBe(1);
});

it('casts is_active as boolean', function (): void {
    $partner = Partner::factory()->create(['is_active' => true]);

    expect($partner->is_active)->toBeTrue()->toBeBool();
});

it('casts euro_credits as decimal', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.50']);

    expect($partner->euro_credits)->toBe('100.50')->toBeString();
});
