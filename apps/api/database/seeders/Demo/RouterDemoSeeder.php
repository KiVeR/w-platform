<?php

declare(strict_types=1);

namespace Database\Seeders\Demo;

use App\Models\Router;
use Illuminate\Database\Seeder;

class RouterDemoSeeder extends Seeder
{
    public function run(): void
    {
        Router::factory()->sinch()->create();
        Router::factory()->infobip()->create();
        Router::factory()->highconnexion()->create();
    }
}
