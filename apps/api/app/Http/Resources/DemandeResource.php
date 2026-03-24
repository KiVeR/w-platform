<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Demande;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Demande */
class DemandeResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ref_demande' => $this->ref_demande,
            'ref_client' => $this->ref_client,
            'information' => $this->information,
            'is_exoneration' => $this->is_exoneration,
            'pays_id' => $this->pays_id,
            'partner_id' => $this->partner_id,
            'commercial_id' => $this->commercial_id,
            'sdr_id' => $this->sdr_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'partner' => new PartnerResource($this->whenLoaded('partner')),
            'commercial' => new UserResource($this->whenLoaded('commercial')),
            'sdr' => new UserResource($this->whenLoaded('sdr')),
            'operations' => OperationResource::collection($this->whenLoaded('operations')),
            'operations_count' => $this->operations_count ?? 0,
            'operations_completed_count' => $this->operations_completed_count ?? 0,
            'operations_blocked_count' => $this->operations_blocked_count ?? 0,
        ];
    }
}
