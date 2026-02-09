<?php

declare(strict_types=1);

namespace App\Services\CampaignStats\Drivers;

use App\Contracts\CampaignStatsProviderInterface;
use App\DTOs\CampaignStats;
use App\Enums\CampaignStatus;
use App\Models\Campaign;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TriggerApiDriver implements CampaignStatsProviderInterface
{
    public function __construct(
        protected string $baseUrl,
        protected string $apiKey,
    ) {}

    public function getStats(Campaign $campaign): ?CampaignStats
    {
        if ($campaign->status !== CampaignStatus::SENT) {
            return null;
        }

        if (! $campaign->trigger_campaign_uuid) {
            return null;
        }

        try {
            $url = rtrim($this->baseUrl, '/')."/api/campaigns/{$campaign->trigger_campaign_uuid}/stats";

            $response = Http::timeout(10)
                ->withToken($this->apiKey)
                ->get($url, ['type' => 'performance']);

            if ($response->failed()) {
                Log::error('TriggerApi stats HTTP error', [
                    'campaign_id' => $campaign->id,
                    'status' => $response->status(),
                ]);

                return null;
            }

            /** @var array<string, mixed> $data */
            $data = $response->json() ?? [];

            return CampaignStats::fromTriggerApiResponse($data);
        } catch (\Throwable $e) {
            Log::error('TriggerApi stats exception', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
