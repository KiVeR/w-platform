<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\InsufficientCreditsException;
use App\Models\Partner;

/**
 * Compatibility facade — delegates to BalanceService.
 *
 * Keeps the public interface used by CampaignsController and
 * ProcessCampaignSendingJob unchanged while adding ledger tracking.
 */
class CreditService
{
    public function __construct(
        private readonly BalanceService $balanceService,
    ) {}

    public function hasEnoughCredits(Partner $partner, float $amount): bool
    {
        return $this->balanceService->hasEnoughCredits($partner, $amount);
    }

    /**
     * @throws InsufficientCreditsException
     */
    public function deduct(Partner $partner, float $amount): void
    {
        if ($amount <= 0) {
            return;
        }

        $this->balanceService->debit($partner, $amount, 'Débit campagne SMS');
    }

    public function refund(Partner $partner, float $amount): void
    {
        if ($amount <= 0) {
            return;
        }

        $this->balanceService->refund($partner, $amount, 'Remboursement campagne SMS');
    }
}
