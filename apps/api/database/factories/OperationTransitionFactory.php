<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Operation;
use App\Models\OperationTransition;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OperationTransition>
 */
class OperationTransitionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'operation_id' => Operation::factory(),
            'track' => 'lifecycle',
            'from_state' => 'draft',
            'to_state' => 'preparing',
            'created_at' => now(),
        ];
    }
}
