<?php

declare(strict_types=1);

use App\Enums\InvoiceStatus;
use App\Models\Demande;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\Operation;
use App\Models\Partner;
use App\Services\InvoiceService;

beforeEach(function (): void {
    $this->service = new InvoiceService;
    $this->partner = Partner::factory()->create();
    $this->demande = Demande::factory()->forPartner($this->partner)->create();
});

it('creates draft invoice from operation', function (): void {
    $operation = Operation::factory()->forDemande($this->demande)->create([
        'volume_estimated' => 1000,
        'unit_price' => 0.05,
    ]);

    $invoice = $this->service->createDraftFromOperation($operation);

    expect($invoice->status)->toBe(InvoiceStatus::DRAFT)
        ->and($invoice->partner_id)->toBe($this->partner->id)
        ->and((float) $invoice->subtotal_ht)->toBe(50.0)
        ->and((float) $invoice->tax_rate)->toBe(20.0)
        ->and((float) $invoice->tax_amount)->toBe(10.0)
        ->and((float) $invoice->total_ttc)->toBe(60.0)
        ->and($invoice->invoice_number)->toStartWith('INV-');

    expect($invoice->lines)->toHaveCount(1);
    expect($invoice->lines->first()->operation_id)->toBe($operation->id);
});

it('adds line from operation with correct amounts', function (): void {
    $invoice = Invoice::factory()->forPartner($this->partner)->create([
        'tax_rate' => '20.00',
    ]);

    $operation = Operation::factory()->forDemande($this->demande)->create([
        'volume_sent' => 500,
        'unit_price' => 0.08,
    ]);

    $line = $this->service->addLineFromOperation($invoice, $operation);

    expect($line->operation_id)->toBe($operation->id)
        ->and($line->quantity)->toBe(500)
        ->and((float) $line->total_ht)->toBe(40.0)
        ->and((float) $line->tax_amount)->toBe(8.0);
});

it('applies TVA exoneration with tax_rate 0', function (): void {
    $demande = Demande::factory()->forPartner($this->partner)->create([
        'is_exoneration' => true,
    ]);
    $operation = Operation::factory()->forDemande($demande)->create([
        'volume_estimated' => 1000,
        'unit_price' => 0.10,
    ]);

    $invoice = $this->service->createDraftFromOperation($operation);

    expect((float) $invoice->tax_rate)->toBe(0.0)
        ->and((float) $invoice->tax_amount)->toBe(0.0)
        ->and((float) $invoice->total_ttc)->toBe(100.0);
});

it('finalizes invoice and calculates totals', function (): void {
    $invoice = Invoice::factory()->forPartner($this->partner)->draft()->create([
        'subtotal_ht' => '0.00',
        'tax_amount' => '0.00',
        'total_ttc' => '0.00',
    ]);

    InvoiceLine::factory()->forInvoice($invoice)->create([
        'total_ht' => '100.00',
        'tax_amount' => '20.00',
    ]);
    InvoiceLine::factory()->forInvoice($invoice)->create([
        'total_ht' => '50.00',
        'tax_amount' => '10.00',
    ]);

    $finalized = $this->service->finalize($invoice);

    expect($finalized->status)->toBe(InvoiceStatus::SENT)
        ->and((float) $finalized->subtotal_ht)->toBe(150.0)
        ->and((float) $finalized->tax_amount)->toBe(30.0)
        ->and((float) $finalized->total_ttc)->toBe(180.0);
});

it('marks invoice as paid', function (): void {
    $invoice = Invoice::factory()->forPartner($this->partner)->sent()->create();

    $paid = $this->service->markAsPaid($invoice, 'prepaid');

    expect($paid->status)->toBe(InvoiceStatus::PAID)
        ->and($paid->paid_at)->not->toBeNull()
        ->and($paid->payment_method)->toBe('prepaid');
});

it('creates credit note from original invoice', function (): void {
    $original = Invoice::factory()->forPartner($this->partner)->paid()->create([
        'subtotal_ht' => '100.00',
        'tax_amount' => '20.00',
        'total_ttc' => '120.00',
    ]);
    InvoiceLine::factory()->forInvoice($original)->create([
        'description' => 'Test line',
        'total_ht' => '100.00',
        'tax_amount' => '20.00',
    ]);

    $creditNote = $this->service->createCreditNote($original, 'Client error');

    expect($creditNote->status)->toBe(InvoiceStatus::CREDITED)
        ->and($creditNote->credited_invoice_id)->toBe($original->id)
        ->and((float) $creditNote->subtotal_ht)->toBe(-100.0)
        ->and((float) $creditNote->tax_amount)->toBe(-20.0)
        ->and((float) $creditNote->total_ttc)->toBe(-120.0)
        ->and($creditNote->notes)->toBe('Client error');

    $original->refresh();
    expect($original->status)->toBe(InvoiceStatus::CREDITED);

    expect($creditNote->lines)->toHaveCount(1);
    expect($creditNote->lines->first()->description)->toStartWith('[Avoir]');
});

it('is idempotent: double createDraftFromOperation does not duplicate', function (): void {
    $operation = Operation::factory()->forDemande($this->demande)->create([
        'volume_estimated' => 500,
        'unit_price' => 0.06,
    ]);

    $invoice1 = $this->service->createDraftFromOperation($operation);
    $invoice2 = $this->service->createDraftFromOperation($operation);

    expect($invoice1->id)->toBe($invoice2->id);
    expect(InvoiceLine::where('operation_id', $operation->id)->count())->toBe(1);
});

it('is idempotent: double addLineFromOperation does not duplicate', function (): void {
    $invoice = Invoice::factory()->forPartner($this->partner)->create();
    $operation = Operation::factory()->forDemande($this->demande)->create([
        'volume_sent' => 200,
        'unit_price' => 0.05,
    ]);

    $line1 = $this->service->addLineFromOperation($invoice, $operation);
    $line2 = $this->service->addLineFromOperation($invoice, $operation);

    expect($line1->id)->toBe($line2->id);
    expect($invoice->lines()->count())->toBe(1);
});

it('generates unique invoice numbers', function (): void {
    $numbers = [];

    for ($i = 0; $i < 10; $i++) {
        $numbers[] = $this->service->generateInvoiceNumber();
    }

    expect(array_unique($numbers))->toHaveCount(10);
});

it('uses volume_sent over volume_estimated when available', function (): void {
    $operation = Operation::factory()->forDemande($this->demande)->create([
        'volume_estimated' => 1000,
        'volume_sent' => 800,
        'unit_price' => 0.10,
    ]);

    $invoice = $this->service->createDraftFromOperation($operation);

    // Should use volume_sent (800) not volume_estimated (1000)
    expect((float) $invoice->subtotal_ht)->toBe(80.0);
});
