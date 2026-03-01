<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\LogActivity;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LogActivity>
 */
class LogActivityFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'event' => fake()->randomElement(['created', 'updated', 'deleted']),
            'model_type' => 'App\\Models\\Campaign',
            'model_id' => fake()->randomNumber(),
            'old_values' => null,
            'new_values' => ['status' => 'sent'],
        ];
    }
}
