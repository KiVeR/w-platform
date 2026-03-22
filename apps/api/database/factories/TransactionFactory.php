<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\TransactionType;
use App\Models\Partner;
use App\Models\Transaction;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transaction>
 */
class TransactionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'partner_id' => Partner::factory(),
            'type' => TransactionType::CREDIT->value,
            'amount' => '100.00',
            'balance_after' => '100.00',
            'description' => fake()->sentence(),
        ];
    }

    public function credit(): static
    {
        return $this->state([
            'type' => TransactionType::CREDIT->value,
            'amount' => '100.00',
        ]);
    }

    public function debit(): static
    {
        return $this->state([
            'type' => TransactionType::DEBIT->value,
            'amount' => '-50.00',
        ]);
    }

    public function refund(): static
    {
        return $this->state([
            'type' => TransactionType::REFUND->value,
            'amount' => '25.00',
        ]);
    }

    public function forPartner(Partner $partner): static
    {
        return $this->state(['partner_id' => $partner->id]);
    }
}
