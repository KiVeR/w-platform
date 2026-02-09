<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\CampaignStatus;
use App\Jobs\ProcessCampaignSendingJob;
use App\Models\Campaign;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class SendScheduledCampaignsCommand extends Command
{
    /** @var string */
    protected $signature = 'app:send-scheduled-campaigns';

    /** @var string */
    protected $description = 'Dispatch sending jobs for scheduled campaigns within the allowed time window';

    public function handle(): int
    {
        if (! $this->isWithinSendingWindow()) {
            $this->info('Outside sending window (8h-20h Europe/Paris). Skipping.');

            return self::SUCCESS;
        }

        $campaigns = Campaign::query()
            ->where('status', CampaignStatus::SCHEDULED)
            ->where('scheduled_at', '<=', now())
            ->get();

        if ($campaigns->isEmpty()) {
            $this->info('No campaigns to send.');

            return self::SUCCESS;
        }

        $dispatched = 0;

        foreach ($campaigns as $campaign) {
            $campaign->update(['status' => CampaignStatus::SENDING]);
            ProcessCampaignSendingJob::dispatch($campaign);
            $dispatched++;
        }

        $this->info("Dispatched {$dispatched} campaign(s) for sending.");

        return self::SUCCESS;
    }

    protected function isWithinSendingWindow(): bool
    {
        /** @var string $timezone */
        $timezone = config('campaign-sending.sending.timezone', 'Europe/Paris');
        /** @var int $start */
        $start = config('campaign-sending.sending.window_start', 8);
        /** @var int $end */
        $end = config('campaign-sending.sending.window_end', 20);

        $now = Carbon::now($timezone);

        return $now->hour >= $start && $now->hour < $end;
    }
}
