<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\CostEstimate;
use App\DTOs\NextTierInfo;
use App\Models\PartnerPricing;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class PricingService
{
    private const CACHE_TTL = 300; // 5 minutes

    public function calculate(int $partnerId, int $volume, bool $useCi = false): CostEstimate
    {
        $tiers = $this->getActiveTiers($partnerId);

        $pricing = $tiers
            ->where('volume_min', '<=', $volume)
            ->filter(fn (PartnerPricing $p) => $p->volume_max === null || $p->volume_max >= $volume)
            ->sortByDesc('volume_min')
            ->first();

        if (! $pricing) {
            $pricing = $tiers->where('is_default', true)->first();
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
        $tiers = $this->getActiveTiers($partnerId);

        $nextPricing = $tiers
            ->where('volume_min', '>', $currentVolume)
            ->sortBy('volume_min')
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

    public function invalidateCache(int $partnerId): void
    {
        Cache::forget("pricing:partner:{$partnerId}");
    }

    /** @return Collection<int, PartnerPricing> */
    private function getActiveTiers(int $partnerId): Collection
    {
        return Cache::remember(
            "pricing:partner:{$partnerId}",
            self::CACHE_TTL,
            fn (): Collection => PartnerPricing::query()
                ->where('partner_id', $partnerId)
                ->where('is_active', true)
                ->orderByDesc('volume_min')
                ->get()
        );
    }

    private function computeUnitPrice(PartnerPricing $pricing, bool $useCi): float
    {
        return $pricing->router_price + $pricing->data_price + ($useCi ? $pricing->ci_price : 0);
    }
}
