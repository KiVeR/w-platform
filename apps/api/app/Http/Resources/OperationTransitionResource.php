<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\OperationTransition;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin OperationTransition */
class OperationTransitionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'operation_id' => $this->operation_id,
            'track' => $this->track,
            'from_state' => $this->from_state,
            'to_state' => $this->to_state,
            'user_id' => $this->user_id,
            'reason' => $this->reason,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at,
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
