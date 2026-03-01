<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\VariableSchema;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VariableSchema */
class VariableSchemaResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'partner_id' => $this->partner_id,
            'name' => $this->name,
            'global_data' => $this->global_data,
            'recipient_preview_data' => $this->recipient_preview_data,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'partner' => new PartnerResource($this->whenLoaded('partner')),
            'fields' => VariableFieldResource::collection($this->whenLoaded('variableFields')),
        ];
    }
}
