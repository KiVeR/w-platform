<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Partner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\TargetingTemplate>
 */
class TargetingTemplateFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'partner_id' => Partner::factory(),
            'name' => fake()->sentence(3),
            'targeting_json' => [
                'method' => 'department',
                'departments' => ['75'],
                'gender' => null,
                'age_min' => 25,
                'age_max' => 60,
            ],
            'usage_count' => 0,
            'last_used_at' => null,
            'is_preset' => false,
            'category' => null,
        ];
    }

    public function preset(?string $category = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'partner_id' => null,
            'is_preset' => true,
            'category' => $category ?? 'commerce',
        ]);
    }

    public function forPartner(?Partner $partner = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'partner_id' => $partner?->id ?? Partner::factory(),
        ]);
    }

    public function used(int $count = 1): static
    {
        return $this->state(fn (array $attributes): array => [
            'usage_count' => $count,
            'last_used_at' => now(),
        ]);
    }
}
