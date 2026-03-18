<?php

declare(strict_types=1);

namespace App\Services\CampaignStats\Drivers;

use App\Contracts\CampaignStatsProviderInterface;
use App\DTOs\CampaignStats;
use App\Enums\CampaignRecipientStatus;
use App\Enums\CampaignStatus;
use App\Models\Campaign;

class LocalCampaignStatsDriver implements CampaignStatsProviderInterface
{
    public function getStats(Campaign $campaign): ?CampaignStats
    {
        if ($campaign->status !== CampaignStatus::SENT) {
            return null;
        }

        $baseQuery = $campaign->campaignRecipients()
            ->where('status', '!=', CampaignRecipientStatus::Queued->value);

        $sent = (clone $baseQuery)->count();
        $delivered = (clone $baseQuery)
            ->where('status', CampaignRecipientStatus::Delivered->value)
            ->count();
        $clicks = (clone $baseQuery)
            ->where('short_url_click', '>', 0)
            ->count();

        return CampaignStats::fromLocalPerformance(
            sent: $sent,
            delivered: $delivered,
            clicks: $clicks,
        );
    }
}
