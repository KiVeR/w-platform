<?php

declare(strict_types=1);

namespace Database\Seeders\Demo;

use App\Enums\PartnerFeatureKey;
use App\Models\Partner;
use App\Models\PartnerFeature;
use App\Models\PartnerPricing;
use App\Models\Router;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Seeder;

class PartnerDemoSeeder extends Seeder
{
    /** @var array<string, array{name: string, code: string, email: string, phone: string, address: string, city: string, zip_code: string}> */
    private const PARTNERS = [
        // ── Large (3) ──────────────────────────────────
        'large_1' => [
            'name' => 'Boulangeries Martin',
            'code' => 'MART',
            'email' => 'contact@boulangeries-martin.fr',
            'phone' => '01 42 33 12 45',
            'address' => '12 rue du Commerce',
            'city' => 'Paris',
            'zip_code' => '75015',
        ],
        'large_2' => [
            'name' => 'Groupe Auto Leroy',
            'code' => 'AUTO',
            'email' => 'direction@auto-leroy.fr',
            'phone' => '04 72 10 55 00',
            'address' => '245 avenue Jean Jaurès',
            'city' => 'Lyon',
            'zip_code' => '69007',
        ],
        'large_3' => [
            'name' => 'Réseau Immo Plus',
            'code' => 'IMMO',
            'email' => 'contact@immoplus.fr',
            'phone' => '05 56 44 78 90',
            'address' => '8 place des Quinconces',
            'city' => 'Bordeaux',
            'zip_code' => '33000',
        ],

        // ── Medium (5) ─────────────────────────────────
        'medium_1' => [
            'name' => 'Pizzeria Bella Napoli',
            'code' => 'BELL',
            'email' => 'info@bellanapoli.fr',
            'phone' => '04 91 33 22 11',
            'address' => '34 cours Julien',
            'city' => 'Marseille',
            'zip_code' => '13006',
        ],
        'medium_2' => [
            'name' => 'Spa Zen Attitude',
            'code' => 'SZEN',
            'email' => 'reservation@zenattitude.fr',
            'phone' => '03 88 22 44 66',
            'address' => '5 rue des Bains',
            'city' => 'Strasbourg',
            'zip_code' => '67000',
        ],
        'medium_3' => [
            'name' => 'Jardinerie Verte',
            'code' => 'JVRT',
            'email' => 'contact@jardinerie-verte.fr',
            'phone' => '02 40 55 33 11',
            'address' => '120 route de Vannes',
            'city' => 'Nantes',
            'zip_code' => '44100',
        ],
        'medium_4' => [
            'name' => 'Optique Grand Angle',
            'code' => 'OPGA',
            'email' => 'rdv@grand-angle-optique.fr',
            'phone' => '01 45 67 89 00',
            'address' => '78 boulevard Haussmann',
            'city' => 'Paris',
            'zip_code' => '75008',
        ],
        'medium_5' => [
            'name' => 'Cycles Sport Nature',
            'code' => 'CYCL',
            'email' => 'vente@cycles-sportnature.fr',
            'phone' => '04 76 12 34 56',
            'address' => '15 avenue Alsace-Lorraine',
            'city' => 'Grenoble',
            'zip_code' => '38000',
        ],

        // ── Small (5) ──────────────────────────────────
        'small_1' => [
            'name' => 'Coiffure Marie',
            'code' => 'COIF',
            'email' => 'marie@coiffure-marie.fr',
            'phone' => '01 39 55 12 34',
            'address' => '3 rue Victor Hugo',
            'city' => 'Versailles',
            'zip_code' => '78000',
        ],
        'small_2' => [
            'name' => 'Pressing Express',
            'code' => 'PREX',
            'email' => 'contact@pressing-express.fr',
            'phone' => '03 20 11 22 33',
            'address' => '22 rue de Béthune',
            'city' => 'Lille',
            'zip_code' => '59000',
        ],
        'small_3' => [
            'name' => 'Fleuriste Roses & Co',
            'code' => 'ROSE',
            'email' => 'commandes@rosesetco.fr',
            'phone' => '04 67 88 99 00',
            'address' => '45 avenue de la Mer',
            'city' => 'Montpellier',
            'zip_code' => '34000',
        ],
        'small_4' => [
            'name' => 'Boucherie Dupont',
            'code' => 'BDUP',
            'email' => 'boucherie.dupont@orange.fr',
            'phone' => '02 51 33 44 55',
            'address' => '11 place du Marché',
            'city' => 'La Roche-sur-Yon',
            'zip_code' => '85000',
        ],
        'small_5' => [
            'name' => 'Tabac Le Diplomate',
            'code' => 'DIPL',
            'email' => 'lediplomate@gmail.com',
            'phone' => '05 61 22 33 44',
            'address' => '2 place du Capitole',
            'city' => 'Toulouse',
            'zip_code' => '31000',
        ],

        // ── Inactive (2) ───────────────────────────────
        'inactive_1' => [
            'name' => 'Ancien Client SAS',
            'code' => 'ANCS',
            'email' => 'ancien@client-sas.fr',
            'phone' => '01 00 00 00 00',
            'address' => '1 rue Fermée',
            'city' => 'Paris',
            'zip_code' => '75001',
        ],
        'inactive_2' => [
            'name' => 'Test Démo SARL',
            'code' => 'TEST',
            'email' => 'test@demo-sarl.fr',
            'phone' => '01 00 00 00 01',
            'address' => '99 rue du Test',
            'city' => 'Lyon',
            'zip_code' => '69001',
        ],
    ];

