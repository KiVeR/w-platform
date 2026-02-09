<?php

declare(strict_types=1);

namespace App\Contracts;

use App\DTOs\CampaignStats;
use App\Models\Campaign;

interface CampaignStatsProviderInterface
{
    public function getStats(Campaign $campaign): ?CampaignStats;
}
