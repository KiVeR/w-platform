<?php

declare(strict_types=1);

namespace Database\Seeders\Demo;

use App\Enums\CampaignStatus;
use App\Enums\CampaignType;
use App\Models\Campaign;
use App\Models\InterestGroup;
use App\Models\LandingPage;
use App\Models\Partner;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class CampaignDemoSeeder extends Seeder
{
    private const SMS_MESSAGES = [
        'Profitez de -20% sur votre prochain achat ! Offre valable en magasin uniquement.',
        'Nouveau : decouvrez notre catalogue printemps ! Rendez-vous en boutique.',
        'Vente privee exclusive du 15 au 20 mars. Jusqu\'a -50% sur tout le magasin !',
        'Votre magasin vous attend pour une degustation gratuite ce samedi.',
        'Derniers jours pour profiter de nos offres exceptionnelles. Ne manquez pas ca !',
        'Bonne nouvelle ! Vos points fidelite ont double ce mois-ci. Venez les utiliser.',
        'Flash : -30% sur la nouvelle collection ce week-end seulement.',
        'Invitation speciale : soiree VIP le jeudi 10 a partir de 19h. Repondez OUI.',
        'Votre bon de reduction de 15EUR vous attend en magasin. Valable 7 jours.',
        'Ouverture exceptionnelle dimanche ! Animations et surprises vous attendent.',
        'Soldes : 2eme demarque ! Jusqu\'a -60% sur une selection d\'articles.',
        'Merci de votre fidelite ! Un cadeau vous attend en boutique ce mois-ci.',
        'Rentree : equipez-vous a prix mini. Offres speciales jusqu\'au 15 septembre.',
        'Fete des meres : idees cadeaux a partir de 19,90EUR. Livraison offerte en magasin.',
        'Journee portes ouvertes samedi 22 mars. Venez decouvrir nos nouveautes !',
    ];

    private const ERROR_MESSAGES = [
        'Erreur de routage SMS : routeur indisponible.',
        'Timeout lors de la connexion au routeur.',
        'Credits insuffisants au moment de l\'envoi.',
        'Erreur API Wepak : code 500.',
        'Volume de destinataires invalide : aucun contact qualifie.',
    ];

    /** @var list<array{code: string, volume: int}> */
    private const POSTCODES_POOL = [
        ['code' => '75001', 'volume' => 2340],
        ['code' => '75008', 'volume' => 1870],
        ['code' => '75015', 'volume' => 3100],
        ['code' => '75011', 'volume' => 2780],
        ['code' => '69001', 'volume' => 1540],
        ['code' => '69003', 'volume' => 1920],
        ['code' => '69007', 'volume' => 1680],
        ['code' => '13001', 'volume' => 1450],
        ['code' => '13006', 'volume' => 1230],
        ['code' => '33000', 'volume' => 2100],
        ['code' => '31000', 'volume' => 1980],
        ['code' => '44000', 'volume' => 1760],
        ['code' => '67000', 'volume' => 1340],
        ['code' => '59000', 'volume' => 2450],
        ['code' => '34000', 'volume' => 1560],
        ['code' => '38000', 'volume' => 1290],
        ['code' => '06000', 'volume' => 1870],
        ['code' => '35000', 'volume' => 1410],
        ['code' => '76000', 'volume' => 1180],
        ['code' => '78000', 'volume' => 980],
    ];

    public function run(): void
    {
        $partners = Partner::with(['users', 'shops'])->get();
        $interestGroups = InterestGroup::whereNotNull('parent_id')->get();

        foreach ($partners as $partner) {
            $users = $partner->users;
            if ($users->isEmpty()) {
                continue;
            }

            $landingPages = LandingPage::where('partner_id', $partner->id)
                ->where('status', 'published')
                ->get();

            $count = $this->campaignCountForPartner($partner);
            if ($count === 0) {
                continue;
            }

            $this->createCampaignsForPartner(
                $partner,
                $users,
                $landingPages,
                $interestGroups,
                $count,
            );
        }
    }

    private function campaignCountForPartner(Partner $partner): int
    {
        if (! $partner->is_active) {
            return fake()->numberBetween(0, 3);
        }

        $shopCount = $partner->shops->count();

        if ($shopCount >= 8) {
            return fake()->numberBetween(40, 60); // large
        }

        if ($shopCount >= 3) {
            return fake()->numberBetween(15, 30); // medium
        }

        return fake()->numberBetween(5, 15); // small
    }

    /**
     * @param  Collection<int, User>  $users
     * @param  Collection<int, LandingPage>  $landingPages
     * @param  Collection<int, InterestGroup>  $interestGroups
     */
    private function createCampaignsForPartner(
        Partner $partner,
        Collection $users,
        Collection $landingPages,
        Collection $interestGroups,
        int $count,
    ): void {
        $senderName = $this->senderFromPartner($partner);

        for ($i = 0; $i < $count; $i++) {
            $status = $this->pickStatus($i, $count);
            $type = $this->pickType();
            $date = $this->pickDate($status);
            $message = self::SMS_MESSAGES[array_rand(self::SMS_MESSAGES)];
            $smsCount = (int) ceil(mb_strlen($message) / 160);
            $targeting = $this->generateTargeting();
            $volumeEstimated = $this->volumeFromTargeting($targeting);

            $factory = Campaign::factory()
                ->forPartner($partner)
                ->forUser($users->random());

            // Apply type
            $factory = match ($type) {
                CampaignType::FIDELISATION => $factory->fidelisation(),
                CampaignType::COMPTAGE => $factory->comptage(),
                default => $factory->prospection(),
            };

            $attributes = [
                'name' => $this->campaignName($type, $i),
                'sender' => $senderName,
                'sms_count' => $smsCount,
            ];

            // Apply status-specific data
            match ($status) {
                CampaignStatus::SENT => $this->applySent($factory, $attributes, $message, $targeting, $volumeEstimated, $date),
                CampaignStatus::SCHEDULED => $this->applyScheduled($factory, $attributes, $message, $targeting, $volumeEstimated, $date),
                CampaignStatus::SENDING => $this->applySending($factory, $attributes, $message, $targeting, $volumeEstimated),
                CampaignStatus::CANCELLED => $this->applyCancelled($factory, $attributes, $message, $targeting, $volumeEstimated, $date),
                CampaignStatus::FAILED => $this->applyFailed($factory, $attributes, $message, $targeting, $volumeEstimated, $date),
                CampaignStatus::DRAFT => $this->applyDraft($factory, $attributes, $message, $targeting),
            };

            $campaign = $factory->create($attributes);

            // Optionally attach landing page (~20% of sent/scheduled campaigns)
            if (in_array($status, [CampaignStatus::SENT, CampaignStatus::SCHEDULED]) && $landingPages->isNotEmpty() && fake()->boolean(20)) {
                $campaign->update(['landing_page_id' => $landingPages->random()->id]);
            }

            // Optionally attach interest groups (~30% of campaigns)
            if ($interestGroups->isNotEmpty() && fake()->boolean(30)) {
                $groupsToAttach = $interestGroups->random(fake()->numberBetween(1, 3));
                $pivotData = [];
                foreach ($groupsToAttach as $idx => $group) {
                    $pivotData[$group->id] = [
                        'index' => $idx,
                        'operator' => $idx === 0 ? 'AND' : fake()->randomElement(['AND', 'OR']),
                    ];
                }
                $campaign->interestGroups()->attach($pivotData);
            }

            // Demo campaigns (~5%)
            if (fake()->boolean(5) && $status === CampaignStatus::SENT) {
                $campaign->update([
                    'is_demo' => true,
                    'additional_phone' => '06'.fake()->numerify('########'),
                ]);
            }
        }
    }

    private function pickStatus(int $index, int $total): CampaignStatus
    {
        $progress = $index / max($total - 1, 1);

        // Recent campaigns (last ~30%) → mix of draft/scheduled/sending
        if ($progress > 0.7) {
            $rand = fake()->numberBetween(1, 100);

            return match (true) {
                $rand <= 35 => CampaignStatus::DRAFT,
                $rand <= 60 => CampaignStatus::SCHEDULED,
                $rand <= 72 => CampaignStatus::SENDING,
                default => CampaignStatus::SENT,
            };
        }

        // Older campaigns → mostly sent, some cancelled/failed
        $rand = fake()->numberBetween(1, 100);

        return match (true) {
            $rand <= 72 => CampaignStatus::SENT,
            $rand <= 87 => CampaignStatus::CANCELLED,
            default => CampaignStatus::FAILED,
        };
    }

    private function pickType(): CampaignType
    {
        $rand = fake()->numberBetween(1, 100);

        return match (true) {
            $rand <= 65 => CampaignType::PROSPECTION,
            $rand <= 90 => CampaignType::FIDELISATION,
            default => CampaignType::COMPTAGE,
        };
    }

    private function pickDate(CampaignStatus $status): Carbon
    {
        return match ($status) {
            CampaignStatus::SCHEDULED => now()->addDays(fake()->numberBetween(1, 30)),
            CampaignStatus::SENDING => now(),
            CampaignStatus::DRAFT => now()->subDays(fake()->numberBetween(0, 14)),
            default => now()->subDays(fake()->numberBetween(1, 180)),
        };
    }

    /** @return array{geo: array{postcodes: list<array{code: string, volume: int}>}} */
    private function generateTargeting(): array
    {
        $count = fake()->numberBetween(2, 8);
        $postcodes = collect(self::POSTCODES_POOL)
            ->shuffle()
            ->take($count)
            ->map(fn (array $pc) => [
                'code' => $pc['code'],
                'volume' => (int) round($pc['volume'] * fake()->randomFloat(2, 0.4, 1.6)),
            ])
            ->values()
            ->all();

        return ['geo' => ['postcodes' => $postcodes]];
    }

    private function volumeFromTargeting(array $targeting): int
    {
        return (int) collect($targeting['geo']['postcodes'])->sum('volume');
    }

    private function senderFromPartner(Partner $partner): string
    {
        $name = strtoupper(preg_replace('/[^a-zA-Z0-9]/', '', $partner->name));

        return substr($name, 0, 11);
    }

    private function campaignName(CampaignType $type, int $index): string
    {
        $prefixes = match ($type) {
            CampaignType::PROSPECTION => ['Prospection', 'Acquisition', 'Campagne prosp'],
            CampaignType::FIDELISATION => ['Fidélisation', 'Relance clients', 'Newsletter'],
            CampaignType::COMPTAGE => ['Comptage zone', 'Estimation volume', 'Analyse zone'],
        };

        return $prefixes[array_rand($prefixes)].' #'.($index + 1);
    }

    /**
     * @param  array<string, mixed>  &$attributes
     */
    private function applySent(mixed &$factory, array &$attributes, string $message, array $targeting, int $volumeEstimated, Carbon $date): void
    {
        $volumeSent = (int) round($volumeEstimated * fake()->randomFloat(2, 0.90, 0.98));
        $unitPrice = fake()->randomFloat(4, 0.035, 0.055);
        $totalPrice = round($volumeSent * $unitPrice, 2);

        $factory = $factory
            ->sent()
            ->withMessage($message)
            ->withTargeting($targeting)
            ->withVolume($volumeEstimated, $volumeSent)
            ->withPricing($unitPrice, $totalPrice);

        $attributes['scheduled_at'] = $date->copy()->subHours(fake()->numberBetween(1, 24));
        $attributes['sent_at'] = $date;
    }

    /**
     * @param  array<string, mixed>  &$attributes
     */
    private function applyScheduled(mixed &$factory, array &$attributes, string $message, array $targeting, int $volumeEstimated, Carbon $date): void
    {
        $unitPrice = fake()->randomFloat(4, 0.035, 0.055);
        $totalPrice = round($volumeEstimated * $unitPrice, 2);

        $factory = $factory
            ->scheduled($date)
            ->withMessage($message)
            ->withTargeting($targeting)
            ->withVolume($volumeEstimated)
            ->withPricing($unitPrice, $totalPrice);
    }

    /**
     * @param  array<string, mixed>  &$attributes
     */
    private function applySending(mixed &$factory, array &$attributes, string $message, array $targeting, int $volumeEstimated): void
    {
        $unitPrice = fake()->randomFloat(4, 0.035, 0.055);
        $totalPrice = round($volumeEstimated * $unitPrice, 2);

        $factory = $factory
            ->sending()
            ->withMessage($message)
            ->withTargeting($targeting)
            ->withVolume($volumeEstimated)
            ->withPricing($unitPrice, $totalPrice);
    }

    /**
     * @param  array<string, mixed>  &$attributes
     */
    private function applyCancelled(mixed &$factory, array &$attributes, string $message, array $targeting, int $volumeEstimated, Carbon $date): void
    {
        $factory = $factory
            ->cancelled()
            ->withMessage($message)
            ->withTargeting($targeting)
            ->withVolume($volumeEstimated);

        $attributes['scheduled_at'] = $date;
    }

    /**
     * @param  array<string, mixed>  &$attributes
     */
    private function applyFailed(mixed &$factory, array &$attributes, string $message, array $targeting, int $volumeEstimated, Carbon $date): void
    {
        $factory = $factory
            ->failed(self::ERROR_MESSAGES[array_rand(self::ERROR_MESSAGES)])
            ->withMessage($message)
            ->withTargeting($targeting)
            ->withVolume($volumeEstimated);

        $attributes['scheduled_at'] = $date;
    }

    /**
     * @param  array<string, mixed>  &$attributes
     */
    private function applyDraft(mixed &$factory, array &$attributes, string $message, array $targeting): void
    {
        // 70% have a message, 50% have targeting
        if (fake()->boolean(70)) {
            $factory = $factory->withMessage($message);
        }

        if (fake()->boolean(50)) {
            $factory = $factory->withTargeting($targeting);
        }
    }
}
