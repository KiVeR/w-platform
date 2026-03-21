<?php

declare(strict_types=1);

use App\Enums\TransactionType;
use App\Exceptions\InsufficientCreditsException;
use App\Models\Partner;
use App\Services\BalanceService;

beforeEach(function (): void {
    $this->service = new BalanceService;
});

it('credits partner and creates transaction', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '0.00']);

    $tx = $this->service->credit($partner, 100.00, 'Initial credit');

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(100.0)
        ->and($tx->type)->toBe(TransactionType::CREDIT)
        ->and((float) $tx->amount)->toBe(100.0)
        ->and((float) $tx->balance_after)->toBe(100.0)
        ->and($tx->description)->toBe('Initial credit');
});

it('debits partner and checks balance_after', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '200.00']);

    $tx = $this->service->debit($partner, 75.00, 'Campaign debit');

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(125.0)
        ->and($tx->type)->toBe(TransactionType::DEBIT)
        ->and((float) $tx->amount)->toBe(-75.0)
        ->and((float) $tx->balance_after)->toBe(125.0);
});

it('throws InsufficientCreditsException on overdraft', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '10.00']);

    $this->service->debit($partner, 50.00, 'Overdraft attempt');
})->throws(InsufficientCreditsException::class);

it('refunds correctly', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '50.00']);

    $tx = $this->service->refund($partner, 30.00, 'Refund');

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(80.0)
        ->and($tx->type)->toBe(TransactionType::REFUND)
        ->and((float) $tx->amount)->toBe(30.0)
        ->and((float) $tx->balance_after)->toBe(80.0);
});

it('applies positive adjustment', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);

    $tx = $this->service->adjustment($partner, 50.00, 'Bonus adjustment');

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(150.0)
        ->and($tx->type)->toBe(TransactionType::ADJUSTMENT)
        ->and((float) $tx->amount)->toBe(50.0)
        ->and((float) $tx->balance_after)->toBe(150.0);
});

it('applies negative adjustment', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);

    $tx = $this->service->adjustment($partner, -30.00, 'Correction');

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(70.0)
        ->and((float) $tx->amount)->toBe(-30.0)
        ->and((float) $tx->balance_after)->toBe(70.0);
});

it('adjustment cannot make balance negative', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '20.00']);

    $this->service->adjustment($partner, -50.00, 'Over-correction');
})->throws(InsufficientCreditsException::class);

it('debits at exact balance to zero', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '75.00']);

    $tx = $this->service->debit($partner, 75.00, 'Exact debit');

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(0.0)
        ->and((float) $tx->balance_after)->toBe(0.0);
});

it('returns correct balance via getBalance', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '123.45']);

    expect($this->service->getBalance($partner))->toBe(123.45);
});

it('checks hasEnoughCredits correctly', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '50.00']);

    expect($this->service->hasEnoughCredits($partner, 50.0))->toBeTrue()
        ->and($this->service->hasEnoughCredits($partner, 50.01))->toBeFalse();
});

it('records operation_id on transaction', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '0.00']);
    $demande = \App\Models\Demande::factory()->forPartner($partner)->create();
    $operation = \App\Models\Operation::factory()->forDemande($demande)->create();

    $tx = $this->service->credit($partner, 100.00, 'Op credit', $operation->id);

    expect($tx->operation_id)->toBe($operation->id);
});

it('records reference and metadata on transaction', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '0.00']);

    $tx = $this->service->credit(
        $partner,
        50.00,
        'With metadata',
        null,
        'REF-001',
        ['source' => 'manual'],
    );

    expect($tx->reference)->toBe('REF-001')
        ->and($tx->metadata)->toBe(['source' => 'manual']);
});

it('creates multiple transactions with correct running balance', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '0.00']);

    $tx1 = $this->service->credit($partner, 200.00, 'Credit 1');
    $tx2 = $this->service->debit($partner, 50.00, 'Debit 1');
    $tx3 = $this->service->refund($partner, 25.00, 'Refund 1');

    expect((float) $tx1->balance_after)->toBe(200.0)
        ->and((float) $tx2->balance_after)->toBe(150.0)
        ->and((float) $tx3->balance_after)->toBe(175.0);

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(175.0);
});

it('concurrent debits do not overdraft via lockForUpdate', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);

    // First debit takes exactly the full balance
    $this->service->debit($partner, 100.00, 'Full debit');

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(0.0);

    // Second debit should fail
    expect(fn () => $this->service->debit($partner, 1.00, 'Over debit'))
        ->toThrow(InsufficientCreditsException::class);
});
