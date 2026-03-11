<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\AIContent;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AIContent */
class AIContentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var AIContent $content */
        $content = $this->resource;

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'partner_id' => $this->partner_id,
            'type' => $content->getRawOriginal('type'),
            'title' => $this->title,
            'status' => $content->getRawOriginal('status'),
            'is_favorite' => $this->is_favorite,
            'variable_schema_id' => $this->variable_schema_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'partner' => new PartnerResource($this->whenLoaded('partner')),
            'creator' => new UserResource($this->whenLoaded('creator')),
        ];
    }
}
