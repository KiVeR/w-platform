<?php

declare(strict_types=1);

use App\Exceptions\InsufficientCreditsException;
use App\Models\Partner;
use App\Services\CreditService;

it('has enough credits when balance is sufficient', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);

    $service = new CreditService;

    expect($service->hasEnoughCredits($partner, 50.0))->toBeTrue();
});

it('does not have enough credits when balance is insufficient', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '10.00']);

    $service = new CreditService;

    expect($service->hasEnoughCredits($partner, 50.0))->toBeFalse();
});

it('has enough credits at exact balance', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '50.00']);

    $service = new CreditService;

    expect($service->hasEnoughCredits($partner, 50.0))->toBeTrue();
});

it('deducts credits atomically', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);

    $service = new CreditService;
    $service->deduct($partner, 30.0);

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(70.0);
});

it('deducts exact balance to zero', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '50.00']);

    $service = new CreditService;
    $service->deduct($partner, 50.0);

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(0.0);
});

it('throws InsufficientCreditsException when balance is too low', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '10.00']);

    $service = new CreditService;
    $service->deduct($partner, 50.0);
})->throws(InsufficientCreditsException::class);

it('does not deduct when amount is zero', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);

    $service = new CreditService;
    $service->deduct($partner, 0);

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(100.0);
});

it('does not deduct when amount is negative', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);

    $service = new CreditService;
    $service->deduct($partner, -10.0);

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(100.0);
});

it('refunds credits correctly', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '50.00']);

    $service = new CreditService;
    $service->refund($partner, 30.0);

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(80.0);
});

it('does not refund when amount is zero', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '50.00']);

    $service = new CreditService;
    $service->refund($partner, 0);

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(50.0);
});
