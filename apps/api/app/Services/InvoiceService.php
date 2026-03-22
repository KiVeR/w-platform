<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\Operation;
use Illuminate\Support\Facades\DB;

final class InvoiceService
{
    /**
     * Create a draft invoice from an operation.
     * Idempotent: if an InvoiceLine already exists for this operation, returns the existing invoice.
     */
    public function createDraftFromOperation(Operation $operation): Invoice
    {
        $existingLine = InvoiceLine::where('operation_id', $operation->id)->first();
        if ($existingLine !== null) {
            return $existingLine->invoice;
        }

        return DB::transaction(function () use ($operation): Invoice {
            $demande = $operation->demande;
            $isExoneration = $demande?->is_exoneration ?? false;
            $taxRate = $isExoneration ? 0.00 : 20.00;

            $volume = $operation->volume_sent ?? $operation->volume_estimated ?? 0;
            $unitPrice = $operation->unit_price ?? 0.0;
            $totalHt = round($volume * $unitPrice, 2);
            $taxAmount = round($totalHt * $taxRate / 100, 2);

            $invoice = Invoice::create([
                'partner_id' => $demande?->partner_id,
                'invoice_number' => $this->generateInvoiceNumber(),
                'invoice_date' => now()->toDateString(),
                'due_date' => now()->addDays(30)->toDateString(),
                'subtotal_ht' => $totalHt,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'total_ttc' => round($totalHt + $taxAmount, 2),
                'status' => InvoiceStatus::DRAFT,
            ]);

            InvoiceLine::create([
                'invoice_id' => $invoice->id,
                'operation_id' => $operation->id,
                'description' => "Opération {$operation->ref_operation} — {$operation->name}",
                'quantity' => $volume,
                'unit_price' => $unitPrice,
                'total_ht' => $totalHt,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
            ]);

            return $invoice;
        });
    }

    /**
     * Add a line from an operation to an existing invoice.
     * Idempotent: skips if a line for this operation already exists on this invoice.
     */
    public function addLineFromOperation(Invoice $invoice, Operation $operation): InvoiceLine
    {
        $existing = $invoice->lines()->where('operation_id', $operation->id)->first();
        if ($existing !== null) {
            return $existing;
        }

        return DB::transaction(function () use ($invoice, $operation): InvoiceLine {
            $demande = $operation->demande;
            $isExoneration = $demande?->is_exoneration ?? false;
            $taxRate = $isExoneration ? 0.00 : $invoice->tax_rate;

            $volume = $operation->volume_sent ?? $operation->volume_estimated ?? 0;
            $unitPrice = $operation->unit_price ?? 0.0;
            $totalHt = round($volume * $unitPrice, 2);
            $taxAmount = round($totalHt * (float) $taxRate / 100, 2);

            $line = InvoiceLine::create([
                'invoice_id' => $invoice->id,
                'operation_id' => $operation->id,
                'description' => "Opération {$operation->ref_operation} — {$operation->name}",
                'quantity' => $volume,
                'unit_price' => $unitPrice,
                'total_ht' => $totalHt,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
            ]);

            $this->recalculateTotals($invoice);

            return $line;
        });
    }

    /** Finalize: recalculate totals from lines, set status to SENT. */
    public function finalize(Invoice $invoice): Invoice
    {
        return DB::transaction(function () use ($invoice): Invoice {
            $this->recalculateTotals($invoice);
            $invoice->update(['status' => InvoiceStatus::SENT]);

            return $invoice->fresh();
        });
    }

    /** Mark invoice as paid. */
    public function markAsPaid(Invoice $invoice, string $method): Invoice
    {
        $invoice->update([
            'status' => InvoiceStatus::PAID,
            'paid_at' => now(),
            'payment_method' => $method,
        ]);

        return $invoice->fresh();
    }

    /** Create a credit note (avoir) referencing the original invoice. */
    public function createCreditNote(Invoice $original, ?string $reason = null): Invoice
    {
        return DB::transaction(function () use ($original, $reason): Invoice {
            $creditNote = Invoice::create([
                'partner_id' => $original->partner_id,
                'credited_invoice_id' => $original->id,
                'invoice_number' => $this->generateInvoiceNumber(),
                'invoice_date' => now()->toDateString(),
                'due_date' => now()->toDateString(),
                'subtotal_ht' => -(float) $original->subtotal_ht,
                'tax_rate' => $original->tax_rate,
                'tax_amount' => -(float) $original->tax_amount,
                'total_ttc' => -(float) $original->total_ttc,
                'status' => InvoiceStatus::CREDITED,
                'notes' => $reason,
            ]);

            foreach ($original->lines as $line) {
                InvoiceLine::create([
                    'invoice_id' => $creditNote->id,
                    'operation_id' => $line->operation_id,
                    'description' => "[Avoir] {$line->description}",
                    'quantity' => $line->quantity,
                    'unit_price' => $line->unit_price,
                    'total_ht' => -(float) $line->total_ht,
                    'tax_rate' => $line->tax_rate,
                    'tax_amount' => -(float) $line->tax_amount,
                ]);
            }

            $original->update(['status' => InvoiceStatus::CREDITED]);

            return $creditNote;
        });
    }

    /** Generate a unique invoice number: INV-YYMM-XXXX. */
    public function generateInvoiceNumber(): string
    {
        $prefix = 'INV-'.now()->format('ym').'-';

        return DB::transaction(function () use ($prefix): string {
            $maxAttempts = 10;

            for ($i = 0; $i < $maxAttempts; $i++) {
                $number = $prefix.str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT);

                if (! Invoice::where('invoice_number', $number)->exists()) {
                    return $number;
                }
            }

            // Fallback with higher entropy
            return $prefix.strtoupper(substr(md5(uniqid('', true)), 0, 4));
        });
    }

    private function recalculateTotals(Invoice $invoice): void
    {
        $lines = $invoice->lines()->get();

        $subtotalHt = $lines->sum(fn (InvoiceLine $line): float => (float) $line->total_ht);
        $taxAmount = $lines->sum(fn (InvoiceLine $line): float => (float) $line->tax_amount);

        $invoice->update([
            'subtotal_ht' => round($subtotalHt, 2),
            'tax_amount' => round($taxAmount, 2),
            'total_ttc' => round($subtotalHt + $taxAmount, 2),
        ]);
    }
}
