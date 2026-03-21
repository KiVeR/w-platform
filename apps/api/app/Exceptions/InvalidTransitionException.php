<?php

declare(strict_types=1);

namespace App\Exceptions;

use BackedEnum;
use RuntimeException;

class InvalidTransitionException extends RuntimeException
{
    public function __construct(
        public readonly string $track,
        public readonly BackedEnum $fromState,
        public readonly BackedEnum $toState,
        public readonly int $operationId,
    ) {
        parent::__construct(
            "Invalid transition on track '{$track}': "
            ."{$fromState->value} -> {$toState->value} "
            ."for operation #{$operationId}."
        );
    }
}
