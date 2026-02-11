<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Region;
use Illuminate\Database\Eloquent\Factories\Factory;
use MatanYadaev\EloquentSpatial\Objects\LineString;
use MatanYadaev\EloquentSpatial\Objects\MultiPolygon;
use MatanYadaev\EloquentSpatial\Objects\Point;
use MatanYadaev\EloquentSpatial\Objects\Polygon;

/**
 * @extends Factory<Region>
 */
class RegionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->numerify('##'),
            'name' => fake()->unique()->state(),
        ];
    }

    public function withGeometry(): static
    {
        return $this->state(fn (): array => [
            'geometry' => new MultiPolygon([
                new Polygon([
                    new LineString([
                        new Point(48.0, 2.0, 4326),
                        new Point(48.0, 3.0, 4326),
                        new Point(49.0, 3.0, 4326),
                        new Point(49.0, 2.0, 4326),
                        new Point(48.0, 2.0, 4326),
                    ]),
                ]),
            ], 4326),
        ]);
    }
}
