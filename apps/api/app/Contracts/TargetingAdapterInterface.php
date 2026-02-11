<?php

declare(strict_types=1);

namespace App\Contracts;

use App\DTOs\Targeting\CanonicalTargeting;

interface TargetingAdapterInterface
{
    /**
     * Transform canonical targeting to provider-specific format.
     *
     * @return array<string, mixed>
     */
    public function transform(CanonicalTargeting $targeting): array;
}
