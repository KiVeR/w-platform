<?php

declare(strict_types=1);

namespace App\Jobs\SmsRouting;

use App\Enums\CampaignRecipientStatus;
use App\Enums\CampaignRoutingStatus;
use App\Models\Campaign;
use Illuminate\Bus\Batch;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Str;
use Throwable;

class RoutingLogicStartJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $campaignId,
    ) {
        $this->onQueue('high');
    }

    public function uniqueId(): int
    {
        return $this->campaignId;
    }

    /**
     * @throws Throwable
     */
    public function handle(): void
    {
        $campaign = Campaign::where('id', $this->campaignId)
            ->select(['id', 'routing_status', 'routing_batch_id', 'router_id'])
            ->with(['router:id,name'])
            ->withCount('campaignRecipients')
            ->firstOrFail();

        if ($campaign->routing_status !== CampaignRoutingStatus::RoutingPending) {
            return;
        }

        if ($campaign->campaign_recipients_count === 0) {
            return;
        }

        $chunkSize = (int) config('sms-routing.router_chunk_size', 1000);

        $recipientIds = $campaign->campaignRecipients()
            ->where('status', CampaignRecipientStatus::Queued)
            ->pluck('id');

        $batchUuid = Str::uuid()->toString();
        $jobs = [];

        foreach ($recipientIds->chunk($chunkSize) as $chunk) {
            /** @var list<int> $chunkIds */
            $chunkIds = $chunk->values()->all();
            $jobs[] = new RoutingLogicSendJob(
                campaignId: $this->campaignId,
                recipientIds: $chunkIds,
                batchUuid: $batchUuid,
            );
        }

        if ($jobs === []) {
            return;
        }

        $campaign->update([
            'routing_status' => CampaignRoutingStatus::RoutingInProgress,
            'routing_batch_id' => $batchUuid,
        ]);

        Bus::batch($jobs)
            ->name("routing-campaign-{$this->campaignId}")
            ->onQueue('high')
            ->then(function (Batch $batch) use ($campaign): void {
                $campaign->update([
                    'routing_status' => CampaignRoutingStatus::RoutingCompleted,
                    'routing_executed_at' => now(),
                ]);
            })
            ->catch(function (Batch $batch, Throwable $e) use ($campaign): void {
                $campaign->update([
                    'routing_status' => CampaignRoutingStatus::RoutingFailed,
                ]);
            })
            ->dispatch();
    }
}
