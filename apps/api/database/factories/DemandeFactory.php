<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Demande;
use App\Models\Partner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Demande>
 */
class DemandeFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'partner_id' => Partner::factory(),
            'information' => fake()->sentence(),
            'is_exoneration' => false,
            'pays_id' => 'FR',
        ];
    }

    public function forPartner(Partner $partner): static
    {
        return $this->state(['partner_id' => $partner->id]);
    }
}
