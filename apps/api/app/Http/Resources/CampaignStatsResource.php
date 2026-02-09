<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\DTOs\CampaignStats;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin CampaignStats */
class CampaignStatsResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var CampaignStats $stats */
        $stats = $this->resource;

        return [
            'sent' => $stats->sent,
            'delivered' => $stats->delivered,
            'undeliverable' => $stats->undeliverable,
            'rejected' => $stats->rejected,
            'expired' => $stats->expired,
            'stop' => $stats->stop,
            'clicks' => $stats->clicks,
            'deliverability_rate' => $stats->deliverabilityRate,
            'ctr' => $stats->ctr,
        ];
    }
}
