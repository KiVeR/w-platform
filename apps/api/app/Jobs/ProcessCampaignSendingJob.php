<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Contracts\CampaignSenderInterface;
use App\Enums\CampaignStatus;
use App\Models\Campaign;
use App\Notifications\CampaignFailedNotification;
use App\Notifications\CampaignSentNotification;
use App\Services\CreditService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class ProcessCampaignSendingJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 3660;

    public function __construct(
        public Campaign $campaign,
    ) {
        $this->queue = 'campaigns';
    }

    public function handle(CampaignSenderInterface $sender): void
    {
        Log::info('Processing campaign sending', ['campaign_id' => $this->campaign->id]);

        $result = $sender->send($this->campaign);

        if ($result->success) {
            $this->campaign->update([
                'status' => CampaignStatus::SENT,
                'external_id' => $result->externalId,
                'sent_at' => now(),
            ]);

            Log::info('Campaign sent successfully', [
                'campaign_id' => $this->campaign->id,
                'external_id' => $result->externalId,
            ]);

            $this->notifySent();
        } else {
            $this->campaign->update([
                'status' => CampaignStatus::FAILED,
                'error_message' => $result->error,
            ]);

            if (! $this->campaign->is_demo && $this->campaign->total_price > 0 && $this->campaign->partner) {
                app(CreditService::class)->refund(
                    $this->campaign->partner,
                    (float) $this->campaign->total_price,
                );
            }

            Log::error('Campaign sending failed', [
                'campaign_id' => $this->campaign->id,
                'error' => $result->error,
            ]);

            $this->notifyFailed();
        }
    }

    protected function notifySent(): void
    {
        $creator = $this->campaign->creator;

        if ($creator) {
            $creator->notify(new CampaignSentNotification($this->campaign));
        }
    }

    protected function notifyFailed(): void
    {
        /** @var string $emailsConfig */
        $emailsConfig = config('campaign-sending.notifications.failure_emails', '');
        $emails = array_filter(array_map('trim', explode(',', $emailsConfig)));

        if ($emails !== []) {
            Notification::route('mail', $emails)
                ->notify(new CampaignFailedNotification($this->campaign));
        }
    }
}
