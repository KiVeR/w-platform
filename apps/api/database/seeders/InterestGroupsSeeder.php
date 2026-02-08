<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Interest;
use App\Models\InterestGroup;
use Illuminate\Database\Seeder;

class InterestGroupsSeeder extends Seeder
{
    public function run(): void
    {
        $habitat = InterestGroup::create(['label' => 'Habitat', 'description' => 'Centres d\'intérêt liés à l\'habitat']);
        $maison = InterestGroup::create(['label' => 'Maison', 'parent_id' => $habitat->id]);
        Interest::create(['wellpack_id' => 1, 'label' => 'Bricolage', 'type' => 'interest', 'interest_group_id' => $maison->id]);
        Interest::create(['wellpack_id' => 2, 'label' => 'Jardinage', 'type' => 'interest', 'interest_group_id' => $maison->id]);
        Interest::create(['wellpack_id' => 3, 'label' => 'Décoration', 'type' => 'interest', 'interest_group_id' => $maison->id]);

        $loisirs = InterestGroup::create(['label' => 'Loisirs', 'description' => 'Centres d\'intérêt liés aux loisirs']);
        $sport = InterestGroup::create(['label' => 'Sport', 'parent_id' => $loisirs->id]);
        Interest::create(['wellpack_id' => 10, 'label' => 'Football', 'type' => 'interest', 'interest_group_id' => $sport->id]);
        Interest::create(['wellpack_id' => 11, 'label' => 'Tennis', 'type' => 'interest', 'interest_group_id' => $sport->id]);

        $qualif = InterestGroup::create(['label' => 'Qualifications', 'description' => 'Données de qualification']);
        Interest::create(['wellpack_id' => 50, 'label' => 'Propriétaire', 'type' => 'qualif', 'interest_group_id' => $qualif->id]);
        Interest::create(['wellpack_id' => 51, 'label' => 'CSP+', 'type' => 'qualif', 'interest_group_id' => $qualif->id]);
    }
}
