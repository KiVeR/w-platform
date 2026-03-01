<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ImportableLink;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ImportableLink>
 */
class ImportableLinkFactory extends Factory
{
    protected $model = ImportableLink::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'count' => fake()->numberBetween(0, 10000),
            'imported' => false,
        ];
    }
}
