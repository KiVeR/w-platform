<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\PartnerPricing */
class PartnerPricingResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'partner_id' => $this->partner_id,
            'name' => $this->name,
            'volume_min' => $this->volume_min,
            'volume_max' => $this->volume_max,
            'router_price' => $this->router_price,
            'data_price' => $this->data_price,
            'ci_price' => $this->ci_price,
            'is_active' => $this->is_active,
            'is_default' => $this->is_default,
            'created_at' => $this->created_at,
            'partner' => new PartnerResource($this->whenLoaded('partner')),
        ];
    }
}
