<?php

declare(strict_types=1);

use App\Enums\CancellationType;
use App\Enums\HoldReason;
use App\Enums\LifecycleStatus;
use App\Exceptions\InvalidTransitionException;
use App\Models\Operation;
use App\Models\OperationTransition;
use App\Models\User;
use App\Services\StateMachine\TransitionService;

it('canTransition returns true for valid transition', function (): void {
    $operation = Operation::factory()->create();

    $service = new TransitionService;

    expect($service->canTransition($operation, 'lifecycle', LifecycleStatus::PREPARING))->toBeTrue();
});

it('canTransition returns false for invalid transition', function (): void {
    $operation = Operation::factory()->create();

    $service = new TransitionService;

    expect($service->canTransition($operation, 'lifecycle', LifecycleStatus::COMPLETED))->toBeFalse();
});

it('applies valid transition and creates audit trail', function (): void {
    $operation = Operation::factory()->create();

    $user = User::factory()->create();

    $service = new TransitionService;
    $updated = $service->applyTransition($operation, 'lifecycle', LifecycleStatus::PREPARING, $user->id, 'Starting prep');

    expect($updated->lifecycle_status)->toBe(LifecycleStatus::PREPARING);

    $transition = OperationTransition::where('operation_id', $operation->id)->first();

    expect($transition)->not->toBeNull()
        ->and($transition->track)->toBe('lifecycle')
        ->and($transition->from_state)->toBe('draft')
        ->and($transition->to_state)->toBe('preparing')
        ->and($transition->user_id)->toBe($user->id)
        ->and($transition->reason)->toBe('Starting prep');
});

it('throws InvalidTransitionException on invalid transition', function (): void {
    $operation = Operation::factory()->create();

    $service = new TransitionService;
    $service->applyTransition($operation, 'lifecycle', LifecycleStatus::COMPLETED);
})->throws(InvalidTransitionException::class);

it('sets hold_reason when transitioning to ON_HOLD', function (): void {
    $operation = Operation::factory()->create(['lifecycle_status' => LifecycleStatus::PREPARING->value]);

    $service = new TransitionService;
    $updated = $service->applyTransition(
        $operation,
        'lifecycle',
        LifecycleStatus::ON_HOLD,
        null,
        null,
        ['hold_reason' => HoldReason::AWAITING_PAYMENT->value],
    );

    expect($updated->hold_reason)->toBe(HoldReason::AWAITING_PAYMENT);
});

it('clears hold_reason when leaving ON_HOLD', function (): void {
    $operation = Operation::factory()->create([
        'lifecycle_status' => LifecycleStatus::ON_HOLD->value,
        'hold_reason' => HoldReason::AWAITING_PAYMENT->value,
    ]);

    $service = new TransitionService;
    $updated = $service->applyTransition($operation, 'lifecycle', LifecycleStatus::PREPARING);

    expect($updated->hold_reason)->toBeNull();
});

it('sets cancellation_type on CANCELLED from metadata', function (): void {
    $operation = Operation::factory()->create();

    $service = new TransitionService;
    $updated = $service->applyTransition(
        $operation,
        'lifecycle',
        LifecycleStatus::CANCELLED,
        null,
        null,
        ['cancellation_type' => CancellationType::CLIENT_REQUEST->value],
    );

    expect($updated->cancellation_type)->toBe(CancellationType::CLIENT_REQUEST);
});

it('defaults to ADMIN_DECISION cancellation if no metadata', function (): void {
    $operation = Operation::factory()->create();

    $service = new TransitionService;
    $updated = $service->applyTransition($operation, 'lifecycle', LifecycleStatus::CANCELLED);

    expect($updated->cancellation_type)->toBe(CancellationType::ADMIN_DECISION);
});

it('applyMultipleTransitions applies all transitions atomically', function (): void {
    $operation = Operation::factory()->loc()->create([
        'lifecycle_status' => LifecycleStatus::DRAFT->value,
    ]);

    $service = new TransitionService;
    $updated = $service->applyMultipleTransitions($operation, [
        'lifecycle' => LifecycleStatus::CANCELLED,
    ]);

    expect($updated->lifecycle_status)->toBe(LifecycleStatus::CANCELLED);

    $count = OperationTransition::where('operation_id', $operation->id)->count();

    expect($count)->toBe(1);
});

it('audit trail records from and to states correctly', function (): void {
    $operation = Operation::factory()->create(['lifecycle_status' => LifecycleStatus::PREPARING->value]);

    $service = new TransitionService;
    $service->applyTransition($operation, 'lifecycle', LifecycleStatus::ON_HOLD);

    $transition = OperationTransition::where('operation_id', $operation->id)->latest('id')->first();

    expect($transition->from_state)->toBe('preparing')
        ->and($transition->to_state)->toBe('on_hold');
});
