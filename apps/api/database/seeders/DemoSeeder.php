<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Demo\CampaignDemoSeeder;
use Database\Seeders\Demo\InterestDemoSeeder;
use Database\Seeders\Demo\LandingPageDemoSeeder;
use Database\Seeders\Demo\PartnerDemoSeeder;
use Database\Seeders\Demo\RouterDemoSeeder;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            InterestDemoSeeder::class,
            RouterDemoSeeder::class,
            PartnerDemoSeeder::class,
            LandingPageDemoSeeder::class,
            CampaignDemoSeeder::class,
        ]);
    }
}
