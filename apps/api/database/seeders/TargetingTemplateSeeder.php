<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\TargetingTemplate;
use Illuminate\Database\Seeder;

class TargetingTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $presets = [
            [
                'category' => 'commerce',
                'name' => 'Zone locale 2-3 km',
                'targeting_json' => [
                    'method' => 'address',
                    'radius' => 2500,
                    'gender' => null,
                    'age_min' => 25,
                    'age_max' => 55,
                ],
            ],
            [
                'category' => 'optique',
                'name' => 'Zone santé 5-10 km',
                'targeting_json' => [
                    'method' => 'address',
                    'radius' => 7500,
                    'gender' => null,
                    'age_min' => 40,
                    'age_max' => 100,
                ],
            ],
            [
                'category' => 'automobile',
                'name' => 'Zone étendue 15-30 km',
                'targeting_json' => [
                    'method' => 'address',
                    'radius' => 22500,
                    'gender' => null,
                    'age_min' => 30,
                    'age_max' => 60,
                ],
            ],
            [
                'category' => 'immobilier',
                'name' => 'Département entier',
                'targeting_json' => [
                    'method' => 'department',
                    'departments' => ['75'],
                    'gender' => null,
                    'age_min' => 25,
                    'age_max' => 60,
                ],
            ],
            [
                'category' => 'menuiserie',
                'name' => 'Multi-départements',
                'targeting_json' => [
                    'method' => 'department',
                    'departments' => ['75', '92', '93', '94'],
                    'gender' => null,
                    'age_min' => 35,
                    'age_max' => 65,
                ],
            ],
            [
                'category' => 'thermalisme',
                'name' => 'Zone nationale',
                'targeting_json' => [
                    'method' => 'department',
                    'departments' => ['09', '31', '64', '65', '66'],
                    'gender' => null,
                    'age_min' => 55,
                    'age_max' => 100,
                ],
            ],
            [
                'category' => 'fleuriste',
                'name' => 'Ciblage fleuriste',
                'targeting_json' => [
                    'method' => 'department',
                    'departments' => ['75'],
                    'gender' => 'F',
                    'age_min' => 25,
                    'age_max' => 65,
                ],
            ],
        ];

        foreach ($presets as $preset) {
            TargetingTemplate::firstOrCreate(
                ['name' => $preset['name'], 'is_preset' => true],
                [
                    'partner_id' => null,
                    'is_preset' => true,
                    'category' => $preset['category'],
                    'targeting_json' => $preset['targeting_json'],
                ],
            );
        }
    }
}
