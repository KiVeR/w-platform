<?php

declare(strict_types=1);

namespace App\Services\Production;

use App\Enums\BillingMode;
use App\Enums\BillingStatus;
use App\Models\Operation;
use App\Services\BalanceService;
use App\Services\StateMachine\TransitionService;
use Illuminate\Support\Facades\Log;

/**
 * Handles billing for delivered operations.
 *
 * MVP Phase 1: Only PREPAID mode is implemented (debit from partner balance).
 * IMMEDIATE and END_OF_MONTH modes log a message and return without action.
 * These modes will be implemented in Phase 2.
 *
 * @see plans/track-adv-v2-mvp/step-4-production-readiness-minimale.md
 */
final class BillingService
{
    public function __construct(
        private readonly BalanceService $balanceService,
        private readonly TransitionService $transitionService,
    ) {}

    /**
     * Bill an operation upon delivery.
     *
     * Only operations with PENDING billing status and a billable type are processed.
     * The billing mode is determined by the partner's billing_mode setting (defaults to PREPAID).
     */
    public function billOnDelivery(Operation $operation): void
    {
        if ($operation->billing_status !== BillingStatus::PENDING) {
            return;
        }

        if (! $operation->isBillable()) {
            return;
        }

        $partner = $operation->demande->partner;
        $billingMode = $partner->billing_mode ?? BillingMode::PREPAID;

        match ($billingMode) {
            BillingMode::PREPAID => $this->billPrepaid($operation),
            BillingMode::IMMEDIATE => Log::info('Billing mode immediate not yet implemented', [
                'operation_id' => $operation->id,
            ]),
            BillingMode::END_OF_MONTH => Log::info('Billing mode end_of_month not yet implemented', [
                'operation_id' => $operation->id,
            ]),
        };
    }

    private function billPrepaid(Operation $operation): void
    {
        $partner = $operation->demande->partner;
        $amount = (float) ($operation->total_price ?? 0);

        if ($amount > 0) {
            $this->balanceService->debit(
                $partner,
                $amount,
                "Facturation opération {$operation->ref_operation}",
                $operation->id,
            );
        }

        $this->transitionService->applyTransition(
            $operation,
            'billing',
            BillingStatus::PREPAID,
            null,
            'auto: prepaid billing on delivery',
        );
    }
}
