<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\LandingPage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin LandingPage */
class LandingPageResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var LandingPage $landingPage */
        $landingPage = $this->resource;

        return [
            'id' => $this->id,
            'partner_id' => $this->partner_id,
            'user_id' => $this->user_id,
            'name' => $this->name,
            'title' => $this->title,
            'status' => $landingPage->status->value,
            'is_active' => $this->is_active,
            'og_title' => $this->og_title,
            'og_description' => $this->og_description,
            'og_image_url' => $this->og_image_url,
            'favicon_url' => $this->favicon_url,
            'short_url_api_id' => $this->short_url_api_id,
            'variable_schema_id' => $this->variable_schema_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'partner' => new PartnerResource($this->whenLoaded('partner')),
            'creator' => new UserResource($this->whenLoaded('creator')),
        ];
    }
}
