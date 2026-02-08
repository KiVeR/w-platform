<?php

declare(strict_types=1);

namespace App\Services\CampaignSending\Drivers;

use App\Contracts\CampaignSenderInterface;
use App\DTOs\SendResult;
use App\Models\Campaign;
use Illuminate\Support\Str;

class TriggerApiDriver implements CampaignSenderInterface
{
    /** @param array<string, mixed> $config */
    public function __construct(
        protected array $config = [],
    ) {}

    public function send(Campaign $campaign): SendResult
    {
        // Phase 1 : stub — génère un UUID et simule un envoi réussi.
        // Phase 2 : appel Http::triggerUrlApi()->post('/campaigns', [...])
        $uuid = Str::uuid()->toString();

        return new SendResult(
            success: true,
            externalId: $uuid,
        );
    }
}
