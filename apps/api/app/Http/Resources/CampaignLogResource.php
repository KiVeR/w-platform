<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\CampaignLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin CampaignLog */
class CampaignLogResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'campaign_id' => $this->campaign_id,
            'data' => $this->data,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
