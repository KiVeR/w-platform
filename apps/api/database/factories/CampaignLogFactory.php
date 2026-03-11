<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Campaign;
use App\Models\CampaignLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CampaignLog>
 */
class CampaignLogFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'campaign_id' => Campaign::factory(),
            'data' => [
                'event' => fake()->word(),
                'details' => fake()->sentence(),
            ],
        ];
    }
}
