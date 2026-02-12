<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Partner */
class PartnerResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'activity_type' => $this->activity_type,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'city' => $this->city,
            'zip_code' => $this->zip_code,
            'logo_url' => $this->logo_url,
            'euro_credits' => $this->euro_credits,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'users_count' => $this->whenCounted('users'),
            'shops_count' => $this->whenCounted('shops'),
            'users' => UserResource::collection($this->whenLoaded('users')),
            'shops' => ShopResource::collection($this->whenLoaded('shops')),
        ];
    }
}
