<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\TransactionType;
use App\Exceptions\InsufficientCreditsException;
use App\Models\Partner;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

final class BalanceService
{
    /**
     * @param  array<string, mixed>|null  $metadata
     */
    public function credit(
        Partner $partner,
        float $amount,
        string $description,
        ?int $operationId = null,
        ?string $reference = null,
        ?array $metadata = null,
    ): Transaction {
        return DB::transaction(function () use ($partner, $amount, $description, $operationId, $reference, $metadata): Transaction {
            /** @var Partner $partner */
            $partner = Partner::lockForUpdate()->findOrFail($partner->id);

            $newBalance = (float) $partner->euro_credits + $amount;
            $partner->increment('euro_credits', $amount);

            return Transaction::create([
                'partner_id' => $partner->id,
                'operation_id' => $operationId,
                'type' => TransactionType::CREDIT,
                'amount' => $amount,
                'balance_after' => $newBalance,
                'description' => $description,
                'reference' => $reference,
                'metadata' => $metadata,
            ]);
        });
    }

    /**
     * @param  array<string, mixed>|null  $metadata
     *
     * @throws InsufficientCreditsException
     */
    public function debit(
        Partner $partner,
        float $amount,
        string $description,
        ?int $operationId = null,
        ?string $reference = null,
        ?array $metadata = null,
    ): Transaction {
        return DB::transaction(function () use ($partner, $amount, $description, $operationId, $reference, $metadata): Transaction {
            /** @var Partner $partner */
            $partner = Partner::lockForUpdate()->findOrFail($partner->id);

            $currentBalance = (float) $partner->euro_credits;

            if ($currentBalance < $amount) {
                throw new InsufficientCreditsException($amount, $currentBalance);
            }

            $newBalance = $currentBalance - $amount;
            $partner->decrement('euro_credits', $amount);

            return Transaction::create([
                'partner_id' => $partner->id,
                'operation_id' => $operationId,
                'type' => TransactionType::DEBIT,
                'amount' => -$amount,
                'balance_after' => $newBalance,
                'description' => $description,
                'reference' => $reference,
                'metadata' => $metadata,
            ]);
        });
    }

    /**
     * @param  array<string, mixed>|null  $metadata
     */
    public function refund(
        Partner $partner,
        float $amount,
        string $description,
        ?int $operationId = null,
        ?string $reference = null,
        ?array $metadata = null,
    ): Transaction {
        return DB::transaction(function () use ($partner, $amount, $description, $operationId, $reference, $metadata): Transaction {
            /** @var Partner $partner */
            $partner = Partner::lockForUpdate()->findOrFail($partner->id);

            $newBalance = (float) $partner->euro_credits + $amount;
            $partner->increment('euro_credits', $amount);

            return Transaction::create([
                'partner_id' => $partner->id,
                'operation_id' => $operationId,
                'type' => TransactionType::REFUND,
                'amount' => $amount,
                'balance_after' => $newBalance,
                'description' => $description,
                'reference' => $reference,
                'metadata' => $metadata,
            ]);
        });
    }

    /**
     * @param  array<string, mixed>|null  $metadata
     *
     * @throws InsufficientCreditsException
     */
    public function adjustment(
        Partner $partner,
        float $signedAmount,
        string $description,
        ?string $reference = null,
        ?array $metadata = null,
    ): Transaction {
        return DB::transaction(function () use ($partner, $signedAmount, $description, $reference, $metadata): Transaction {
            /** @var Partner $partner */
            $partner = Partner::lockForUpdate()->findOrFail($partner->id);

            $currentBalance = (float) $partner->euro_credits;
            $newBalance = $currentBalance + $signedAmount;

            if ($newBalance < 0) {
                throw new InsufficientCreditsException(abs($signedAmount), $currentBalance);
            }

            if ($signedAmount > 0) {
                $partner->increment('euro_credits', $signedAmount);
            } else {
                $partner->decrement('euro_credits', abs($signedAmount));
            }

            return Transaction::create([
                'partner_id' => $partner->id,
                'type' => TransactionType::ADJUSTMENT,
                'amount' => $signedAmount,
                'balance_after' => $newBalance,
                'description' => $description,
                'reference' => $reference,
                'metadata' => $metadata,
            ]);
        });
    }

    public function getBalance(Partner $partner): float
    {
        $partner->refresh();

        return (float) $partner->euro_credits;
    }

    public function hasEnoughCredits(Partner $partner, float $amount): bool
    {
        $partner->refresh();

        return (float) $partner->euro_credits >= $amount;
    }
}
