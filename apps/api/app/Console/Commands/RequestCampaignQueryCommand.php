<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\CampaignRoutingStatus;
use App\Jobs\SmsRouting\QueryLogicMakeJob;
use App\Models\Campaign;
use Illuminate\Console\Command;

class RequestCampaignQueryCommand extends Command
{
    protected $signature = 'app:request-campaign-query';

    protected $description = 'Dispatch query jobs for campaigns with QUERY_PENDING status';

    public function handle(): void
    {
        $campaigns = Campaign::query()
            ->where('routing_status', CampaignRoutingStatus::QueryPending)
            ->where('routing_at', '<=', now())
            ->whereDoesntHave('campaignRecipients')
            ->orderBy('routing_at')
            ->get(['id']);

        $this->info("Dispatching query for {$campaigns->count()} campaign(s).");

        $campaigns->each(fn (Campaign $campaign) => QueryLogicMakeJob::dispatch($campaign->id));
    }
}
