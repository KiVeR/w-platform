<?php

declare(strict_types=1);

use App\Models\Demande;
use App\Models\Operation;
use App\Models\Partner;
use App\Models\User;

it('auto-generates ref_demande on create', function (): void {
    $demande = Demande::factory()->create();

    expect($demande->ref_demande)
        ->toBeString()
        ->toMatch('/^DEM-\d{6}-[A-Z0-9]{4}$/');
});

it('generates unique ref_demande for each demande', function (): void {
    $d1 = Demande::factory()->create();
    $d2 = Demande::factory()->create();

    expect($d1->ref_demande)->not->toBe($d2->ref_demande);
});

it('belongs to partner', function (): void {
    $partner = Partner::factory()->create();
    $demande = Demande::factory()->forPartner($partner)->create();

    expect($demande->partner->id)->toBe($partner->id);
});

it('has many operations', function (): void {
    $demande = Demande::factory()->create();
    Operation::factory()->count(3)->forDemande($demande)->create();

    expect($demande->operations)->toHaveCount(3);
});

it('scopeForUser restricts non-admin to own partner', function (): void {
    $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();

    Demande::factory()->forPartner($partner1)->create();
    Demande::factory()->forPartner($partner2)->create();

    $user = User::factory()->create(['partner_id' => $partner1->id]);
    $user->assignRole('partner');

    $results = Demande::forUser($user)->get();

    expect($results)->toHaveCount(1)
        ->and($results->first()->partner_id)->toBe($partner1->id);
});

it('scopeForUser lets admin see all demandes', function (): void {
    $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();

    Demande::factory()->forPartner($partner1)->create();
    Demande::factory()->forPartner($partner2)->create();

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $results = Demande::forUser($admin)->get();

    expect($results)->toHaveCount(2);
});
