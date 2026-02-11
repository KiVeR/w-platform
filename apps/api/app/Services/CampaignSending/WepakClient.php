<?php

declare(strict_types=1);

namespace App\Services\CampaignSending;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WepakClient
{
    public function __construct(
        protected string $baseUrl,
        protected string $apiKey,
        protected int $timeout = 3600,
        protected int $estimateTimeout = 30,
    ) {}

    /** @param array<string, mixed> $payload */
    public function sendProspection(array $payload): WepakResponse
    {
        return $this->post('/smsenvoi.php', $payload, $this->timeout);
    }

    /** @param array<string, mixed> $payload */
    public function sendFidelisation(array $payload): WepakResponse
    {
        return $this->post('/sendsmsjson.php', $payload, $this->timeout);
    }

    public function getStats(string $campaignId): WepakResponse
    {
        return $this->post('/statcampagne.php', ['id_campagne' => $campaignId], 10);
    }

    /** @param array<string, mixed> $payload */
    public function estimateVolume(array $payload): WepakResponse
    {
        return $this->post('/smsenvoi.php', $payload, $this->estimateTimeout);
    }

    /** @param array<string, mixed> $payload */
    protected function post(string $endpoint, array $payload, int $timeout): WepakResponse
    {
        $url = rtrim($this->baseUrl, '/').$endpoint;

        Log::info('Wepak request', [
            'endpoint' => $endpoint,
            'query' => $payload['query'] ?? null,
        ]);

        try {
            $response = $this->makeRequest($timeout)->asForm()->post($url, [
                'data' => json_encode($payload),
                'api_key' => $this->apiKey,
            ]);

            Log::info('Wepak response', [
                'endpoint' => $endpoint,
                'status' => $response->status(),
            ]);

            return WepakResponse::fromHttpResponse($response);
        } catch (ConnectionException $e) {
            Log::error('Wepak connection error', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage(),
            ]);

            return new WepakResponse(
                success: false,
                error: 'Wepak connection error: '.$e->getMessage(),
            );
        }
    }

    protected function makeRequest(int $timeout): PendingRequest
    {
        return Http::timeout($timeout)
            ->acceptJson();
    }
}
