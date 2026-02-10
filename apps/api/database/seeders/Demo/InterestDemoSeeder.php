<?php

declare(strict_types=1);

namespace Database\Seeders\Demo;

use App\Models\Interest;
use App\Models\InterestGroup;
use Database\Seeders\InterestGroupsSeeder;
use Illuminate\Database\Seeder;

class InterestDemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(InterestGroupsSeeder::class);

        $auto = InterestGroup::create(['label' => 'Automobile', 'description' => 'Centres d\'intérêt automobile']);
        $autoSub = InterestGroup::create(['label' => 'Véhicules', 'parent_id' => $auto->id]);
        Interest::create(['wellpack_id' => 100, 'label' => 'Occasion', 'type' => 'interest', 'interest_group_id' => $autoSub->id]);
        Interest::create(['wellpack_id' => 101, 'label' => 'Neuf', 'type' => 'interest', 'interest_group_id' => $autoSub->id]);
        Interest::create(['wellpack_id' => 102, 'label' => 'Entretien', 'type' => 'interest', 'interest_group_id' => $autoSub->id]);

        $beaute = InterestGroup::create(['label' => 'Beauté & Bien-être', 'description' => 'Soins et beauté']);
        $beauteSub = InterestGroup::create(['label' => 'Soins', 'parent_id' => $beaute->id]);
        Interest::create(['wellpack_id' => 110, 'label' => 'Cosmétique', 'type' => 'interest', 'interest_group_id' => $beauteSub->id]);
        Interest::create(['wellpack_id' => 111, 'label' => 'Spa', 'type' => 'interest', 'interest_group_id' => $beauteSub->id]);
        Interest::create(['wellpack_id' => 112, 'label' => 'Coiffure', 'type' => 'interest', 'interest_group_id' => $beauteSub->id]);

        $alim = InterestGroup::create(['label' => 'Alimentation', 'description' => 'Restauration et alimentaire']);
        $alimSub = InterestGroup::create(['label' => 'Restauration', 'parent_id' => $alim->id]);
        Interest::create(['wellpack_id' => 120, 'label' => 'Bio', 'type' => 'interest', 'interest_group_id' => $alimSub->id]);
        Interest::create(['wellpack_id' => 121, 'label' => 'Restaurants', 'type' => 'interest', 'interest_group_id' => $alimSub->id]);
        Interest::create(['wellpack_id' => 122, 'label' => 'Traiteur', 'type' => 'interest', 'interest_group_id' => $alimSub->id]);
    }
}
