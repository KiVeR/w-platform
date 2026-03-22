<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\BillingStatus;
use App\Enums\LifecycleStatus;
use App\Models\Operation;
use App\Services\Production\BillingService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

class AutoBillDeliveredOperationsCommand extends Command
{
    /** @var string */
    protected $signature = 'operations:auto-bill';

    /** @var string */
    protected $description = 'Automatically bill delivered operations';

    public function handle(BillingService $billingService): int
    {
        $operations = Operation::query()
            ->where('lifecycle_status', LifecycleStatus::DELIVERED)
            ->where('billing_status', BillingStatus::PENDING)
            ->get();

        foreach ($operations as $operation) {
            try {
                $billingService->billOnDelivery($operation);
            } catch (Throwable $e) {
                Log::error("Auto-bill failed for operation #{$operation->id}: {$e->getMessage()}");
            }
        }

        return self::SUCCESS;
    }
}
