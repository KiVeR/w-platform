<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;

class InsufficientCreditsException extends RuntimeException
{
    public function __construct(
        public readonly float $required,
        public readonly float $available,
    ) {
        parent::__construct(
            "Crédits insuffisants. Requis : {$required}€, disponible : {$available}€"
        );
    }
}
