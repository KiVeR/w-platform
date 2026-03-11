<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Campaign;
use App\Models\CampaignRequestData;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CampaignRequestData>
 */
class CampaignRequestDataFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'campaign_id' => Campaign::factory(),
            'data' => [
                ['phone_number' => fake()->e164PhoneNumber(), 'civility' => 'M'],
                ['phone_number' => fake()->e164PhoneNumber(), 'civility' => 'F'],
            ],
        ];
    }
}
