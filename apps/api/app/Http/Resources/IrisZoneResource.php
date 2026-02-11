<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\IrisZone */
class IrisZoneResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'code' => $this->code,
            'name' => $this->name,
            'department_code' => $this->department_code,
            'commune_code' => $this->commune_code,
            'commune_name' => $this->commune_name,
            'iris_type' => $this->iris_type,
            'geometry' => $this->when(
                $request->routeIs('geo.iris-zones.show', 'geo.iris-zones.batch'),
                fn () => $this->geometry,
            ),
        ];
    }
}
