<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\CampaignStatus;
use App\Models\Campaign;
use App\Notifications\CampaignStatsAvailableNotification;
use Illuminate\Console\Command;

class NotifyCampaignStatsCommand extends Command
{
    /** @var string */
    protected $signature = 'app:notify-campaign-stats';

    /** @var string */
    protected $description = 'Notify campaign creators when stats become available (72h after sending)';

    public function handle(): int
    {
        /** @var int $delayHours */
        $delayHours = config('campaign-sending.notifications.stats_delay_hours', 72);

        $campaigns = Campaign::query()
            ->where('status', CampaignStatus::SENT)
            ->where('stats_notified', false)
            ->whereNotNull('sent_at')
            ->where('sent_at', '<=', now()->subHours($delayHours))
            ->with('creator')
            ->get();

        if ($campaigns->isEmpty()) {
            $this->info('No campaigns pending stats notification.');

            return self::SUCCESS;
        }

        $notified = 0;

        foreach ($campaigns as $campaign) {
            $creator = $campaign->creator;

            if ($creator) {
                $creator->notify(new CampaignStatsAvailableNotification($campaign));
                $notified++;
            }

            $campaign->update(['stats_notified' => true]);
        }

        $this->info("Notified {$notified} campaign(s) stats available.");

        return self::SUCCESS;
    }
}
