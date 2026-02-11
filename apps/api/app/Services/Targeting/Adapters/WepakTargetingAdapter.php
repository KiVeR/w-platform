<?php

declare(strict_types=1);

namespace App\Services\Targeting\Adapters;

use App\Contracts\TargetingAdapterInterface;
use App\DTOs\Targeting\CanonicalTargeting;
use App\DTOs\Targeting\ResolvedZone;

class WepakTargetingAdapter implements TargetingAdapterInterface
{
    /** @return array<string, mixed> */
    public function transform(CanonicalTargeting $targeting): array
    {
        return [
            'gender' => $targeting->demographics?->gender,
            'age_min' => $targeting->demographics?->ageMin,
            'age_max' => $targeting->demographics?->ageMax,
            'geo' => [
                'postcodes' => array_map(
                    fn (ResolvedZone $zone) => [
                        'code' => $zone->code,
                        'volume' => $zone->volume,
                        'type' => $this->mapZoneType($zone->type),
                    ],
                    $targeting->zones,
                ),
            ],
        ];
    }

    private function mapZoneType(string $type): string
    {
        return match ($type) {
            'department' => 'dept',
            'postcode' => 'cp',
            'iris' => 'iris',
            default => 'cp',
        };
    }
}
