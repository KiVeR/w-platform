<?php

declare(strict_types=1);

namespace App\Observers;

use App\Events\CampaignCreated;
use App\Events\CampaignRefresh;
use App\Events\CampaignUpdated;
use App\Models\Campaign;

class CampaignObserver
{
    public function created(Campaign $campaign): void
    {
        CampaignCreated::dispatch($campaign->id);
    }

    public function updated(Campaign $campaign): void
    {
        CampaignUpdated::dispatch($campaign->id);
    }

    public function deleted(Campaign $campaign): void
    {
        CampaignRefresh::dispatch();
    }
}
