<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\CampaignRecipient;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin CampaignRecipient */
class CampaignRecipientResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'campaign_id' => $this->campaign_id,
            'status' => $this->status->value,
            'phone_number' => $this->phone_number,
            'message_preview' => $this->message_preview,
            'message_preview_length' => $this->message_preview_length,
            'short_url_suffix' => $this->short_url_suffix,
            'short_url_slug' => $this->short_url_slug,
            'short_url_click' => $this->short_url_click,
            'additional_information' => $this->getMergedAdditionalInformation(),
            'stop_requested_at' => $this->stop_requested_at?->toIso8601String(),
            'delivered_at' => $this->delivered_at?->toIso8601String(),
        ];
    }
}
