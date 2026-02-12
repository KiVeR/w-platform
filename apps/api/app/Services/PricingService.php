<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\CostEstimate;
use App\DTOs\NextTierInfo;
use App\Models\PartnerPricing;

class PricingService
{
    public function calculate(int $partnerId, int $volume, bool $useCi = false): CostEstimate
    {
        $pricing = PartnerPricing::query()
            ->where('partner_id', $partnerId)
            ->where('is_active', true)
            ->where('volume_min', '<=', $volume)
            ->where(function ($query) use ($volume): void {
                $query->where('volume_max', '>=', $volume)
                    ->orWhereNull('volume_max');
            })
            ->orderByDesc('volume_min')
            ->first();

        if (! $pricing) {
            $pricing = PartnerPricing::query()
                ->where('partner_id', $partnerId)
                ->where('is_active', true)
                ->where('is_default', true)
                ->first();
        }

        if (! $pricing) {
            throw new \RuntimeException("No pricing found for partner {$partnerId} with volume {$volume}");
        }

        $unitPrice = $this->computeUnitPrice($pricing, $useCi);
        $totalPrice = $volume * $unitPrice;

        return new CostEstimate(
            unitPrice: round($unitPrice, 4),
            totalPrice: round($totalPrice, 2),
            pricingId: $pricing->id,
        );
    }

    public function findNextTier(int $partnerId, int $currentVolume, bool $useCi = false): ?NextTierInfo
    {
        $nextPricing = PartnerPricing::query()
            ->where('partner_id', $partnerId)
            ->where('is_active', true)
            ->where('volume_min', '>', $currentVolume)
            ->orderBy('volume_min')
            ->first();

        if (! $nextPricing) {
            return null;
        }

        $currentUnitPrice = $this->calculate($partnerId, $currentVolume, $useCi)->unitPrice;
        $nextUnitPrice = $this->computeUnitPrice($nextPricing, $useCi);

        if ($nextUnitPrice >= $currentUnitPrice) {
            return null;
        }

        $savingsPercent = ($currentUnitPrice - $nextUnitPrice) / $currentUnitPrice * 100;

        return new NextTierInfo(
            volumeThreshold: $nextPricing->volume_min,
            unitPrice: round($nextUnitPrice, 4),
            savingsPercent: round($savingsPercent, 1),
        );
    }

    private function computeUnitPrice(PartnerPricing $pricing, bool $useCi): float
    {
        return $pricing->router_price + $pricing->data_price + ($useCi ? $pricing->ci_price : 0);
    }
}
