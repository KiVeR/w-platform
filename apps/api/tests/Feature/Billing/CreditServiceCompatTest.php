<?php

declare(strict_types=1);

use App\Exceptions\InsufficientCreditsException;
use App\Models\Partner;
use App\Models\Transaction;
use App\Services\CreditService;

it('deduct delegates to BalanceService and creates transaction', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);

    $service = app(CreditService::class);
    $service->deduct($partner, 30.0);

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(70.0);
    expect(Transaction::where('partner_id', $partner->id)->count())->toBe(1);
});

it('refund delegates to BalanceService and creates transaction', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '50.00']);

    $service = app(CreditService::class);
    $service->refund($partner, 30.0);

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(80.0);
    expect(Transaction::where('partner_id', $partner->id)->count())->toBe(1);
});

it('hasEnoughCredits still works through facade', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);

    $service = app(CreditService::class);

    expect($service->hasEnoughCredits($partner, 50.0))->toBeTrue()
        ->and($service->hasEnoughCredits($partner, 150.0))->toBeFalse();
});

it('deduct throws InsufficientCreditsException via facade', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '10.00']);

    $service = app(CreditService::class);
    $service->deduct($partner, 50.0);
})->throws(InsufficientCreditsException::class);

it('deduct with zero amount creates no transaction', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);

    $service = app(CreditService::class);
    $service->deduct($partner, 0);

    expect(Transaction::where('partner_id', $partner->id)->count())->toBe(0);
    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(100.0);
});

it('refund with zero amount creates no transaction', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '50.00']);

    $service = app(CreditService::class);
    $service->refund($partner, 0);

    expect(Transaction::where('partner_id', $partner->id)->count())->toBe(0);
});
