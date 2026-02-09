<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\InsufficientCreditsException;
use App\Models\Partner;

class CreditService
{
    public function hasEnoughCredits(Partner $partner, float $amount): bool
    {
        return (float) $partner->euro_credits >= $amount;
    }

    /**
     * @throws InsufficientCreditsException
     */
    public function deduct(Partner $partner, float $amount): void
    {
        if ($amount <= 0) {
            return;
        }

        $partner->refresh();

        if (! $this->hasEnoughCredits($partner, $amount)) {
            throw new InsufficientCreditsException($amount, (float) $partner->euro_credits);
        }

        $partner->decrement('euro_credits', $amount);
    }

    public function refund(Partner $partner, float $amount): void
    {
        if ($amount <= 0) {
            return;
        }

        $partner->increment('euro_credits', $amount);
    }
}
