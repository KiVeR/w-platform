<?php

declare(strict_types=1);

namespace App\Jobs\SmsRouting;

use App\Enums\CampaignRecipientStatus;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\CampaignRequestData;
use Illuminate\Bus\Batchable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class CampaignRecipientCreateManyJob implements ShouldQueue
{
    use Batchable, Queueable;

    public function __construct(
        public readonly int $campaignId,
        public readonly int $campaignRequestDataId,
    ) {}

    public function handle(): void
    {
        if ($this->batch()?->cancelled()) {
            return;
        }

        $campaign = Campaign::where('id', $this->campaignId)
            ->select(['id'])
            ->firstOrFail();

        $requestData = CampaignRequestData::findOrFail($this->campaignRequestDataId);

        /** @var list<array<string, mixed>> $items */
        $items = $requestData->data;

        $records = [];
        $now = now();

        foreach ($items as $item) {
            if (! isset($item['phone_number'])) {
                continue;
            }

            $records[] = [
                'campaign_id' => $campaign->id,
                'status' => CampaignRecipientStatus::Queued->value,
                'phone_number' => $item['phone_number'],
                'additional_information' => json_encode(
                    collect($item)->except('phone_number')->toArray()
                ),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if ($records !== []) {
            foreach (array_chunk($records, 500) as $chunk) {
                CampaignRecipient::insert($chunk);
            }
        }
    }
}
