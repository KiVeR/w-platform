<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\InterestGroup */
class InterestGroupResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'children' => InterestGroupResource::collection($this->whenLoaded('children')),
            'interests' => InterestResource::collection($this->whenLoaded('interests')),
        ];
    }
}
