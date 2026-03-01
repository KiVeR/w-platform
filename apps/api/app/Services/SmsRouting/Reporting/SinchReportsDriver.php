<?php

declare(strict_types=1);

namespace App\Services\SmsRouting\Reporting;

use App\Contracts\ReportsPullDriverInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SinchReportsDriver implements ReportsPullDriverInterface
{
    public function __construct(
        protected string $region,
        protected string $servicePlanId,
        protected string $apiToken,
    ) {}

    /**
     * @param  Collection<int, array{batch_id: string, campaign_id: int}>  $activeCampaigns
     * @return Collection<int, array<string, mixed>>
     */
    public function pull(Collection $activeCampaigns): Collection
    {
        /** @var Collection<int, array<string, mixed>> $reports */
        $reports = collect();

        foreach ($activeCampaigns as $campaign) {
            try {
                $response = Http::acceptJson()
                    ->withToken($this->apiToken)
                    ->get($this->getReportUrl($campaign['batch_id']));

                if ($response->successful()) {
                    /** @var array<string, mixed> $body */
                    $body = $response->json() ?? [];
                    $reports->push([
                        'batch_id' => $campaign['batch_id'],
                        'campaign_id' => $campaign['campaign_id'],
                        'report' => $body,
                    ]);
                } else {
                    Log::warning('Sinch reports pull failed', [
                        'batch_id' => $campaign['batch_id'],
                        'status' => $response->status(),
                    ]);
                }
            } catch (\Throwable $e) {
                Log::error('Sinch reports pull exception', [
                    'batch_id' => $campaign['batch_id'],
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $reports;
    }

    protected function getReportUrl(string $batchId): string
    {
        return "https://{$this->region}.sms.api.sinch.com/xms/v1/{$this->servicePlanId}/batches/{$batchId}/delivery_report";
    }
}
