<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\CampaignStatus;
use App\Jobs\ProcessCampaignSendingJob;
use App\Models\Campaign;
use Carbon\Carbon;
use Illuminate\Console\Command;

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

        foreach ($campaigns as $campaign) {
            $campaign->update(['status' => CampaignStatus::SENDING]);
            ProcessCampaignSendingJob::dispatch($campaign);
        }

        $this->info("Dispatched {$campaigns->count()} campaign(s) for sending.");

        return self::SUCCESS;
    }

    protected function isWithinSendingWindow(): bool
    {
        $timezone = (string) config('campaign-sending.sending.timezone', 'Europe/Paris');
        $start = (int) config('campaign-sending.sending.window_start', 8);
        $end = (int) config('campaign-sending.sending.window_end', 20);

        $hour = Carbon::now($timezone)->hour;

        return $hour >= $start && $hour < $end;
    }
}
