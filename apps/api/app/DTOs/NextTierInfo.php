<?php

declare(strict_types=1);

namespace App\DTOs;

readonly class NextTierInfo
{
    public function __construct(
        public int $volumeThreshold,
        public float $unitPrice,
        public float $savingsPercent,
    ) {}
}
