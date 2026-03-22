<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Operation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Operation */
class OperationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var Operation $operation */
        $operation = $this->resource;

        return [
            'id' => $this->id,
            'demande_id' => $this->demande_id,
            'ref_operation' => $this->ref_operation,
            'line_number' => $this->line_number,
            'type' => $operation->type?->value,
            'name' => $this->name,
            'advertiser' => $this->advertiser,
            'priority' => $operation->priority?->value,
            'lifecycle_status' => $operation->lifecycle_status?->value,
            'creative_status' => $operation->creative_status?->value,
            'billing_status' => $operation->billing_status?->value,
            'routing_status' => $operation->routing_status?->value,
            'hold_reason' => $operation->hold_reason?->value,
            'preparation_step' => $operation->preparation_step?->value,
            'processing_status' => $operation->processing_status?->value,
            'cancellation_type' => $operation->cancellation_type?->value,
            'targeting' => $this->targeting,
            'volume_estimated' => $this->volume_estimated,
            'volume_sent' => $this->volume_sent,
            'unit_price' => $this->unit_price,
            'total_price' => $this->total_price,
            'message' => $this->message,
            'sender' => $this->sender,
            'assigned_to' => $this->assigned_to,
            'external_ref' => $this->external_ref,
            'scheduled_at' => $this->scheduled_at,
            'delivered_at' => $this->delivered_at,
            'parent_operation_id' => $this->parent_operation_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'demande' => new DemandeResource($this->whenLoaded('demande')),
            'campaign' => new CampaignResource($this->whenLoaded('campaign')),
            'assigned_user' => new UserResource($this->whenLoaded('assignedUser')),
            'parent_operation' => new OperationResource($this->whenLoaded('parentOperation')),
            'child_operations' => OperationResource::collection($this->whenLoaded('childOperations')),
        ];
    }
}
