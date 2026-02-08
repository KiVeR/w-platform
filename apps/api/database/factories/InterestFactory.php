<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Interest;
use App\Models\InterestGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Interest>
 */
class InterestFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'wellpack_id' => fake()->unique()->numberBetween(1, 99999),
            'label' => fake()->word(),
            'type' => 'interest',
            'interest_group_id' => InterestGroup::factory(),
            'is_active' => true,
        ];
    }

    public function forGroup(?InterestGroup $group = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'interest_group_id' => $group?->id ?? InterestGroup::factory(),
        ]);
    }

    public function qualif(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => 'qualif',
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_active' => false,
        ]);
    }
}
