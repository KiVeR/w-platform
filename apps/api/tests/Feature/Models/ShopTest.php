<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\Shop;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('can create a shop with required fields', function (): void {
    $partner = Partner::factory()->create();
    $shop = Shop::factory()->forPartner($partner)->create([
        'name' => 'Boutique Paris',
    ]);

    expect($shop)
        ->name->toBe('Boutique Paris')
        ->partner_id->toBe($partner->id)
        ->is_active->toBeTrue();

    $this->assertDatabaseHas('shops', ['name' => 'Boutique Paris']);
});

it('can create a shop with geolocation', function (): void {
    $shop = Shop::factory()->create([
        'latitude' => 48.856614,
        'longitude' => 2.352222,
    ]);

    expect($shop)
        ->latitude->toBe(48.856614)
        ->longitude->toBe(2.352222);
});

it('belongs to a partner', function (): void {
    $partner = Partner::factory()->create(['name' => 'Test Partner']);
    $shop = Shop::factory()->forPartner($partner)->create();

    expect($shop->partner)
        ->toBeInstanceOf(Partner::class)
        ->name->toBe('Test Partner');
});

it('supports soft deletes', function (): void {
    $shop = Shop::factory()->create();
    $shop->delete();

    expect(Shop::count())->toBe(0)
        ->and(Shop::withTrashed()->count())->toBe(1);
});

it('casts is_active as boolean', function (): void {
    $shop = Shop::factory()->create(['is_active' => true]);

    expect($shop->is_active)->toBeTrue()->toBeBool();
});

it('casts latitude and longitude as float', function (): void {
    $shop = Shop::factory()->create([
        'latitude' => 48.856614,
        'longitude' => 2.352222,
    ]);

    expect($shop->latitude)->toBeFloat()
        ->and($shop->longitude)->toBeFloat();
});

it('allows nullable geolocation fields', function (): void {
    $shop = Shop::factory()->create([
        'latitude' => null,
        'longitude' => null,
    ]);

    expect($shop->latitude)->toBeNull()
        ->and($shop->longitude)->toBeNull();
});
