<?php

declare(strict_types=1);

use App\Models\Campaign;
use App\Models\InterestGroup;
use App\Models\Partner;
use App\Models\User;
use App\Services\CampaignSending\WepakPayloadBuilder;
use App\Services\Targeting\Adapters\WepakTargetingAdapter;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->builder = new WepakPayloadBuilder(new WepakTargetingAdapter);
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
        ->and($payload['civilite'])->toBe('homme')
        ->and($payload['agemin'])->toBe(25)
        ->and($payload['agemax'])->toBe(45)
        ->and($payload['volume'])->toBe(1000)
        ->and($payload['content'])->toBe('Promo -20% STOP 36111')
        ->and($payload['expediteur'])->toBe('MARQUE')
        ->and($payload['is_split_volume'])->toBeTrue()
        ->and($payload['liste_cp_dept'])->toHaveCount(2)
        ->and($payload['liste_cp_dept'][0]['label'])->toBe('75001')
        ->and($payload['liste_cp_dept'][0])->toHaveKey('cp', '75001');
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
        ->and($payload['civilite'])->toBe('femme')
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

        return (new WepakPayloadBuilder(new WepakTargetingAdapter))->buildEstimatePayload($campaign);
    };

    expect($makePayload('M')['civilite'])->toBe('homme')
        ->and($makePayload('F')['civilite'])->toBe('femme')
        ->and($makePayload('mixed')['civilite'])->toBe('mixte');
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

    expect($payload['agemin'])->toBeNull()
        ->and($payload['agemax'])->toBeNull();
});

it('handles null targeting gracefully', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->create([
        'targeting' => null,
    ]);

    $payload = $this->builder->buildEstimatePayload($campaign);

    expect($payload['liste_cp_dept'])->toBeEmpty()
        ->and($payload['civilite'])->toBe('mixte');
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

    expect($payload['liste_cp_dept'][0])->toHaveKey('cp', '75001')
        ->and($payload['liste_cp_dept'][1])->toHaveKey('dept', '75')
        ->and($payload['liste_cp_dept'][2])->toHaveKey('iris', '751010101');
});

// ==================== DEMO PAYLOAD ====================

it('builds demo payload with query send_test', function (): void {
    $partner = Partner::factory()->create(['phone' => '+33600000000']);
    $user = User::factory()->forPartner($partner)->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->demo()->create([
        'message' => 'Test Demo',
        'sender' => 'BRAND',
    ]);

    $payload = $this->builder->buildDemoPayload($campaign);

    expect($payload['query'])->toBe('send_test')
        ->and($payload['content'])->toBe('Test Demo')
        ->and($payload['senderlabel'])->toBe('BRAND')
        ->and($payload['idcampagne'])->toBe($campaign->id);
});

it('builds demo payload with additional_phone', function (): void {
    $partner = Partner::factory()->create(['phone' => '+33600000000']);
    $user = User::factory()->forPartner($partner)->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->demo()->create([
        'message' => 'Test',
        'sender' => 'BRAND',
        'additional_phone' => '+33611111111',
    ]);

    $payload = $this->builder->buildDemoPayload($campaign);

    expect($payload['numero_commercant'])->toBe('+33611111111');
});

it('builds demo payload with fallback to partner phone', function (): void {
    $partner = Partner::factory()->create(['phone' => '+33600000000']);
    $user = User::factory()->forPartner($partner)->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->demo()->create([
        'message' => 'Test',
        'sender' => 'BRAND',
        'additional_phone' => null,
    ]);

    $payload = $this->builder->buildDemoPayload($campaign);

    expect($payload['numero_commercant'])->toBe('+33600000000');
});

it('builds demo payload without targeting fields', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    $campaign = Campaign::factory()->forPartner($partner)->forUser($user)->demo()->create([
        'message' => 'Test',
        'sender' => 'BRAND',
    ]);

    $payload = $this->builder->buildDemoPayload($campaign);

    expect($payload)->not->toHaveKey('volume')
        ->and($payload)->not->toHaveKey('liste_cp_dept')
        ->and($payload)->not->toHaveKey('civilite')
        ->and($payload)->not->toHaveKey('agemin')
        ->and($payload)->not->toHaveKey('agemax');
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