    /** @var array<string, array{city: string, zip: string, lat: float, lng: float}> */
    private const FRENCH_LOCATIONS = [
        ['city' => 'Paris 1er', 'zip' => '75001', 'lat' => 48.8606, 'lng' => 2.3476],
        ['city' => 'Paris 15e', 'zip' => '75015', 'lat' => 48.8422, 'lng' => 2.2945],
        ['city' => 'Paris 8e', 'zip' => '75008', 'lat' => 48.8744, 'lng' => 2.3106],
        ['city' => 'Lyon 2e', 'zip' => '69002', 'lat' => 45.7578, 'lng' => 4.8320],
        ['city' => 'Lyon 7e', 'zip' => '69007', 'lat' => 45.7485, 'lng' => 4.8357],
        ['city' => 'Marseille 6e', 'zip' => '13006', 'lat' => 43.2887, 'lng' => 5.3811],
        ['city' => 'Bordeaux', 'zip' => '33000', 'lat' => 44.8378, 'lng' => -0.5792],
        ['city' => 'Strasbourg', 'zip' => '67000', 'lat' => 48.5734, 'lng' => 7.7521],
        ['city' => 'Nantes', 'zip' => '44000', 'lat' => 47.2184, 'lng' => -1.5536],
        ['city' => 'Grenoble', 'zip' => '38000', 'lat' => 45.1885, 'lng' => 5.7245],
        ['city' => 'Lille', 'zip' => '59000', 'lat' => 50.6292, 'lng' => 3.0573],
        ['city' => 'Montpellier', 'zip' => '34000', 'lat' => 43.6108, 'lng' => 3.8767],
        ['city' => 'Toulouse', 'zip' => '31000', 'lat' => 43.6047, 'lng' => 1.4442],
        ['city' => 'Nice', 'zip' => '06000', 'lat' => 43.7102, 'lng' => 7.2620],
        ['city' => 'Rennes', 'zip' => '35000', 'lat' => 48.1173, 'lng' => -1.6778],
        ['city' => 'Versailles', 'zip' => '78000', 'lat' => 48.8014, 'lng' => 2.1301],
        ['city' => 'La Roche-sur-Yon', 'zip' => '85000', 'lat' => 46.6706, 'lng' => -1.4268],
        ['city' => 'Annecy', 'zip' => '74000', 'lat' => 45.8992, 'lng' => 6.1294],
        ['city' => 'Aix-en-Provence', 'zip' => '13100', 'lat' => 43.5297, 'lng' => 5.4474],
        ['city' => 'Rouen', 'zip' => '76000', 'lat' => 49.4432, 'lng' => 1.0999],
    ];

