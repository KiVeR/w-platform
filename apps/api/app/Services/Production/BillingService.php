<?php

declare(strict_types=1);

namespace App\Services\Production;

use App\Enums\BillingMode;
use App\Enums\BillingStatus;
use App\Models\Operation;
use App\Services\BalanceService;
use App\Services\StateMachine\TransitionService;
use Illuminate\Support\Facades\Log;

final class BillingService
{
    public function __construct(
        private readonly BalanceService $balanceService,
        private readonly TransitionService $transitionService,
    ) {}

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
