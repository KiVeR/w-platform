<?php

declare(strict_types=1);

namespace Database\Seeders\Demo;

use App\Models\LandingPage;
use App\Models\Partner;
use Illuminate\Database\Seeder;

class LandingPageDemoSeeder extends Seeder
{
    /** @var list<array{name: string, title: string, og_title: ?string, og_description: ?string}> */
    private const TEMPLATES = [
        [
            'name' => 'Offre spéciale été',
            'title' => 'Profitez de nos offres estivales',
            'og_title' => 'Offres d\'été exceptionnelles',
            'og_description' => 'Découvrez toutes nos promotions estivales en magasin et en ligne.',
        ],
        [
            'name' => 'Nouveau catalogue',
            'title' => 'Notre nouveau catalogue est arrivé',
            'og_title' => 'Nouveau catalogue 2025',
            'og_description' => 'Parcourez notre nouveau catalogue et découvrez nos nouveautés.',
        ],
        [
            'name' => 'Vente privée VIP',
            'title' => 'Accès exclusif vente privée',
            'og_title' => null,
            'og_description' => null,
        ],
        [
            'name' => 'Jeu concours Noël',
            'title' => 'Tentez de gagner un cadeau',
            'og_title' => 'Grand jeu concours de Noël',
            'og_description' => 'Participez et gagnez un des 50 lots mis en jeu.',
        ],
        [
            'name' => 'Ouverture nouveau magasin',
            'title' => 'On ouvre près de chez vous !',
            'og_title' => null,
            'og_description' => null,
        ],
        [
            'name' => 'Soldes hiver',
            'title' => 'Soldes : jusqu\'à -50%',
            'og_title' => 'Soldes d\'hiver — Jusqu\'à -50%',
            'og_description' => 'Profitez des soldes d\'hiver sur toute notre sélection.',
        ],
        [
            'name' => 'Programme fidélité',
            'title' => 'Rejoignez notre programme fidélité',
            'og_title' => null,
            'og_description' => null,
        ],
        [
            'name' => 'Black Friday',
            'title' => 'Black Friday : offres flash',
            'og_title' => 'Black Friday — Offres exclusives',
            'og_description' => 'Des offres flash pendant 48h seulement.',
        ],
    ];

    public function run(): void
    {
        $templateIndex = 0;
        $partners = Partner::where('is_active', true)->with('users')->get();

        foreach ($partners as $partner) {
            $count = $this->countForPartner($partner);

            if ($count === 0) {
                continue;
            }

            $creator = $partner->users->first();

            if (! $creator) {
                continue;
            }

            for ($i = 0; $i < $count; $i++) {
                $template = self::TEMPLATES[$templateIndex % count(self::TEMPLATES)];
                $templateIndex++;

                $factory = LandingPage::factory()
                    ->forPartner($partner)
                    ->forUser($creator);

                // First ones are published with design, then draft, last archived
                if ($i === 0) {
                    $factory = $factory->published()->withDesign();
                } elseif ($i === $count - 1 && $count >= 3) {
                    $factory = $factory->archived();
                }
                // Default = draft

                $factory->create([
                    'name' => $template['name'],
                    'title' => $template['title'],
                    'og_title' => $template['og_title'],
                    'og_description' => $template['og_description'],
                ]);
            }
        }
    }

    private function countForPartner(Partner $partner): int
    {
        $shopCount = $partner->shops()->count();

        if ($shopCount >= 8) {
            return fake()->numberBetween(3, 5); // large
        }

        if ($shopCount >= 3) {
            return fake()->numberBetween(1, 3); // medium
        }

        return fake()->numberBetween(0, 1); // small
    }
}
