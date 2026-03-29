<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Campaign;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Campaign */
class CampaignResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var Campaign $campaign */
        $campaign = $this->resource;

        return [
            'id' => $this->id,
            'partner_id' => $this->partner_id,
            'user_id' => $this->user_id,
            'type' => $campaign->type->value,
            'channel' => $campaign->channel->value,
            'status' => $campaign->status->value,
            'routing_status' => $campaign->routing_status?->value,
            'is_demo' => $this->is_demo,
            'name' => $this->name,
            'targeting' => $this->targeting,
            'volume_estimated' => $this->volume_estimated,
            'volume_sent' => $this->volume_sent,
            'message' => $this->message,
            'sender' => $this->sender,
            'additional_phone' => $this->additional_phone,
            'sms_count' => $this->sms_count,
            'short_url' => $this->short_url,
            'scheduled_at' => $this->scheduled_at,
            'sent_at' => $this->sent_at,
            'unit_price' => $this->unit_price,
            'total_price' => $this->total_price,
            'landing_page_id' => $this->landing_page_id,
            'variable_schema_id' => $this->variable_schema_id,
            'router_id' => $this->router_id,
            'routing_at' => $this->routing_at,
            'routing_executed_at' => $this->routing_executed_at,
            'recipients_count' => $this->whenCounted('campaignRecipients'),
            'created_at' => $this->created_at,
            'partner' => new PartnerResource($this->whenLoaded('partner')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'router' => new RouterResource($this->whenLoaded('router')),
            'landing_page' => new LandingPageResource($this->whenLoaded('landingPage')),
            'interest_groups' => InterestGroupResource::collection($this->whenLoaded('interestGroups')),
        ];
    }
}
