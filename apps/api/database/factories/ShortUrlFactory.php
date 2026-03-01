<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ShortUrl;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ShortUrl>
 */
class ShortUrlFactory extends Factory
{
    protected $model = ShortUrl::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'slug' => fake()->slug(),
            'link' => fake()->url(),
            'click_count' => fake()->numberBetween(0, 10000),
            'click_count_bots' => 0,
            'is_enabled' => fake()->boolean(),
            'is_draft' => fake()->boolean(),
            'is_traceable_by_recipient' => fake()->boolean(),
            'import_id' => fake()->uuid(),
        ];
    }
}
