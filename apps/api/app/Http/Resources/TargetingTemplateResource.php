<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\TargetingTemplate */
class TargetingTemplateResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'partner_id' => $this->partner_id,
            'name' => $this->name,
            'targeting_json' => $this->targeting_json,
            'usage_count' => $this->usage_count,
            'last_used_at' => $this->last_used_at,
            'is_preset' => $this->is_preset,
            'category' => $this->category,
            'created_at' => $this->created_at,
            'partner' => new PartnerResource($this->whenLoaded('partner')),
        ];
    }
}
