<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Partner;
use App\Services\TargetingTemplateService;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\TargetingTemplate>
 */
class TargetingTemplateFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $targeting = [
            'method' => 'department',
            'departments' => ['75'],
            'gender' => null,
            'age_min' => 25,
            'age_max' => 60,
        ];

        return [
            'partner_id' => Partner::factory(),
            'name' => fake()->sentence(3),
            'targeting_json' => $targeting,
            'targeting_hash' => TargetingTemplateService::computeHash($targeting),
            'usage_count' => 0,
            'last_used_at' => null,
            'is_preset' => false,
            'category' => null,
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (\App\Models\TargetingTemplate $template): void {
            if ($template->targeting_json) {
                $template->targeting_hash = TargetingTemplateService::computeHash($template->targeting_json);
            }
        });
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
