<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\CampaignStatus;
use App\Enums\LifecycleStatus;
use App\Exceptions\InvalidTransitionException;
use App\Models\Operation;
use App\Services\StateMachine\TransitionService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

class AutoTransitionOperationsCommand extends Command
{
    /** @var string */
    protected $signature = 'operations:auto-transition';

    /** @var string */
    protected $description = 'Automatically transition operations through their lifecycle';

    public function handle(TransitionService $transitionService): int
    {
        $this->transitionScheduledToProcessing($transitionService);
        $this->transitionProcessingToDelivered($transitionService);
        $this->transitionDeliveredToCompleted($transitionService);

        return self::SUCCESS;
    }

    private function transitionScheduledToProcessing(TransitionService $ts): void
    {
        if (! $this->isWithinSendingWindow()) {
            return;
        }

        $operations = Operation::query()
            ->where('lifecycle_status', LifecycleStatus::SCHEDULED)
            ->where('scheduled_at', '<=', now())
            ->get();

        foreach ($operations as $operation) {
            $this->safeTransition($ts, $operation, LifecycleStatus::PROCESSING, 'scheduled->processing');
        }
    }

    private function transitionProcessingToDelivered(TransitionService $ts): void
    {
        $operations = Operation::query()
            ->where('lifecycle_status', LifecycleStatus::PROCESSING)
            ->whereHas('campaign', fn ($q) => $q->where('status', CampaignStatus::SENT))
            ->get();

        foreach ($operations as $operation) {
            $this->safeTransition($ts, $operation, LifecycleStatus::DELIVERED, 'processing->delivered');
        }
    }

    private function transitionDeliveredToCompleted(TransitionService $ts): void
    {
        $operations = Operation::query()
            ->where('lifecycle_status', LifecycleStatus::DELIVERED)
            ->where('delivered_at', '<=', now()->subHours(72))
            ->get();

        foreach ($operations as $operation) {
            $this->safeTransition($ts, $operation, LifecycleStatus::COMPLETED, 'delivered->completed');
        }
    }

    private function safeTransition(
        TransitionService $ts,
        Operation $operation,
        LifecycleStatus $target,
        string $label,
    ): void {
        try {
            $ts->applyTransition($operation, 'lifecycle', $target, null, "auto: {$label}");
        } catch (InvalidTransitionException $e) {
            Log::info("Auto-transition skipped ({$label}): {$e->getMessage()}");
        } catch (Throwable $e) {
            Log::error("Auto-transition failed ({$label}): {$e->getMessage()}", [
                'operation_id' => $operation->id,
            ]);
        }
    }

    private function isWithinSendingWindow(): bool
    {
        $hour = Carbon::now('Europe/Paris')->hour;

        return $hour >= 8 && $hour < 20;
    }
}
