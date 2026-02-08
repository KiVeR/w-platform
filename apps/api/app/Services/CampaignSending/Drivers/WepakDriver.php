<?php

declare(strict_types=1);

namespace App\Services\CampaignSending\Drivers;

use App\Contracts\CampaignSenderInterface;
use App\DTOs\SendResult;
use App\Models\Campaign;

class WepakDriver implements CampaignSenderInterface
{
    /** @param array<string, mixed> $config */
    public function __construct(
        protected array $config = [],
    ) {}

    public function send(Campaign $campaign): SendResult
    {
        // Phase 1 : stub — simule un envoi réussi via API Wepak legacy.
        // Phase 2 : appel HTTP vers /smsenvoi.php avec les paramètres legacy.
        return new SendResult(
            success: true,
            externalId: 'wepak-'.$campaign->id,
        );
    }
}
