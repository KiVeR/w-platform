<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\VariableSchema;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VariableSchema */
class InternalVariableSchemaResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'uuid' => $this->uuid,
            'name' => $this->name,
            'global_variables' => VariableFieldResource::collection($this->global_variables),
            'recipient_variables' => VariableFieldResource::collection($this->recipient_variables),
            'global_data' => $this->global_data_sets,
            'recipient_preview_data' => $this->recipient_preview_data ?? (object) [],
            'recipient_preview_data_sets' => $this->recipient_preview_data_sets,
            'merged_preview_data' => $this->merged_preview_data ?: (object) [],
            'usage_stats' => [
                'total' => $this->variableFields->count(),
                'used' => $this->used_variables->count(),
                'unused' => $this->unused_variables->count(),
                'global' => $this->global_variables->count(),
                'recipient' => $this->recipient_variables->count(),
            ],
            'campaigns_count' => $this->whenCounted('campaigns'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
