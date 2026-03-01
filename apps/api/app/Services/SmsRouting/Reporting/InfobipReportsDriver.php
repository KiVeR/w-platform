<?php

declare(strict_types=1);

namespace App\Services\SmsRouting\Reporting;

use App\Contracts\ReportsPullDriverInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class InfobipReportsDriver implements ReportsPullDriverInterface
{
    public function __construct(
        protected string $baseUrl,
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
                    ->withToken($this->apiToken, 'App')
                    ->get($this->getReportUrl(), [
                        'bulkId' => $campaign['batch_id'],
                    ]);

                if ($response->successful()) {
                    /** @var array<string, mixed> $body */
                    $body = $response->json() ?? [];
                    $reports->push([
                        'batch_id' => $campaign['batch_id'],
                        'campaign_id' => $campaign['campaign_id'],
                        'report' => $body,
                    ]);
                } else {
                    Log::warning('Infobip reports pull failed', [
                        'batch_id' => $campaign['batch_id'],
                        'status' => $response->status(),
                    ]);
                }
            } catch (\Throwable $e) {
                Log::error('Infobip reports pull exception', [
                    'batch_id' => $campaign['batch_id'],
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $reports;
    }

    protected function getReportUrl(): string
    {
        return "https://{$this->baseUrl}.api.infobip.com/sms/1/reports";
    }
}