    private const ALL_FEATURES = [
        PartnerFeatureKey::CAMPAIGN_PROSPECTION,
        PartnerFeatureKey::CAMPAIGN_FIDELISATION,
        PartnerFeatureKey::CAMPAIGN_COMPTAGE,
        PartnerFeatureKey::SHOPS,
        PartnerFeatureKey::SMS_TEMPLATES,
        PartnerFeatureKey::SHORT_URLS,
        PartnerFeatureKey::PAYMENT,
        PartnerFeatureKey::LOCATION_POSTCODE,
        PartnerFeatureKey::LOCATION_GEOLOC,
        PartnerFeatureKey::LOCATION_IRIS,
        PartnerFeatureKey::DEMO_MODE,
        PartnerFeatureKey::ANALYTICS_PROSPECTION,
        PartnerFeatureKey::ANALYTICS_FIDELISATION,
    ];

    private const BASIC_FEATURES = [
        PartnerFeatureKey::CAMPAIGN_PROSPECTION,
        PartnerFeatureKey::SHOPS,
        PartnerFeatureKey::LOCATION_POSTCODE,
        PartnerFeatureKey::ANALYTICS_PROSPECTION,
        PartnerFeatureKey::DEMO_MODE,
    ];

    private const MEDIUM_FEATURES = [
        PartnerFeatureKey::CAMPAIGN_PROSPECTION,
        PartnerFeatureKey::CAMPAIGN_FIDELISATION,
        PartnerFeatureKey::SHOPS,
        PartnerFeatureKey::SMS_TEMPLATES,
        PartnerFeatureKey::SHORT_URLS,
        PartnerFeatureKey::LOCATION_POSTCODE,
        PartnerFeatureKey::LOCATION_GEOLOC,
        PartnerFeatureKey::DEMO_MODE,
        PartnerFeatureKey::ANALYTICS_PROSPECTION,
    ];

    private const INACTIVE_FEATURES = [
        PartnerFeatureKey::CAMPAIGN_PROSPECTION,
        PartnerFeatureKey::SHOPS,
        PartnerFeatureKey::LOCATION_POSTCODE,
    ];

