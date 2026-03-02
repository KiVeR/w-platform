<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\CampaignChannel;
use App\Enums\CampaignRoutingStatus;
use App\Enums\CampaignStatus;
use App\Enums\CampaignType;
use App\Http\Controllers\Controller;
use App\Http\Resources\CampaignResource;
use App\Models\Campaign;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExternalCampaignController extends Controller
{
    public function store(Request $request): CampaignResource
    {
        $validated = $request->validate([
            'wp_campaign_id' => ['required', 'string', 'max:255'],
            'wp_routing_id' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'partner_id' => ['required', 'integer', Rule::exists('partners', 'id')],
            'router_id' => ['required', 'integer', Rule::exists('routers', 'id')],
            'routing_at' => ['required', 'date'],
            'source_name' => ['nullable', 'string', 'max:255'],
            'type' => ['required', Rule::enum(CampaignType::class)],
            'format' => ['nullable', 'string', 'max:100'],
            'message' => ['required', 'array'],
            'message.content' => ['required', 'string'],
            'message.short_url' => ['nullable', 'string'],
            'message.short_url_key' => ['nullable', 'string'],
            'recipients' => ['nullable', 'array'],
            'recipients.*' => ['string'],
            'query_data' => ['nullable', 'array'],
            'variable_schema_uuid' => ['nullable', 'string', 'uuid'],
        ]);

        $isQueryBased = ! empty($validated['query_data']) && empty($validated['recipients']);

        $campaign = Campaign::create([
            'partner_id' => $validated['partner_id'],
            'name' => $validated['name'],
            'type' => $validated['type'],
            'channel' => CampaignChannel::SMS,
            'status' => CampaignStatus::SCHEDULED,
            'router_id' => $validated['router_id'],
            'routing_at' => $validated['routing_at'],
            'wp_routing_id' => $validated['wp_routing_id'],
            'external_id' => $validated['wp_campaign_id'],
            'message' => $validated['message']['content'],
            'short_url' => $validated['message']['short_url'] ?? null,
            'routing_status' => $isQueryBased
                ? CampaignRoutingStatus::QueryPending
                : CampaignRoutingStatus::RoutingPending,
            'targeting' => $isQueryBased ? $validated['query_data'] : null,
        ]);

        return new CampaignResource($campaign);
    }
}
