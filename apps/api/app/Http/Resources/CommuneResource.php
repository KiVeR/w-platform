<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommuneResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var array<string, mixed> $data */
        $data = $this->resource;

        return [
            'code' => $data['code'] ?? null,
            'name' => $data['nom'] ?? null,
            'postal_codes' => $data['codesPostaux'] ?? [],
            'population' => $data['population'] ?? null,
            'department' => isset($data['departement']) ? [
                'code' => $data['departement']['code'] ?? null,
                'name' => $data['departement']['nom'] ?? null,
            ] : null,
            'region' => isset($data['region']) ? [
                'code' => $data['region']['code'] ?? null,
                'name' => $data['region']['nom'] ?? null,
            ] : null,
            'contour' => $data['contour'] ?? null,
        ];
    }
}
