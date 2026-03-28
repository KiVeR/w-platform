<?php

declare(strict_types=1);

namespace Database\Seeders\Demo;

use App\Models\Demande;
use App\Models\Partner;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeder pour tester les fonctionnalités Hub/Scope.
 *
 * Crée des utilisateurs internes (ADV, direction, programmer, commercial)
 * et assigne les partenaires existants à des portefeuilles ADV.
 * Ajoute des transactions de crédits et des demandes pour le Hub Dashboard.
 *
 * Prérequis : PartnerDemoSeeder doit avoir tourné avant.
 */
class HubScopeDemoSeeder extends Seeder
{
    public function run(): void
    {
        $partners = Partner::all();

        // ── Utilisateurs internes ────────────────────────────

        $adv1 = $this->createInternalUser('Sophie', 'Durand', 'sophie.durand@wellpack.com', 'adv');
        $adv2 = $this->createInternalUser('Thomas', 'Moreau', 'thomas.moreau@wellpack.com', 'adv');
        $direction = $this->createInternalUser('Claire', 'Lambert', 'claire.lambert@wellpack.com', 'direction');
        $programmer = $this->createInternalUser('Lucas', 'Petit', 'lucas.petit@wellpack.com', 'programmer');
        $commercial = $this->createInternalUser('Emma', 'Garcia', 'emma.garcia@wellpack.com', 'commercial');
        $graphiste = $this->createInternalUser('Hugo', 'Roux', 'hugo.roux@wellpack.com', 'graphiste');

        // ── Assignation portefeuilles ADV ────────────────────

        // Sophie gère les "large" + quelques "medium" (8 partenaires)
        $sophiePartners = $partners->filter(fn (Partner $p) => str_starts_with($p->code, 'MART')
            || str_starts_with($p->code, 'AUTO')
            || str_starts_with($p->code, 'IMMO')
            || str_starts_with($p->code, 'BELL')
            || str_starts_with($p->code, 'SZEN')
            || str_starts_with($p->code, 'JVRT')
            || str_starts_with($p->code, 'OPGA')
            || str_starts_with($p->code, 'CYCL')
        );
        $sophiePartners->each(fn (Partner $p) => $p->update(['adv_id' => $adv1->id]));

        // Thomas gère les "small" + inactifs (7 partenaires)
        $thomasPartners = $partners->filter(fn (Partner $p) => str_starts_with($p->code, 'COIF')
            || str_starts_with($p->code, 'PREX')
            || str_starts_with($p->code, 'ROSE')
            || str_starts_with($p->code, 'BDUP')
            || str_starts_with($p->code, 'DIPL')
            || str_starts_with($p->code, 'ANCS')
            || str_starts_with($p->code, 'TEST')
        );
        $thomasPartners->each(fn (Partner $p) => $p->update(['adv_id' => $adv2->id]));

        // ── Transactions de crédits (historique) ─────────────

        $activePartners = $partners->where('is_active', true);
        foreach ($activePartners as $partner) {
            // Recharge initiale
            Transaction::create([
                'partner_id' => $partner->id,
                'type' => 'credit',
                'amount' => fake()->randomFloat(2, 200, 2000),
                'balance_after' => $partner->euro_credits,
                'description' => 'Recharge initiale',
                'reference' => 'INIT-'.strtoupper(fake()->bothify('??###')),
                'created_at' => now()->subDays(fake()->numberBetween(30, 90)),
            ]);

            // Quelques débits (campagnes envoyées)
            $debits = fake()->numberBetween(1, 4);
            for ($i = 0; $i < $debits; $i++) {
                $amount = fake()->randomFloat(2, 10, 150);
                Transaction::create([
                    'partner_id' => $partner->id,
                    'type' => 'debit',
                    'amount' => -$amount,
                    'balance_after' => max(0, (float) $partner->euro_credits - $amount * ($i + 1)),
                    'description' => 'Campagne SMS #'.fake()->numberBetween(100, 999),
                    'reference' => 'CAMP-'.fake()->numberBetween(100, 999),
                    'created_at' => now()->subDays(fake()->numberBetween(1, 30)),
                ]);
            }

            // Partenaires avec crédits bas → alertes dans le Hub
            if ((float) $partner->euro_credits < 200) {
                // Pas de recharge supplémentaire — on laisse le solde bas pour voir l'alerte
            } elseif (fake()->boolean(30)) {
                // 30% chance de recharge récente
                Transaction::create([
                    'partner_id' => $partner->id,
                    'type' => 'credit',
                    'amount' => fake()->randomFloat(2, 100, 500),
                    'balance_after' => (float) $partner->euro_credits + fake()->randomFloat(2, 100, 500),
                    'description' => 'Recharge compte',
                    'reference' => 'RECH-'.strtoupper(fake()->bothify('??###')),
                    'created_at' => now()->subDays(fake()->numberBetween(1, 7)),
                ]);
            }
        }

        // ── Demandes (pour KPI Hub) ──────────────────────────

        foreach ($activePartners->take(8) as $partner) {
            $count = fake()->numberBetween(1, 3);
            for ($i = 0; $i < $count; $i++) {
                Demande::factory()->create([
                    'partner_id' => $partner->id,
                    'commercial_id' => collect([$adv1->id, $adv2->id, $commercial->id])->random(),
                    'created_at' => now()->subDays(fake()->numberBetween(1, 30)),
                ]);
            }
        }

        $this->command->info('Hub/Scope demo data created:');
        $this->command->info('  - 6 internal users (2 ADV, 1 direction, 1 programmer, 1 commercial, 1 graphiste)');
        $this->command->info("  - {$sophiePartners->count()} partners → Sophie (ADV)");
        $this->command->info("  - {$thomasPartners->count()} partners → Thomas (ADV)");
        $this->command->info('  - Transactions + Demandes created');
    }

    private function createInternalUser(string $firstname, string $lastname, string $email, string $role): User
    {
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'firstname' => $firstname,
                'lastname' => $lastname,
                'password' => 'password',
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );

        $user->assignRole($role);

        return $user;
    }
}
