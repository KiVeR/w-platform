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

    /** @param array<string, mixed> $targeting */
    public function estimateVolumeFromTargeting(array $targeting): int
    {
        /** @var list<array{volume?: int}> $zones */
        $zones = $targeting['zones'] ?? [];

        return (int) collect($zones)->sum('volume');
    }
}
