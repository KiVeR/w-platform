<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Region */
class RegionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'code' => $this->code,
            'name' => $this->name,
            'geometry' => $this->when(
                $request->query('include') === 'geometry' || $request->routeIs('geo.regions.show'),
                fn () => $this->geometry,
            ),
        ];
    }
}
