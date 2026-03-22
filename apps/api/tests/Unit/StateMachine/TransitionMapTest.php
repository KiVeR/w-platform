<?php

declare(strict_types=1);

use App\Enums\BillingStatus;
use App\Enums\CreativeStatus;
use App\Enums\LifecycleStatus;
use App\Enums\OperationRoutingStatus;
use App\Services\StateMachine\TransitionMap;

it('returns valid lifecycle transitions from draft', function (): void {
    $allowed = TransitionMap::allowedTransitions('lifecycle', LifecycleStatus::DRAFT);

    expect($allowed)->toContain(LifecycleStatus::PREPARING)
        ->toContain(LifecycleStatus::CANCELLED)
        ->not->toContain(LifecycleStatus::COMPLETED)
        ->not->toContain(LifecycleStatus::READY);
});

it('validates draft to preparing', function (): void {
    expect(TransitionMap::isValid('lifecycle', LifecycleStatus::DRAFT, LifecycleStatus::PREPARING))->toBeTrue();
});

it('rejects invalid draft to completed', function (): void {
    expect(TransitionMap::isValid('lifecycle', LifecycleStatus::DRAFT, LifecycleStatus::COMPLETED))->toBeFalse();
});

it('validates creative pending to in_progress', function (): void {
    expect(TransitionMap::isValid('creative', CreativeStatus::PENDING, CreativeStatus::IN_PROGRESS))->toBeTrue();
});

it('rejects creative pending to approved', function (): void {
    expect(TransitionMap::isValid('creative', CreativeStatus::PENDING, CreativeStatus::APPROVED))->toBeFalse();
});

it('validates billing invoiced to paid', function (): void {
    expect(TransitionMap::isValid('billing', BillingStatus::INVOICED, BillingStatus::PAID))->toBeTrue();
});

it('validates routing pending to in_progress', function (): void {
    expect(TransitionMap::isValid('routing', OperationRoutingStatus::PENDING, OperationRoutingStatus::IN_PROGRESS))->toBeTrue();
});

it('validates routing failed from in_progress', function (): void {
    expect(TransitionMap::isValid('routing', OperationRoutingStatus::IN_PROGRESS, OperationRoutingStatus::FAILED))->toBeTrue();
});

it('throws on unknown track', function (): void {
    TransitionMap::allowedTransitions('unknown_track', LifecycleStatus::DRAFT);
})->throws(InvalidArgumentException::class, 'Unknown track: unknown_track');

it('resolves enum from string', function (): void {
    $result = TransitionMap::resolveEnum('lifecycle', 'draft');

    expect($result)->toBe(LifecycleStatus::DRAFT);
});

it('throws on invalid enum value for track', function (): void {
    TransitionMap::resolveEnum('lifecycle', 'nonexistent');
})->throws(InvalidArgumentException::class, "Invalid state value 'nonexistent' for track 'lifecycle'.");
