<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ShortUrl;
use App\Models\ShortUrlSuffix;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ShortUrlSuffix>
 */
class ShortUrlSuffixFactory extends Factory
{
    protected $model = ShortUrlSuffix::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'short_url_id' => ShortUrl::factory(),
            'slug' => fake()->slug(),
            'batch_uuid' => fake()->uuid(),
            'click_count' => fake()->numberBetween(0, 10000),
            'click_count_bots' => 0,
        ];
    }
}
