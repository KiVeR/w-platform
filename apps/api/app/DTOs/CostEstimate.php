<?php

declare(strict_types=1);

namespace App\DTOs;

readonly class CostEstimate
{
    public function __construct(
        public float $unitPrice,
        public float $totalPrice,
        public int $pricingId,
    ) {}
}
