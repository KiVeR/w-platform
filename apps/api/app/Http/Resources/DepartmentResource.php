<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Department */
class DepartmentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'code' => $this->code,
            'name' => $this->name,
            'region_code' => $this->region_code,
            'geometry' => $this->when(
                $request->query('include') === 'geometry' || $request->routeIs('geo.departments.show'),
                fn () => $this->geometry,
            ),
        ];
    }
}
