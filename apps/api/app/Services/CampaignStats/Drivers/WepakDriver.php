<?php

declare(strict_types=1);

namespace App\Services\CampaignStats\Drivers;

use App\Contracts\CampaignStatsProviderInterface;
use App\DTOs\CampaignStats;
use App\Enums\CampaignStatus;
use App\Models\Campaign;
use App\Services\CampaignSending\WepakClient;
use Illuminate\Support\Facades\Log;

class WepakDriver implements CampaignStatsProviderInterface
{
    public function __construct(
        protected WepakClient $client,
    ) {}

    public function getStats(Campaign $campaign): ?CampaignStats
    {
        if ($campaign->status !== CampaignStatus::SENT) {
            return null;
        }

        if (! $campaign->external_id) {
            return null;
        }

        try {
            $response = $this->client->getStats($campaign->external_id);

            if (! $response->success) {
                Log::warning('Wepak stats retrieval failed', [
                    'campaign_id' => $campaign->id,
                    'error' => $response->error,
                ]);

                return null;
            }

            return CampaignStats::fromWepakResponse($response->raw);
        } catch (\Throwable $e) {
            Log::warning('Wepak stats exception', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
