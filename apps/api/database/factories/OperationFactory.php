<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\OperationType;
use App\Models\Demande;
use App\Models\Operation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Operation>
 */
class OperationFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'demande_id' => Demande::factory(),
            'type' => OperationType::LOC->value,
            'name' => fake()->sentence(3),
        ];
    }

    public function loc(): static
    {
        return $this->state(['type' => OperationType::LOC->value]);
    }

    public function fid(): static
    {
        return $this->state(['type' => OperationType::FID->value]);
    }

    public function rep(): static
    {
        return $this->state(['type' => OperationType::REP->value]);
    }

    public function enrich(): static
    {
        return $this->state(['type' => OperationType::ENRICH->value]);
    }

    public function filtre(): static
    {
        return $this->state(['type' => OperationType::FILTRE->value]);
    }

    public function forDemande(Demande $demande): static
    {
        return $this->state(['demande_id' => $demande->id]);
    }
}
