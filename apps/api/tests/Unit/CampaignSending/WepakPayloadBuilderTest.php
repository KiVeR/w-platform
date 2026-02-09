<?php

declare(strict_types=1);

use App\Models\Campaign;
use App\Models\InterestGroup;
use App\Models\Partner;
use App\Models\User;
use App\Services\CampaignSending\WepakPayloadBuilder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->builder = new WepakPayloadBuilder;
});

it('builds prospection payload with targeting', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => 'Promo -20% STOP 36111',
        'sender' => 'MARQUE',
        'volume_estimated' => 1000,
        'targeting' => [
            'gender' => 'M',
            'age_min' => 25,
            'age_max' => 45,
            'geo' => [
                'postcodes' => [
                    ['code' => '75001', 'volume' => 500],
                    ['code' => '75002', 'volume' => 500],
                ],
            ],
        ],
    ]);

    $payload = $this->builder->buildProspectionPayload($campaign);

    expect($payload['query'])->toBe('calcule_groupe_localite')
        ->and($payload['genre'])->toBe('homme')
        ->and($payload['age_min'])->toBe(25)
        ->and($payload['age_max'])->toBe(45)
        ->and($payload['volume'])->toBe(1000)
        ->and($payload['content'])->toBe('Promo -20% STOP 36111')
        ->and($payload['expediteur'])->toBe('MARQUE')
        ->and($payload['is_split_volume'])->toBeTrue()
        ->and($payload['liste_cp_dept'])->toHaveCount(2)
        ->and($payload['liste_cp_dept'][0]['label'])->toBe('75001')
        ->and($payload['liste_cp_dept'][0]['type'])->toBe('cp');
});

it('builds estimate payload without message fields', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => 'Should not appear',
        'sender' => 'MARQUE',
        'volume_estimated' => 500,
        'targeting' => [
            'gender' => 'F',
            'geo' => ['postcodes' => [['code' => '69001', 'volume' => 500]]],
        ],
    ]);

    $payload = $this->builder->buildEstimatePayload($campaign);

    expect($payload['query'])->toBe('calcule_groupe_localite')
        ->and($payload['genre'])->toBe('femme')
        ->and($payload)->not->toHaveKey('content')
        ->and($payload)->not->toHaveKey('expediteur')
        ->and($payload)->not->toHaveKey('idrouteur');
});

it('maps gender correctly', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    $makePayload = function (string $gender) use ($partner, $user): array {
        $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
            'targeting' => ['gender' => $gender, 'geo' => ['postcodes' => []]],
        ]);

        return (new WepakPayloadBuilder)->buildEstimatePayload($campaign);
    };

    expect($makePayload('M')['genre'])->toBe('homme')
        ->and($makePayload('F')['genre'])->toBe('femme')
        ->and($makePayload('mixed')['genre'])->toBe('mixte');
});

it('returns null age for boundary values', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'targeting' => [
            'age_min' => 18,
            'age_max' => 75,
            'geo' => ['postcodes' => []],
        ],
    ]);

    $payload = $this->builder->buildEstimatePayload($campaign);

    expect($payload['age_min'])->toBeNull()
        ->and($payload['age_max'])->toBeNull();
});

it('handles null targeting gracefully', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'targeting' => null,
    ]);

    $payload = $this->builder->buildEstimatePayload($campaign);

    expect($payload['liste_cp_dept'])->toBeEmpty()
        ->and($payload['genre'])->toBe('mixte');
});

it('includes blacklist in send payload', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => 'Test',
        'sender' => 'BRAND',
        'targeting' => [
            'blacklist_id' => 'wp-42',
            'campaign_blacklist_id' => '99',
            'geo' => ['postcodes' => []],
        ],
    ]);

    $payload = $this->builder->buildProspectionPayload($campaign);

    expect($payload['repoussoir'])->toBe(1)
        ->and($payload['id_fichier_repoussoir_statique'])->toBe('wp-42')
        ->and($payload['liste_repoussoir_campagne'])->toBe('99');
});

it('includes interest groups in send payload', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => 'Test',
        'sender' => 'BRAND',
        'targeting' => ['geo' => ['postcodes' => []]],
    ]);

    $group = InterestGroup::factory()->create(['label' => 'Sport']);
    $campaign->interestGroups()->attach($group->id, ['index' => 0, 'operator' => 'AND']);
    $campaign->load('interestGroups');

    $payload = $this->builder->buildProspectionPayload($campaign);

    expect($payload['famille_qualif'])->toHaveCount(1)
        ->and($payload['famille_qualif'][0]['operator'])->toBe('AND')
        ->and($payload['group_qualif'][0]['name'])->toBe('Sport');
});

it('guesses location type from code length', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'targeting' => [
            'geo' => [
                'postcodes' => [
                    ['code' => '75001', 'volume' => 100],
                    ['code' => '75', 'volume' => 200],
                    ['code' => '751010101', 'volume' => 50],
                ],
            ],
        ],
    ]);

    $payload = $this->builder->buildEstimatePayload($campaign);

    expect($payload['liste_cp_dept'][0]['type'])->toBe('cp')
        ->and($payload['liste_cp_dept'][1]['type'])->toBe('dept')
        ->and($payload['liste_cp_dept'][2]['type'])->toBe('iris');
});

it('detects double sms', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    $short = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => 'Short message',
        'sender' => 'BRAND',
        'targeting' => ['geo' => ['postcodes' => []]],
    ]);

    $long = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'message' => str_repeat('A', 161),
        'sender' => 'BRAND',
        'targeting' => ['geo' => ['postcodes' => []]],
    ]);

    expect($this->builder->buildProspectionPayload($short)['is_double'])->toBeFalse()
        ->and($this->builder->buildProspectionPayload($long)['is_double'])->toBeTrue();
});
