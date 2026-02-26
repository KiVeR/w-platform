<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\CampaignStatus;
use App\Models\Campaign;
use App\Notifications\AbandonedDraftNotification;
use Illuminate\Console\Command;

class NotifyAbandonedDraftsCommand extends Command
{
    /** @var string */
    protected $signature = 'app:notify-abandoned-drafts';

    /** @var string */
    protected $description = 'Notify creators of draft campaigns abandoned for more than 48 hours';

    public function handle(): int
    {
        $campaigns = Campaign::query()
            ->where('status', CampaignStatus::DRAFT)
            ->where('updated_at', '<', now()->subHours(48))
            ->whereNotNull('name')
            ->where('name', '!=', '')
            ->whereNull('draft_notified_at')
            ->with('creator')
            ->get();

        if ($campaigns->isEmpty()) {
            $this->info('No abandoned drafts to notify.');

            return self::SUCCESS;
        }

        $notified = 0;

        foreach ($campaigns as $campaign) {
            if ($campaign->creator) {
                $campaign->creator->notify(new AbandonedDraftNotification($campaign));
                $notified++;
            }

            $campaign->update(['draft_notified_at' => now()]);
        }

        $this->info("Notified {$notified} abandoned draft(s).");

        return self::SUCCESS;
    }
}
