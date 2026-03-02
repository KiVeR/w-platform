<?php

declare(strict_types=1);

namespace App\Jobs\SmsRouting;

use App\DTOs\SmsMessage;
use App\DTOs\SmsRecipient;
use App\Enums\CampaignRecipientStatus;
use App\Enums\CampaignRoutingStatus;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Services\SmsRouting\SmsRoutingManager;
use Illuminate\Bus\Batchable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RoutingLogicSendJob implements ShouldBeUnique, ShouldQueue
{
    use Batchable, Queueable;

    /**
     * @param  list<int>  $recipientIds
     */
    public function __construct(
        public readonly int $campaignId,
        public readonly array $recipientIds,
        public readonly string $batchUuid,
    ) {
        $this->onQueue('high');
    }

    public function uniqueId(): string
    {
        return $this->batchUuid;
    }

    public function handle(SmsRoutingManager $routingManager): void
    {
        if ($this->batch()?->cancelled()) {
            return;
        }

        $campaign = Campaign::where('id', $this->campaignId)
            ->select(['id', 'router_id', 'routing_status', 'wp_routing_id', 'message', 'sender'])
            ->with(['router:id,name'])
            ->firstOrFail();

        if ($campaign->routing_status !== CampaignRoutingStatus::RoutingInProgress) {
            return;
        }

        $recipients = CampaignRecipient::whereIn('id', $this->recipientIds)
            ->where('campaign_id', $this->campaignId)
            ->where('status', CampaignRecipientStatus::Queued)
            ->get();

        if ($recipients->isEmpty()) {
            return;
        }

        $smsRecipients = $recipients->map(fn (CampaignRecipient $r) => new SmsRecipient(
            phoneNumber: $r->phone_number,
            messagePreview: $r->message_preview,
        ));

        /** @var \App\Models\Router $router */
        $router = $campaign->router;
        $driver = $routingManager->driver($router->name);

        $driver
            ->batchUuid($this->batchUuid)
            ->to($smsRecipients)
            ->from($campaign->sender ?? 'Wellpack')
            ->message(new SmsMessage(content: $campaign->message ?? ''))
            ->send();

        CampaignRecipient::whereIn('id', $recipients->pluck('id'))
            ->update([
                'status' => CampaignRecipientStatus::Dispatched,
                'routing_batch_uuid' => $this->batchUuid,
            ]);
    }
}
