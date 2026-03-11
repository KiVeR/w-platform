<?php

declare(strict_types=1);

namespace App\Jobs\SmsRouting;

use App\Contracts\ReportsPullDriverInterface;
use App\Enums\CampaignRoutingStatus;
use App\Models\Campaign;
use App\Models\DeliveryReport;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Scheduled job that pulls delivery reports from Sinch and Infobip APIs
 * as a resilience mechanism in case webhooks are missed.
 *
 * Runs every 5 minutes via the scheduler.
 */
class PullReportsJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public function __construct()
    {
        $this->onQueue('report');
    }

    public function uniqueId(): string
    {
        return 'pull-reports';
    }

    public function handle(): void
    {
        $activeCampaigns = Campaign::where('routing_status', CampaignRoutingStatus::RoutingInProgress)
            ->orWhere('routing_status', CampaignRoutingStatus::RoutingCompleted)
            ->whereNotNull('routing_batch_id')
            ->whereNotNull('router_id')
            ->with(['router:id,name'])
            ->select(['id', 'routing_batch_id', 'router_id'])
            ->get();

        if ($activeCampaigns->isEmpty()) {
            return;
        }

        $drivers = app()->tagged('reports_pull_drivers');
        $totalInserted = 0;

        foreach ($drivers as $driver) {
            if (! $driver instanceof ReportsPullDriverInterface) {
                continue;
            }

            /** @var \Illuminate\Support\Collection<int, array{batch_id: string, campaign_id: int}> $campaignData */
            $campaignData = $activeCampaigns
                ->filter(fn (Campaign $c) => $c->routing_batch_id !== null)
                ->map(fn (Campaign $c) => [
                    'batch_id' => (string) $c->routing_batch_id,
                    'campaign_id' => $c->id,
                ])
                ->values();

            try {
                $reports = $driver->pull($campaignData);

                foreach ($reports as $report) {
                    // Dedup by checking if this exact report already exists
                    $exists = DeliveryReport::where('provider', $report['provider'] ?? '')
                        ->whereRaw("report->>'batch_id' = ?", [$report['batch_id'] ?? ''])
                        ->whereRaw("report->>'recipient' = ?", [$report['recipient'] ?? ''])
                        ->exists();

                    if (! $exists) {
                        DeliveryReport::create([
                            'provider' => $report['provider'] ?? 'unknown',
                            'report' => $report['report'] ?? $report,
                            'digested' => false,
                        ]);
                        $totalInserted++;
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('PullReportsJob: driver failed', [
                    'driver' => $driver::class,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($totalInserted > 0) {
            Log::info("PullReportsJob: inserted {$totalInserted} new reports");
        }
    }
}
