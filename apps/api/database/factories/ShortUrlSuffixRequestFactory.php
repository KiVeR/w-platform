<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ShortUrl;
use App\Models\ShortUrlSuffixRequest;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ShortUrlSuffixRequest>
 */
class ShortUrlSuffixRequestFactory extends Factory
{
    protected $model = ShortUrlSuffixRequest::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'short_url_id' => ShortUrl::factory(),
            'quantity' => fake()->numberBetween(1, 1000),
            'batch_uuid' => fake()->uuid(),
        ];
    }
}
