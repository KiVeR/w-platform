<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\CostEstimate;
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

        $unitPrice = $pricing->router_price + $pricing->data_price + ($useCi ? $pricing->ci_price : 0);
        $totalPrice = $volume * $unitPrice;

        return new CostEstimate(
            unitPrice: round($unitPrice, 4),
            totalPrice: round($totalPrice, 2),
            pricingId: $pricing->id,
        );
    }
}
