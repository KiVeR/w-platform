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

    private TransitionService $transitionService;

    private int $transitioned = 0;

    private int $skipped = 0;

    private int $failed = 0;

    public function handle(TransitionService $transitionService): int
    {
        $this->transitionService = $transitionService;

        $this->transitionReadyToScheduled();
        $this->transitionScheduledToProcessing();
        $this->transitionProcessingToDelivered();
        $this->transitionDeliveredToCompleted();

        return self::SUCCESS;
    }

    private function transitionReadyToScheduled(): void
    {
        Operation::where('lifecycle_status', LifecycleStatus::READY->value)
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->each(function (Operation $operation): void {
                $this->safeTransition($operation, LifecycleStatus::SCHEDULED, 'ready->scheduled');
            });
    }

    private function transitionScheduledToProcessing(): void
    {
        if (! $this->isWithinSendingWindow()) {
            return;
        }

        Operation::query()
            ->where('lifecycle_status', LifecycleStatus::SCHEDULED)
            ->where('scheduled_at', '<=', now())
            ->each(function (Operation $operation): void {
                $this->safeTransition($operation, LifecycleStatus::PROCESSING, 'scheduled->processing');
            });
    }

    private function transitionProcessingToDelivered(): void
    {
        Operation::query()
            ->where('lifecycle_status', LifecycleStatus::PROCESSING)
            ->whereHas('campaign', fn ($q) => $q->where('status', CampaignStatus::SENT))
            ->each(function (Operation $operation): void {
                $this->safeTransition($operation, LifecycleStatus::DELIVERED, 'processing->delivered');
            });
    }

    private function transitionDeliveredToCompleted(): void
    {
        Operation::query()
            ->where('lifecycle_status', LifecycleStatus::DELIVERED)
            ->where('delivered_at', '<=', now()->subHours(72))
            ->each(function (Operation $operation): void {
                $this->safeTransition($operation, LifecycleStatus::COMPLETED, 'delivered->completed');
            });
    }

    private function safeTransition(
        Operation $operation,
        LifecycleStatus $target,
        string $label,
    ): void {
        try {
            $this->transitionService->applyTransition(
                $operation, 'lifecycle', $target, null, "auto: {$label}",
            );
            $this->transitioned++;
        } catch (InvalidTransitionException $e) {
            Log::info("Auto-transition skipped ({$label}): {$e->getMessage()}");
            $this->skipped++;
        } catch (Throwable $e) {
            Log::error("Auto-transition failed ({$label}): {$e->getMessage()}", [
                'operation_id' => $operation->id,
            ]);
            $this->failed++;
        }
    }

    private function isWithinSendingWindow(): bool
    {
        $hour = Carbon::now('Europe/Paris')->hour;

        return $hour >= 8 && $hour < 20;
    }
}
