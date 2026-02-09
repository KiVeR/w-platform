<?php

declare(strict_types=1);

namespace App\Services\CampaignStats\Drivers;

use App\Contracts\CampaignStatsProviderInterface;
use App\DTOs\CampaignStats;
use App\Enums\CampaignStatus;
use App\Models\Campaign;

class StubDriver implements CampaignStatsProviderInterface
{
    public function getStats(Campaign $campaign): ?CampaignStats
    {
        if ($campaign->status !== CampaignStatus::SENT) {
            return null;
        }

        $volume = $campaign->volume_sent ?: ($campaign->volume_estimated ?? 1000);

        return new CampaignStats(
            sent: $volume,
            delivered: (int) ($volume * 0.95),
            undeliverable: 20,
            rejected: 10,
            expired: 5,
            stop: 15,
            clicks: 125,
            deliverabilityRate: 95.0,
            ctr: 13.16,
        );
    }
}
