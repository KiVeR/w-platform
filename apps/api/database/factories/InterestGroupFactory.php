<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\InterestGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InterestGroup>
 */
class InterestGroupFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'label' => fake()->unique()->word(),
            'description' => fake()->optional()->sentence(),
            'parent_id' => null,
            'is_active' => true,
        ];
    }

    public function forParent(?InterestGroup $parent = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'parent_id' => $parent?->id ?? InterestGroup::factory(),
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_active' => false,
        ]);
    }
}
