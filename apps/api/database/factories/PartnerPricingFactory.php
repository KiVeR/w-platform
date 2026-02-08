<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Partner;
use App\Models\PartnerPricing;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PartnerPricing>
 */
class PartnerPricingFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'partner_id' => Partner::factory(),
            'name' => fake()->word(),
            'volume_min' => 0,
            'volume_max' => 10000,
            'router_price' => 0.0300,
            'data_price' => 0.0100,
            'ci_price' => 0.0050,
            'is_active' => true,
            'is_default' => false,
        ];
    }

    public function forPartner(?Partner $partner = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'partner_id' => $partner?->id ?? Partner::factory(),
        ]);
    }

    public function default(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_default' => true,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_active' => false,
        ]);
    }
}
