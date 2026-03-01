<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\VariableSchema;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\VariableField>
 */
class VariableFieldFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'variable_schema_id' => VariableSchema::factory(),
            'name' => fake()->word(),
            'is_used' => false,
            'is_global' => false,
        ];
    }

    public function used(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_used' => true,
        ]);
    }

    public function global(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_global' => true,
        ]);
    }

    public function forSchema(?VariableSchema $schema = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'variable_schema_id' => $schema?->id ?? VariableSchema::factory(),
        ]);
    }
}
