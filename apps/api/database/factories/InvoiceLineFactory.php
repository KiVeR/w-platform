<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\InvoiceLine;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InvoiceLine>
 */
class InvoiceLineFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $quantity = 1;
        $unitPrice = fake()->randomFloat(4, 0.01, 0.10);
        $totalHt = round($quantity * $unitPrice, 2);
        $taxRate = 20.00;
        $taxAmount = round($totalHt * $taxRate / 100, 2);

        return [
            'invoice_id'  => Invoice::factory(),
            'description' => fake()->sentence(),
            'quantity'     => $quantity,
            'unit_price'   => number_format($unitPrice, 4, '.', ''),
            'total_ht'     => number_format($totalHt, 2, '.', ''),
            'tax_rate'     => number_format($taxRate, 2, '.', ''),
            'tax_amount'   => number_format($taxAmount, 2, '.', ''),
        ];
    }

    public function forInvoice(Invoice $invoice): static
    {
        return $this->state(['invoice_id' => $invoice->id]);
    }
}
