<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\IrisType;
use App\Models\Department;
use App\Models\IrisZone;
use Illuminate\Database\Eloquent\Factories\Factory;
use MatanYadaev\EloquentSpatial\Objects\LineString;
use MatanYadaev\EloquentSpatial\Objects\MultiPolygon;
use MatanYadaev\EloquentSpatial\Objects\Point;
use MatanYadaev\EloquentSpatial\Objects\Polygon;

/**
 * @extends Factory<IrisZone>
 */
class IrisZoneFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $deptCode = fake()->numerify('##');

        return [
            'code' => $deptCode.fake()->unique()->numerify('#######'),
            'name' => fake()->streetName(),
            'department_code' => Department::factory(),
            'commune_code' => $deptCode.fake()->numerify('###'),
            'commune_name' => fake()->city(),
            'iris_type' => IrisType::HABITAT,
        ];
    }

    public function withGeometry(): static
    {
        return $this->state(fn (): array => [
            'geometry' => new MultiPolygon([
                new Polygon([
                    new LineString([
                        new Point(48.85, 2.34, 4326),
                        new Point(48.85, 2.35, 4326),
                        new Point(48.86, 2.35, 4326),
                        new Point(48.86, 2.34, 4326),
                        new Point(48.85, 2.34, 4326),
                    ]),
                ]),
            ], 4326),
        ]);
    }

    public function habitat(): static
    {
        return $this->state(fn (): array => [
            'iris_type' => IrisType::HABITAT,
        ]);
    }

    public function nonSubdivise(): static
    {
        return $this->state(fn (): array => [
            'iris_type' => IrisType::NON_SUBDIVISE,
        ]);
    }

    public function forDepartment(Department $department): static
    {
        return $this->state(fn (): array => [
            'department_code' => $department->code,
        ]);
    }
}
