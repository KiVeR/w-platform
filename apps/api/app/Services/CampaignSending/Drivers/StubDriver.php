<?php

declare(strict_types=1);

namespace App\Services\CampaignSending\Drivers;

use App\Contracts\CampaignSenderInterface;
use App\DTOs\SendResult;
use App\Models\Campaign;

class StubDriver implements CampaignSenderInterface
{
    public function send(Campaign $campaign): SendResult
    {
        return new SendResult(
            success: true,
            externalId: 'stub-'.$campaign->id,
        );
    }

    public function estimateVolume(Campaign $campaign): int
    {
        return $campaign->getTargetingVolume();
    }
}
