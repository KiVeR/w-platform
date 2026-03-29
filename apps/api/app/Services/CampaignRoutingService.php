<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CampaignRoutingStatus;
use App\Exceptions\InvalidRoutingStateException;
use App\Jobs\SmsRouting\RoutingLogicStartJob;
use App\Models\Campaign;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;

class CampaignRoutingService
{
    public function start(Campaign $campaign): void
    {
        DB::transaction(function () use ($campaign) {
            $campaign = Campaign::lockForUpdate()->findOrFail($campaign->id);

            if ($campaign->routing_status === null || ! $campaign->routing_status->canStart()) {
                throw new InvalidRoutingStateException($campaign->routing_status, 'start');
            }

            $campaign->update(['routing_status' => CampaignRoutingStatus::RoutingPending]);

            RoutingLogicStartJob::dispatch($campaign->id);
        });
    }

    public function pause(Campaign $campaign): void
    {
        DB::transaction(function () use ($campaign) {
            $campaign = Campaign::lockForUpdate()->findOrFail($campaign->id);

            if ($campaign->routing_status === null || ! $campaign->routing_status->canPause()) {
                throw new InvalidRoutingStateException($campaign->routing_status, 'pause');
            }

            if ($campaign->routing_batch_id) {
                Bus::findBatch($campaign->routing_batch_id)?->cancel();
            }

            $campaign->update(['routing_status' => CampaignRoutingStatus::RoutingPaused]);
        });
    }

    public function cancel(Campaign $campaign): void
    {
        DB::transaction(function () use ($campaign) {
            $campaign = Campaign::lockForUpdate()->findOrFail($campaign->id);

            if ($campaign->routing_status === null || ! $campaign->routing_status->canCancel()) {
                throw new InvalidRoutingStateException($campaign->routing_status, 'cancel');
            }

            if ($campaign->routing_batch_id) {
                Bus::findBatch($campaign->routing_batch_id)?->cancel();
            }

            $campaign->update(['routing_status' => CampaignRoutingStatus::RoutingCanceled]);
        });
    }
}
