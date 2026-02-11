<?php

declare(strict_types=1);

namespace App\Contracts;

use App\DTOs\SendResult;
use App\Models\Campaign;

interface CampaignSenderInterface
{
    public function send(Campaign $campaign): SendResult;

    public function estimateVolume(Campaign $campaign): int;

    /** @param array<string, mixed> $targeting */
    public function estimateVolumeFromTargeting(array $targeting): int;
}
