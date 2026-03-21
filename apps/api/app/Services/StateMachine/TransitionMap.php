<?php

declare(strict_types=1);

namespace App\Services\StateMachine;

use App\Enums\BillingStatus;
use App\Enums\CreativeStatus;
use App\Enums\LifecycleStatus;
use App\Enums\OperationRoutingStatus;
use App\Models\Operation;
use BackedEnum;
use InvalidArgumentException;

final class TransitionMap
{
    /** @var list<string> */
    public const array VALID_TRACKS = ['lifecycle', 'creative', 'billing', 'routing'];

    /**
     * @return list<BackedEnum>
     */
    public static function allowedTransitions(string $track, BackedEnum $currentState): array
    {
        self::assertTrack($track);

        $enumClass = self::enumClassForTrack($track);
        $allowed = [];

        foreach ($enumClass::cases() as $candidate) {
            $sources = $candidate->transitionsFrom();
            if (in_array($currentState, $sources, true)) {
                $allowed[] = $candidate;
            }
        }

        return $allowed;
    }

    public static function isValid(string $track, BackedEnum $from, BackedEnum $to): bool
    {
        self::assertTrack($track);

        $sources = $to->transitionsFrom();

        return in_array($from, $sources, true);
    }

    public static function getCurrentState(Operation $operation, string $track): BackedEnum
    {
        self::assertTrack($track);

        return match ($track) {
            'lifecycle' => self::assertLifecycleStatus($operation->lifecycle_status),
            'creative'  => self::assertCreativeStatus($operation->creative_status),
            'billing'   => self::assertBillingStatus($operation->billing_status),
            'routing'   => self::assertRoutingStatus($operation->routing_status),
        };
    }

    public static function setState(Operation $operation, string $track, BackedEnum $toState): void
    {
        self::assertTrack($track);

        match ($track) {
            'lifecycle' => $operation->lifecycle_status = self::assertLifecycleStatus($toState),
            'creative'  => $operation->creative_status = self::assertCreativeStatus($toState),
            'billing'   => $operation->billing_status = self::assertBillingStatus($toState),
            'routing'   => $operation->routing_status = self::assertRoutingStatus($toState),
        };
    }

    public static function resolveEnum(string $track, string $value): BackedEnum
    {
        self::assertTrack($track);

        $enumClass = self::enumClassForTrack($track);

        $result = $enumClass::tryFrom($value);

        if ($result === null) {
            throw new InvalidArgumentException(
                "Invalid state value '{$value}' for track '{$track}'."
            );
        }

        return $result;
    }

    /**
     * @return class-string<BackedEnum>
     */
    private static function enumClassForTrack(string $track): string
    {
        return match ($track) {
            'lifecycle' => LifecycleStatus::class,
            'creative'  => CreativeStatus::class,
            'billing'   => BillingStatus::class,
            'routing'   => OperationRoutingStatus::class,
            default     => throw new InvalidArgumentException("Unknown track: {$track}"),
        };
    }

    private static function assertTrack(string $track): void
    {
        if (! in_array($track, self::VALID_TRACKS, true)) {
            throw new InvalidArgumentException("Unknown track: {$track}");
        }
    }

    private static function assertLifecycleStatus(mixed $status): LifecycleStatus
    {
        if (! $status instanceof LifecycleStatus) {
            throw new InvalidArgumentException('Expected LifecycleStatus enum.');
        }

        return $status;
    }

    private static function assertCreativeStatus(mixed $status): CreativeStatus
    {
        if (! $status instanceof CreativeStatus) {
            throw new InvalidArgumentException('Expected CreativeStatus enum.');
        }

        return $status;
    }

    private static function assertBillingStatus(mixed $status): BillingStatus
    {
        if (! $status instanceof BillingStatus) {
            throw new InvalidArgumentException('Expected BillingStatus enum.');
        }

        return $status;
    }

    private static function assertRoutingStatus(mixed $status): OperationRoutingStatus
    {
        if (! $status instanceof OperationRoutingStatus) {
            throw new InvalidArgumentException('Expected OperationRoutingStatus enum.');
        }

        return $status;
    }
}