    public function run(): void
    {
        $routers = Router::all()->keyBy('name');

        foreach (self::PARTNERS as $key => $data) {
            $profile = explode('_', $key)[0]; // large, medium, small, inactive

            $partner = Partner::factory()->create([
                'name' => $data['name'],
                'code' => $data['code'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'address' => $data['address'],
                'city' => $data['city'],
                'zip_code' => $data['zip_code'],
                'is_active' => $profile !== 'inactive',
                'euro_credits' => $this->creditsForProfile($profile),
                'router_id' => $this->routerForProfile($profile, $routers)?->id,
                'activity_type' => $this->activityTypeForKey($key),
            ]);

            $this->createUsers($partner, $profile);
            $this->createShops($partner, $profile);
            $this->createFeatures($partner, $profile);
            $this->createPricing($partner, $profile);
        }
    }

    private function activityTypeForKey(string $key): ?string
    {
        return match ($key) {
            'large_1' => 'boulangerie',
            'large_2' => 'automobile',
            'large_3' => 'immobilier',
            'medium_1' => 'restauration',
            'medium_2' => 'bien-etre',
            'medium_3' => 'jardinerie',
            'medium_4' => 'optique',
            'medium_5' => 'sport',
            'small_1' => 'coiffure',
            'small_2' => 'pressing',
            'small_3' => 'fleuriste',
            'small_4' => 'boucherie',
            'small_5' => 'tabac',
            default => null,
        };
    }

    private function creditsForProfile(string $profile): string
    {
        return match ($profile) {
            'large' => (string) fake()->randomFloat(2, 500, 1500),
            'medium' => (string) fake()->randomFloat(2, 100, 400),
            'small' => (string) fake()->randomFloat(2, 20, 100),
            'inactive' => '0.00',
        };
    }

    /** @param \Illuminate\Support\Collection<string, Router> $routers */
    private function routerForProfile(string $profile, $routers): ?Router
    {
        return match ($profile) {
            'large' => $routers->random(),
            'medium' => $routers->get('infobip'),
            'small' => $routers->get('highconnexion'),
            'inactive' => null,
        };
    }

    private function createUsers(Partner $partner, string $profile): void
    {
        $counts = match ($profile) {
            'large' => ['partner' => 1, 'merchant' => 2, 'employee' => fake()->numberBetween(1, 2)],
            'medium' => ['partner' => 1, 'merchant' => fake()->numberBetween(1, 2), 'employee' => 0],
            'small' => ['partner' => 1, 'merchant' => 0, 'employee' => 0],
            'inactive' => ['partner' => 1, 'merchant' => 0, 'employee' => 0],
        };

        foreach ($counts as $role => $count) {
            for ($i = 0; $i < $count; $i++) {
                $user = User::factory()->forPartner($partner)->create();
                $user->assignRole($role);
            }
        }
    }

    private function createShops(Partner $partner, string $profile): void
    {
        $count = match ($profile) {
            'large' => fake()->numberBetween(8, 10),
            'medium' => fake()->numberBetween(3, 5),
            'small' => fake()->numberBetween(1, 2),
            'inactive' => fake()->numberBetween(0, 1),
        };

        $locations = collect(self::FRENCH_LOCATIONS)->shuffle()->take($count);

        foreach ($locations as $loc) {
            Shop::factory()->forPartner($partner)->create([
                'name' => $partner->name.' — '.$loc['city'],
                'city' => $loc['city'],
                'zip_code' => $loc['zip'],
                'latitude' => $loc['lat'],
                'longitude' => $loc['lng'],
            ]);
        }
    }

    private function createFeatures(Partner $partner, string $profile): void
    {
        $features = match ($profile) {
            'large' => self::ALL_FEATURES,
            'medium' => self::MEDIUM_FEATURES,
            'small' => self::BASIC_FEATURES,
            'inactive' => self::INACTIVE_FEATURES,
        };

        foreach ($features as $featureKey) {
            PartnerFeature::create([
                'partner_id' => $partner->id,
                'key' => $featureKey,
                'is_enabled' => true,
            ]);
        }
    }

    private function createPricing(Partner $partner, string $profile): void
    {
        if ($profile === 'inactive') {
            return;
        }

        // Default tier for everyone
        PartnerPricing::factory()->forPartner($partner)->default()->create([
            'name' => 'Standard',
            'volume_min' => 0,
            'volume_max' => 5000,
            'router_price' => 0.0350,
            'data_price' => 0.0120,
            'ci_price' => 0.0060,
        ]);

        if ($profile === 'large' || $profile === 'medium') {
            PartnerPricing::factory()->forPartner($partner)->create([
                'name' => 'Volume',
                'volume_min' => 5001,
                'volume_max' => 20000,
                'router_price' => 0.0280,
                'data_price' => 0.0090,
                'ci_price' => 0.0045,
            ]);
        }

        if ($profile === 'large') {
            PartnerPricing::factory()->forPartner($partner)->create([
                'name' => 'Premium',
                'volume_min' => 20001,
                'volume_max' => null,
                'router_price' => 0.0220,
                'data_price' => 0.0070,
                'ci_price' => 0.0035,
            ]);
        }
    }
}
