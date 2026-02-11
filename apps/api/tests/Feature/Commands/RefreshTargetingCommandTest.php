<?php

declare(strict_types=1);

use App\Models\Campaign;
use App\Models\Department;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);

    Department::factory()->create(['code' => '75', 'name' => 'Paris']);
    Department::factory()->create(['code' => '69', 'name' => 'Rhône']);

    $this->partner = Partner::factory()->create();
    $this->user = User::factory()->forPartner($this->partner)->create();
});

it('refreshes targeting zones for draft campaigns', function (): void {
    Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'status' => 'draft',
        'targeting' => [
            'method' => 'department',
            'input' => ['method' => 'department', 'departments' => ['75'], 'postcodes' => []],
            'zones' => [['code' => '75', 'type' => 'department', 'label' => 'Old Label', 'volume' => 500]],
            'demographics' => null,
        ],
    ]);

    $this->artisan('targeting:refresh')
        ->assertSuccessful()
        ->expectsOutputToContain('Refreshed 1 campaigns');

    $campaign = Campaign::first();
    expect($campaign->targeting['zones'][0]['label'])->toBe('Paris')
        ->and($campaign->targeting['zones'][0]['volume'])->toBe(0);
});

it('refreshes targeting zones for scheduled campaigns', function (): void {
    Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'status' => 'scheduled',
        'targeting' => [
            'method' => 'department',
            'input' => ['method' => 'department', 'departments' => ['69'], 'postcodes' => []],
            'zones' => [['code' => '69', 'type' => 'department', 'label' => 'Old', 'volume' => 100]],
            'demographics' => null,
        ],
    ]);

    $this->artisan('targeting:refresh')
        ->assertSuccessful()
        ->expectsOutputToContain('Refreshed 1 campaigns');
});

it('skips sent campaigns', function (): void {
    Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'status' => 'sent',
        'targeting' => [
            'method' => 'department',
            'input' => ['method' => 'department', 'departments' => ['75'], 'postcodes' => []],
            'zones' => [['code' => '75', 'type' => 'department', 'label' => 'Old', 'volume' => 500]],
            'demographics' => null,
        ],
    ]);

    $this->artisan('targeting:refresh')
        ->assertSuccessful()
        ->expectsOutputToContain('Refreshed 0 campaigns');
});

it('skips campaigns with null targeting', function (): void {
    Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'status' => 'draft',
        'targeting' => null,
    ]);

    $this->artisan('targeting:refresh')
        ->assertSuccessful()
        ->expectsOutputToContain('Refreshed 0 campaigns');
});

it('reports count of refreshed campaigns', function (): void {
    Campaign::factory()->forPartner($this->partner)->forUser($this->user)->count(3)->create([
        'status' => 'draft',
        'targeting' => [
            'method' => 'department',
            'input' => ['method' => 'department', 'departments' => ['75', '69'], 'postcodes' => []],
            'zones' => [],
            'demographics' => null,
        ],
    ]);

    $this->artisan('targeting:refresh')
        ->assertSuccessful()
        ->expectsOutputToContain('Refreshed 3 campaigns');
});

it('resets volume_estimated to 0 after refresh', function (): void {
    Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'status' => 'draft',
        'volume_estimated' => 1000,
        'targeting' => [
            'method' => 'department',
            'input' => ['method' => 'department', 'departments' => ['75'], 'postcodes' => []],
            'zones' => [['code' => '75', 'type' => 'department', 'label' => 'Paris', 'volume' => 1000]],
            'demographics' => null,
        ],
    ]);

    $this->artisan('targeting:refresh')->assertSuccessful();

    $campaign = Campaign::first();
    expect($campaign->volume_estimated)->toBe(0);
});

it('supports dry-run mode', function (): void {
    Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'status' => 'draft',
        'volume_estimated' => 1000,
        'targeting' => [
            'method' => 'department',
            'input' => ['method' => 'department', 'departments' => ['75'], 'postcodes' => []],
            'zones' => [['code' => '75', 'type' => 'department', 'label' => 'Old', 'volume' => 500]],
            'demographics' => null,
        ],
    ]);

    $this->artisan('targeting:refresh --dry-run')
        ->assertSuccessful()
        ->expectsOutputToContain('[DRY-RUN]');

    $campaign = Campaign::first();
    expect($campaign->volume_estimated)->toBe(1000)
        ->and($campaign->targeting['zones'][0]['label'])->toBe('Old');
});
