<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\InvoiceStatus;
use App\Models\Invoice;
use App\Models\Partner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $yymm = now()->format('ym');

        return [
            'partner_id'     => Partner::factory(),
            'invoice_number' => 'INV-' . $yymm . '-' . fake()->unique()->numerify('####'),
            'invoice_date'   => now()->toDateString(),
            'due_date'       => now()->addDays(30)->toDateString(),
            'subtotal_ht'    => '100.00',
            'tax_rate'       => '20.00',
            'tax_amount'     => '20.00',
            'total_ttc'      => '120.00',
            'status'         => InvoiceStatus::DRAFT->value,
        ];
    }

    public function draft(): static
    {
        return $this->state(['status' => InvoiceStatus::DRAFT->value]);
    }

    public function sent(): static
    {
        return $this->state(['status' => InvoiceStatus::SENT->value]);
    }

    public function paid(): static
    {
        return $this->state([
            'status'         => InvoiceStatus::PAID->value,
            'paid_at'        => now(),
            'payment_method' => 'prepaid',
        ]);
    }

    public function forPartner(Partner $partner): static
    {
        return $this->state(['partner_id' => $partner->id]);
    }
}
