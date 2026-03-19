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
        $globalVariables = $this->variableFields->where('is_global', true)->values();
        $recipientVariables = $this->variableFields->where('is_global', false)->values();
        $usedVariables = $this->variableFields->where('is_used', true)->values();
        $unusedVariables = $this->variableFields->where('is_used', false)->values();

        return [
            'id' => $this->uuid,
            'uuid' => $this->uuid,
            'name' => $this->name,
            'global_variables' => VariableFieldResource::collection($globalVariables),
            'recipient_variables' => VariableFieldResource::collection($recipientVariables),
            'global_data' => $this->global_data_sets,
            'recipient_preview_data' => $this->recipient_preview_data ?? (object) [],
            'recipient_preview_data_sets' => $this->recipient_preview_data_sets,
            'merged_preview_data' => $this->merged_preview_data ?: (object) [],
            'usage_stats' => [
                'total' => $this->variableFields->count(),
                'used' => $usedVariables->count(),
                'unused' => $unusedVariables->count(),
                'global' => $globalVariables->count(),
                'recipient' => $recipientVariables->count(),
            ],
            'campaigns_count' => $this->whenCounted('campaigns'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
