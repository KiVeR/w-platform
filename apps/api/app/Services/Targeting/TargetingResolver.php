<?php

declare(strict_types=1);

namespace App\Services\Targeting;

use App\DTOs\Targeting\CanonicalTargeting;
use App\DTOs\Targeting\Demographics;
use App\DTOs\Targeting\ResolvedZone;
use App\DTOs\Targeting\TargetingInput;
use App\DTOs\Targeting\TargetingOrigin;
use App\Models\Department;
use App\Models\IrisZone;

class TargetingResolver
{
    /**
     * Transform UI input into canonical targeting with resolved zones.
     */
    public function resolve(TargetingInput $input): CanonicalTargeting
    {
        [$zones, $origin] = match ($input->method) {
            'department' => [$this->resolveDepartments($input->departments), null],
            'postcode' => [$this->resolvePostcodes($input->postcodes), null],
            'address' => $this->resolveAddress($input->address, $input->lat, $input->lng, $input->radius),
            default => throw new \InvalidArgumentException("Unknown targeting method: {$input->method}"),
        };

        $demographics = ($input->gender !== null || $input->ageMin !== null || $input->ageMax !== null)
            ? new Demographics(gender: $input->gender, ageMin: $input->ageMin, ageMax: $input->ageMax)
            : null;

        return new CanonicalTargeting(
            method: $input->method,
            input: $input,
            zones: $zones,
            origin: $origin,
            demographics: $demographics,
        );
    }

    /**
     * Re-resolve zones from stored targeting.input (after geo:seed).
     *
     * @param  array<string, mixed>  $storedTargeting
     */
    public function refreshFromInput(array $storedTargeting): ?CanonicalTargeting
    {
        if (! isset($storedTargeting['input']) || ! isset($storedTargeting['method'])) {
            return null;
        }

        $inputData = $storedTargeting['input'];
        $inputData['method'] = $storedTargeting['method'];

        $input = TargetingInput::fromArray($inputData);

        return $this->resolve($input);
    }

    /**
     * @param  string[]  $codes
     * @return ResolvedZone[]
     */
    private function resolveDepartments(array $codes): array
    {
        if ($codes === []) {
            return [];
        }

        return Department::whereIn('code', $codes)
            ->orderBy('code')
            ->get(['code', 'name'])
            ->map(fn (Department $dept) => new ResolvedZone(
                code: $dept->code,
                type: 'department',
                label: $dept->name,
                volume: 0,
            ))
            ->values()
            ->all();
    }

    /**
     * @param  string[]  $postcodes
     * @return ResolvedZone[]
     */
    private function resolvePostcodes(array $postcodes): array
    {
        return array_map(
            fn (string $code) => new ResolvedZone(
                code: $code,
                type: 'postcode',
                label: $code,
                volume: 0,
            ),
            $postcodes,
        );
    }

    /**
     * @return array{ResolvedZone[], TargetingOrigin|null}
     */
    private function resolveAddress(?string $address, ?float $lat, ?float $lng, ?int $radius): array
    {
        if ($lat === null || $lng === null || $radius === null) {
            return [[], null];
        }

        $zones = IrisZone::query()
            ->select(['code', 'name', 'commune_name'])
            ->whereRaw(
                'ST_DWithin(geometry::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)',
                [$lng, $lat, $radius],
            )
            ->get()
            ->map(fn (IrisZone $iris) => new ResolvedZone(
                code: $iris->code,
                type: 'iris',
                label: "{$iris->commune_name} - {$iris->name}",
                volume: 0,
            ))
            ->values()
            ->all();

        $origin = new TargetingOrigin(
            address: $address ?? '',
            lat: $lat,
            lng: $lng,
            radius: $radius,
        );

        return [$zones, $origin];
    }
}
