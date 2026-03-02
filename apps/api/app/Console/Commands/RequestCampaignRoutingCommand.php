<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\CampaignRoutingStatus;
use App\Jobs\SmsRouting\RoutingLogicStartJob;
use App\Models\Campaign;
use Illuminate\Console\Command;

class RequestCampaignRoutingCommand extends Command
{
    protected $signature = 'app:request-campaign-routing';

    protected $description = 'Dispatch routing jobs for campaigns with ROUTING_PENDING status';

    public function handle(): void
    {
        $campaigns = Campaign::query()
            ->where('routing_status', CampaignRoutingStatus::RoutingPending)
            ->where('routing_at', '<=', now())
            ->whereHas('campaignRecipients')
            ->orderBy('routing_at')
            ->get(['id']);

        $this->info("Dispatching routing for {$campaigns->count()} campaign(s).");

        $campaigns->each(fn (Campaign $campaign) => RoutingLogicStartJob::dispatch($campaign->id));
    }
}
