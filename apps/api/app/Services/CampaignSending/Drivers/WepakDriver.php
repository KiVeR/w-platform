<?php

declare(strict_types=1);

namespace App\Services\CampaignSending\Drivers;

use App\Contracts\CampaignSenderInterface;
use App\DTOs\SendResult;
use App\Enums\CampaignType;
use App\Models\Campaign;
use App\Services\CampaignSending\WepakClient;
use App\Services\CampaignSending\WepakPayloadBuilder;

class WepakDriver implements CampaignSenderInterface
{
    protected WepakClient $client;

    protected WepakPayloadBuilder $payloadBuilder;

    /** @param array{base_url: string, api_key: string, timeout: int, estimate_timeout: int} $config */
    public function __construct(
        protected array $config,
    ) {
        $this->client = new WepakClient(
            baseUrl: $config['base_url'],
            apiKey: $config['api_key'],
            timeout: $config['timeout'],
            estimateTimeout: $config['estimate_timeout'],
        );
        $this->payloadBuilder = new WepakPayloadBuilder;
    }

    public function send(Campaign $campaign): SendResult
    {
        if ($campaign->type === CampaignType::FIDELISATION) {
            return $this->sendFidelisation($campaign);
        }

        return $this->sendProspection($campaign);
    }

    public function estimateVolume(Campaign $campaign): int
    {
        $payload = $this->payloadBuilder->buildEstimatePayload($campaign);
        $response = $this->client->estimateVolume($payload);

        if (! $response->success) {
            return $campaign->getTargetingVolume();
        }

        return $response->volume ?? $campaign->getTargetingVolume();
    }

    protected function sendProspection(Campaign $campaign): SendResult
    {
        $payload = $this->payloadBuilder->buildProspectionPayload($campaign);
        $response = $this->client->sendProspection($payload);

        if (! $response->success) {
            return new SendResult(
                success: false,
                error: $response->error ?? 'Wepak prospection send failed',
            );
        }

        return new SendResult(
            success: true,
            externalId: $response->campaignId !== null ? (string) $response->campaignId : null,
        );
    }

    protected function sendFidelisation(Campaign $campaign): SendResult
    {
        // Fidélisation requires a recipient list (file upload) — not yet implemented.
        // For now, reject fidelisation sends.
        return new SendResult(
            success: false,
            error: 'Fidelisation sending not yet supported. File upload required.',
        );
    }
}
