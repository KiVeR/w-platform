<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Router;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Router>
 */
class RouterFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->randomElement(['sinch', 'infobip', 'highconnexion']),
            'external_id' => fake()->unique()->numberBetween(1, 100),
            'num_stop' => '36111',
            'is_active' => true,
        ];
    }

    public function sinch(): static
    {
        return $this->state(fn (): array => [
            'name' => 'sinch',
            'num_stop' => '36063',
        ]);
    }

    public function infobip(): static
    {
        return $this->state(fn (): array => [
            'name' => 'infobip',
            'num_stop' => '36111',
        ]);
    }

    public function highconnexion(): static
    {
        return $this->state(fn (): array => [
            'name' => 'highconnexion',
            'num_stop' => '36173',
        ]);
    }
}
