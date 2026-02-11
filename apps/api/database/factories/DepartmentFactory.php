<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Department;
use App\Models\Region;
use Illuminate\Database\Eloquent\Factories\Factory;
use MatanYadaev\EloquentSpatial\Objects\LineString;
use MatanYadaev\EloquentSpatial\Objects\MultiPolygon;
use MatanYadaev\EloquentSpatial\Objects\Point;
use MatanYadaev\EloquentSpatial\Objects\Polygon;

/**
 * @extends Factory<Department>
 */
class DepartmentFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->numerify('##'),
            'name' => fake()->unique()->city(),
            'region_code' => Region::factory(),
        ];
    }

    public function withGeometry(): static
    {
        return $this->state(fn (): array => [
            'geometry' => new MultiPolygon([
                new Polygon([
                    new LineString([
                        new Point(48.8, 2.3, 4326),
                        new Point(48.8, 2.4, 4326),
                        new Point(48.9, 2.4, 4326),
                        new Point(48.9, 2.3, 4326),
                        new Point(48.8, 2.3, 4326),
                    ]),
                ]),
            ], 4326),
        ]);
    }

    public function forRegion(Region $region): static
    {
        return $this->state(fn (): array => [
            'region_code' => $region->code,
        ]);
    }
}
