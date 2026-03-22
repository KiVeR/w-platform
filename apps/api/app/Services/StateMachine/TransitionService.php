<?php

declare(strict_types=1);

namespace App\Services\StateMachine;

use App\Enums\CancellationType;
use App\Enums\HoldReason;
use App\Enums\LifecycleStatus;
use App\Exceptions\InvalidTransitionException;
use App\Models\Operation;
use App\Models\OperationTransition;
use BackedEnum;
use Illuminate\Support\Facades\DB;

final class TransitionService
{
    public function canTransition(Operation $operation, string $track, BackedEnum $toState): bool
    {
        $currentState = TransitionMap::getCurrentState($operation, $track);

        return TransitionMap::isValid($track, $currentState, $toState);
    }

    /**
     * @param  array<string, mixed>|null  $metadata
     */
    public function applyTransition(
        Operation $operation,
        string $track,
        BackedEnum $toState,
        ?int $userId = null,
        ?string $reason = null,
        ?array $metadata = null,
    ): Operation {
        return DB::transaction(function () use ($operation, $track, $toState, $userId, $reason, $metadata): Operation {
            /** @var Operation $locked */
            $locked = Operation::lockForUpdate()->findOrFail($operation->id);

            $this->performTransition($locked, $track, $toState, $userId, $reason, $metadata);

            return $locked;
        });
    }

    /**
     * @param  array<string, BackedEnum>  $transitions
     * @param  array<string, mixed>|null  $metadata
     */
    public function applyMultipleTransitions(
        Operation $operation,
        array $transitions,
        ?int $userId = null,
        ?string $reason = null,
        ?array $metadata = null,
    ): Operation {
        return DB::transaction(function () use ($operation, $transitions, $userId, $reason, $metadata): Operation {
            /** @var Operation $locked */
            $locked = Operation::lockForUpdate()->findOrFail($operation->id);

            foreach ($transitions as $track => $toState) {
                $this->performTransition($locked, $track, $toState, $userId, $reason, $metadata);
            }

            return $locked;
        });
    }

    /**
     * @return list<BackedEnum>
     */
    public function availableTransitions(Operation $operation, string $track): array
    {
        $currentState = TransitionMap::getCurrentState($operation, $track);

        return TransitionMap::allowedTransitions($track, $currentState);
    }

    /**
     * @param  array<string, mixed>|null  $metadata
     */
    private function performTransition(
        Operation $operation,
        string $track,
        BackedEnum $toState,
        ?int $userId,
        ?string $reason,
        ?array $metadata,
    ): void {
        $fromState = TransitionMap::getCurrentState($operation, $track);

        if (! TransitionMap::isValid($track, $fromState, $toState)) {
            throw new InvalidTransitionException($track, $fromState, $toState, $operation->id);
        }

        TransitionMap::setState($operation, $track, $toState);

        if ($track === 'lifecycle') {
            $this->handleLifecycleSubStates($operation, $fromState, $toState, $metadata);
        }

        $operation->save();

        OperationTransition::create([
            'operation_id' => $operation->id,
            'track' => $track,
            'from_state' => $fromState->value,
            'to_state' => $toState->value,
            'user_id' => $userId,
            'reason' => $reason,
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }

    /**
     * @param  array<string, mixed>|null  $metadata
     */
    private function handleLifecycleSubStates(
        Operation $operation,
        BackedEnum $fromState,
        BackedEnum $toState,
        ?array $metadata,
    ): void {
        // Set hold_reason when entering ON_HOLD
        if ($toState === LifecycleStatus::ON_HOLD) {
            $holdReason = $metadata['hold_reason'] ?? null;
            if ($holdReason !== null) {
                $operation->hold_reason = HoldReason::tryFrom($holdReason);
            }
        }

        // Clear hold_reason when leaving ON_HOLD
        if ($fromState === LifecycleStatus::ON_HOLD) {
            $operation->hold_reason = null;
        }

        // Set cancellation_type when entering CANCELLED
        if ($toState === LifecycleStatus::CANCELLED) {
            $this->handleCancellation($operation, $metadata);
        }

        // Clear cancellation_type when leaving CANCELLED (shouldn't normally happen, but be safe)
        if ($fromState === LifecycleStatus::CANCELLED && $toState !== LifecycleStatus::CANCELLED) {
            $operation->cancellation_type = null;
        }
    }

    /**
     * @param  array<string, mixed>|null  $metadata
     */
    private function handleCancellation(Operation $operation, ?array $metadata): void
    {
        $type = $metadata['cancellation_type'] ?? null;

        $operation->cancellation_type = $type !== null
            ? (CancellationType::tryFrom($type) ?? CancellationType::ADMIN_DECISION)
            : CancellationType::ADMIN_DECISION;
    }
}
