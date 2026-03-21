<?php

declare(strict_types=1);

use App\Models\Demande;
use App\Models\InvoiceLine;
use App\Models\Operation;
use App\Models\Partner;
use App\Models\Transaction;
use App\Services\InvoiceService;

it('prevents double invoice creation for same operation', function (): void {
    $partner = Partner::factory()->create();
    $demande = Demande::factory()->forPartner($partner)->create();
    $operation = Operation::factory()->forDemande($demande)->create([
        'volume_estimated' => 500,
        'unit_price'       => 0.05,
    ]);

    $service = new InvoiceService;

    $invoice1 = $service->createDraftFromOperation($operation);
    $invoice2 = $service->createDraftFromOperation($operation);

    expect($invoice1->id)->toBe($invoice2->id);
    expect(InvoiceLine::where('operation_id', $operation->id)->count())->toBe(1);
});

it('transaction update throws LogicException', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);

    $tx = Transaction::create([
        'partner_id'    => $partner->id,
        'type'          => 'credit',
        'amount'        => '100.00',
        'balance_after' => '100.00',
        'description'   => 'Test',
    ]);

    $tx->update(['description' => 'Modified']);
})->throws(LogicException::class, 'Transactions are immutable and cannot be updated.');

it('transaction delete throws LogicException', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);

    $tx = Transaction::create([
        'partner_id'    => $partner->id,
        'type'          => 'credit',
        'amount'        => '100.00',
        'balance_after' => '100.00',
        'description'   => 'Test',
    ]);

    $tx->delete();
})->throws(LogicException::class, 'Transactions are immutable and cannot be deleted.');

it('Transaction has no updated_at column', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => '100.00']);

    $tx = Transaction::create([
        'partner_id'    => $partner->id,
        'type'          => 'credit',
        'amount'        => '100.00',
        'balance_after' => '100.00',
        'description'   => 'Immutable test',
    ]);

    expect($tx->getUpdatedAtColumn())->toBeNull();
});

it('invoice number format is INV-YYMM-XXXX', function (): void {
    $service = new InvoiceService;
    $number = $service->generateInvoiceNumber();

    expect($number)->toMatch('/^INV-\d{4}-\w{4}$/');
});
