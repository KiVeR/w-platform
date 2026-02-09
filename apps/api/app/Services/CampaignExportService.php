<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\CampaignStatsProviderInterface;
use App\Enums\CampaignStatus;
use App\Models\Campaign;
use Illuminate\Support\Str;

class CampaignExportService
{
    public function __construct(
        protected CampaignStatsProviderInterface $statsProvider,
    ) {}

    public function generateCsv(Campaign $campaign): string
    {
        $lines = [];

        // Section 1: Détails
        $lines[] = ['Section', 'Field', 'Value'];
        $lines[] = ['Details', 'ID', (string) $campaign->id];
        $lines[] = ['Details', 'Name', $campaign->name ?? ''];
        $lines[] = ['Details', 'Type', $campaign->type->value];
        $lines[] = ['Details', 'Channel', $campaign->channel->value];
        $lines[] = ['Details', 'Status', $campaign->status->value];
        $lines[] = ['Details', 'Message', $campaign->message ?? ''];
        $lines[] = ['Details', 'Sender', $campaign->sender ?? ''];
        $lines[] = ['Details', 'Created At', $campaign->created_at?->toIso8601String() ?? ''];
        $lines[] = ['Details', 'Sent At', $campaign->sent_at?->toIso8601String() ?? ''];

        // Section 2: Pricing
        $lines[] = ['Pricing', 'Volume Estimated', (string) ($campaign->volume_estimated ?? 0)];
        $lines[] = ['Pricing', 'Volume Sent', (string) ($campaign->volume_sent ?? 0)];
        $lines[] = ['Pricing', 'Unit Price', (string) ($campaign->unit_price ?? 0)];
        $lines[] = ['Pricing', 'Total Price', (string) ($campaign->total_price ?? 0)];

        // Section 3: Targeting
        $targeting = $campaign->targeting;

        if (is_array($targeting)) {
            $lines[] = ['Targeting', 'Gender', $targeting['gender'] ?? 'mixte'];
            $lines[] = ['Targeting', 'Age Min', (string) ($targeting['age_min'] ?? '')];
            $lines[] = ['Targeting', 'Age Max', (string) ($targeting['age_max'] ?? '')];

            $postcodes = $targeting['geo']['postcodes'] ?? [];

            if (is_array($postcodes)) {
                /** @var array{code: string, volume?: int} $postcode */
                foreach ($postcodes as $postcode) {
                    $lines[] = ['Targeting', $postcode['code'], (string) ($postcode['volume'] ?? 0)];
                }
            }
        }

        // Section 4: Stats (conditional)
        if ($campaign->status === CampaignStatus::SENT && $campaign->sent_at) {
            $delayHours = (int) config('campaign-sending.notifications.stats_delay_hours', 72);

            if (now()->gte($campaign->sent_at->addHours($delayHours))) {
                $stats = $this->statsProvider->getStats($campaign);

                if ($stats) {
                    $lines[] = ['Stats', 'Sent', (string) $stats->sent];
                    $lines[] = ['Stats', 'Delivered', (string) $stats->delivered];
                    $lines[] = ['Stats', 'Undeliverable', (string) $stats->undeliverable];
                    $lines[] = ['Stats', 'Rejected', (string) $stats->rejected];
                    $lines[] = ['Stats', 'Expired', (string) $stats->expired];
                    $lines[] = ['Stats', 'Stop', (string) $stats->stop];
                    $lines[] = ['Stats', 'Clicks', (string) $stats->clicks];
                    $lines[] = ['Stats', 'Deliverability Rate', (string) $stats->deliverabilityRate];
                    $lines[] = ['Stats', 'CTR', (string) $stats->ctr];
                }
            }
        }

        $output = '';

        foreach ($lines as $line) {
            $output .= implode(';', array_map(fn (string $v): string => '"'.str_replace('"', '""', $v).'"', $line))."\n";
        }

        return $output;
    }

    public function getFilename(Campaign $campaign): string
    {
        $slug = Str::slug($campaign->name ?? 'campaign');
        $date = $campaign->created_at?->format('Y-m-d') ?? date('Y-m-d');

        return "campaign_{$campaign->id}_{$slug}_{$date}.csv";
    }
}
