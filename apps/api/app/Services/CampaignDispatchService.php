<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\CampaignSenderInterface;
use App\DTOs\CostEstimate;
use App\Enums\CampaignStatus;
use App\Exceptions\InsufficientCreditsException;
use App\Models\Campaign;
use App\Services\CampaignSending\StopSmsService;
use Illuminate\Http\JsonResponse;

final class CampaignDispatchService
{
    public function __construct(
        private readonly CampaignSenderInterface $sender,
        private readonly PricingService $pricingService,
        private readonly CreditService $creditService,
        private readonly StopSmsService $stopSmsService,
    ) {}

    /**
     * Validate that the campaign is ready to send.
     *
     * Returns null if OK, JsonResponse with 422 if validation fails.
     */
    public function validateReadiness(Campaign $campaign): ?JsonResponse
    {
        if (! $campaign->message || ! $campaign->sender) {
            return new JsonResponse(
                ['message' => 'Campaign must have a message and sender.', 'errors' => array_filter([
                    'message' => ! $campaign->message ? ['Message is required.'] : null,
                    'sender' => ! $campaign->sender ? ['Sender is required.'] : null,
                ])],
                422,
            );
        }

        if ($this->stopSmsService->containsBlockedDomain($campaign->message)) {
            return new JsonResponse(
                ['message' => 'Message contains a blocked domain.', 'errors' => ['message' => ['The domain rsms.co is not allowed.']]],
                422,
            );
        }

        return null;
    }

    /**
     * Estimate volume, calculate pricing, and update the campaign.
     *
     * Returns CostEstimate on success, JsonResponse with 422 on error.
     */
    public function estimateAndPrice(Campaign $campaign): CostEstimate|JsonResponse
    {
        $volume = $this->sender->estimateVolumeFromTargeting($campaign->targeting ?? []);

        if ($volume <= 0) {
            return new JsonResponse(
                ['message' => 'Volume must be greater than 0.', 'errors' => ['volume' => ['Volume estimation returned 0.']]],
                422,
            );
        }

        $useCi = $campaign->interestGroups()->exists();

        /** @var int $partnerId */
        $partnerId = $campaign->partner_id;

        try {
            $estimate = $this->pricingService->calculate($partnerId, $volume, $useCi);
        } catch (\RuntimeException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 422);
        }

        $campaign->update([
            'volume_estimated' => $volume,
            'unit_price' => $estimate->unitPrice,
            'total_price' => $estimate->totalPrice,
            'sms_count' => $volume,
        ]);

        return $estimate;
    }

    /**
     * Deduct credits from the partner.
     *
     * Returns null if OK (or skipped for demo/zero-price), JsonResponse with 422 if insufficient.
     */
    public function deductCredits(Campaign $campaign, CostEstimate $estimate): ?JsonResponse
    {
        if ($campaign->is_demo || $estimate->totalPrice <= 0 || ! $campaign->partner) {
            return null;
        }

        try {
            $this->creditService->deduct($campaign->partner, $estimate->totalPrice);
        } catch (InsufficientCreditsException $e) {
            return new JsonResponse([
                'message' => $e->getMessage(),
                'errors' => ['euro_credits' => ["Required: {$e->required}€, available: {$e->available}€"]],
            ], 422);
        }

        return null;
    }

    /**
     * Refund credits if the campaign was scheduled or sending.
     */
    public function refundCredits(Campaign $campaign): void
    {
        if ($campaign->is_demo || ! $campaign->total_price || $campaign->total_price <= 0) {
            return;
        }

        if (! in_array($campaign->status, [CampaignStatus::SCHEDULED, CampaignStatus::SENDING], true)) {
            return;
        }

        if (! $campaign->partner) {
            return;
        }

        $this->creditService->refund($campaign->partner, (float) $campaign->total_price);
    }
}
