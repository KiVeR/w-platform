<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Contracts\CampaignSenderInterface;
use App\DTOs\Targeting\TargetingInput;
use App\Http\Controllers\Controller;
use App\Http\Requests\EstimateRequest;
use App\Models\User;
use App\Services\PricingService;
use App\Services\Targeting\TargetingResolver;
use Illuminate\Http\JsonResponse;

class EstimateController extends Controller
{
    public function __invoke(
        EstimateRequest $request,
        TargetingResolver $targetingResolver,
        CampaignSenderInterface $sender,
        PricingService $pricingService,
    ): JsonResponse {
        /** @var User $user */
        $user = auth()->user();

        $validated = $request->validated();

        if (isset($validated['targeting'])) {
            $input = TargetingInput::fromRequest($validated['targeting']);
            $canonical = $targetingResolver->resolve($input);
            $targetingArray = $canonical->toArray();
        } else {
            $targetingArray = [];
        }

        $volume = $sender->estimateVolumeFromTargeting($targetingArray);

        if ($volume <= 0) {
            return new JsonResponse(['data' => [
                'volume' => 0,
                'unit_price' => null,
                'total_price' => null,
                'sms_count' => 0,
            ]]);
        }

        $partnerId = $user->hasRole('admin')
            ? ($validated['partner_id'] ?? null)
            : $user->partner_id;

        if ($partnerId === null) {
            return new JsonResponse(['data' => [
                'volume' => $volume,
                'unit_price' => null,
                'total_price' => null,
                'sms_count' => $volume,
            ]]);
        }

        $estimate = $pricingService->calculate($partnerId, $volume, useCi: false);
        $nextTier = $pricingService->findNextTier($partnerId, $volume, useCi: false);

        return new JsonResponse(['data' => [
            'volume' => $volume,
            'unit_price' => $estimate->unitPrice,
            'total_price' => $estimate->totalPrice,
            'sms_count' => $volume,
            'next_tier' => $nextTier ? [
                'volume_threshold' => $nextTier->volumeThreshold,
                'unit_price' => $nextTier->unitPrice,
                'savings_pct' => $nextTier->savingsPercent,
            ] : null,
        ]]);
    }
}
