<?php

declare(strict_types=1);

use App\Enums\LifecycleStatus;
use App\Models\Campaign;
use App\Models\Operation;
use Carbon\Carbon;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

describe('operations:auto-transition', function (): void {
    it('transitions scheduled to processing when scheduled_at has passed', function (): void {
        Carbon::setTestNow(Carbon::create(2026, 3, 21, 10, 0, 0, 'Europe/Paris'));

        $operation = Operation::factory()->loc()->create([
            'lifecycle_status' => LifecycleStatus::SCHEDULED,
            'scheduled_at' => now()->subMinutes(5),
        ]);

        $this->artisan('operations:auto-transition')->assertSuccessful();

        expect($operation->refresh()->lifecycle_status)->toBe(LifecycleStatus::PROCESSING);

        Carbon::setTestNow();
    });

    it('does not transition scheduled outside sending window', function (): void {
        Carbon::setTestNow(Carbon::create(2026, 3, 21, 3, 0, 0, 'Europe/Paris'));

        $operation = Operation::factory()->loc()->create([
            'lifecycle_status' => LifecycleStatus::SCHEDULED,
            'scheduled_at' => now()->subMinutes(5),
        ]);

        $this->artisan('operations:auto-transition')->assertSuccessful();

        expect($operation->refresh()->lifecycle_status)->toBe(LifecycleStatus::SCHEDULED);

        Carbon::setTestNow();
    });

    it('does not transition scheduled with future scheduled_at', function (): void {
        Carbon::setTestNow(Carbon::create(2026, 3, 21, 10, 0, 0, 'Europe/Paris'));

        $operation = Operation::factory()->loc()->create([
            'lifecycle_status' => LifecycleStatus::SCHEDULED,
            'scheduled_at' => now()->addHour(),
        ]);

        $this->artisan('operations:auto-transition')->assertSuccessful();

        expect($operation->refresh()->lifecycle_status)->toBe(LifecycleStatus::SCHEDULED);

        Carbon::setTestNow();
    });

    it('transitions processing to delivered when campaign is sent', function (): void {
        $operation = Operation::factory()->loc()->create([
            'lifecycle_status' => LifecycleStatus::PROCESSING,
        ]);

        Campaign::factory()->sent()->create([
            'operation_id' => $operation->id,
            'partner_id' => $operation->demande->partner_id,
        ]);

        $this->artisan('operations:auto-transition')->assertSuccessful();

        expect($operation->refresh()->lifecycle_status)->toBe(LifecycleStatus::DELIVERED);
    });

    it('does not transition processing when campaign not sent', function (): void {
        $operation = Operation::factory()->loc()->create([
            'lifecycle_status' => LifecycleStatus::PROCESSING,
        ]);

        Campaign::factory()->sending()->create([
            'operation_id' => $operation->id,
            'partner_id' => $operation->demande->partner_id,
        ]);

        $this->artisan('operations:auto-transition')->assertSuccessful();

        expect($operation->refresh()->lifecycle_status)->toBe(LifecycleStatus::PROCESSING);
    });

    it('transitions delivered to completed after 72h', function (): void {
        $operation = Operation::factory()->loc()->create([
            'lifecycle_status' => LifecycleStatus::DELIVERED,
            'delivered_at' => now()->subHours(73),
        ]);

        $this->artisan('operations:auto-transition')->assertSuccessful();

        expect($operation->refresh()->lifecycle_status)->toBe(LifecycleStatus::COMPLETED);
    });

    it('does not transition delivered before 72h', function (): void {
        $operation = Operation::factory()->loc()->create([
            'lifecycle_status' => LifecycleStatus::DELIVERED,
            'delivered_at' => now()->subHours(10),
        ]);

        $this->artisan('operations:auto-transition')->assertSuccessful();

        expect($operation->refresh()->lifecycle_status)->toBe(LifecycleStatus::DELIVERED);
    });

    it('does not re-transition already terminal operations', function (): void {
        $operation = Operation::factory()->loc()->create([
            'lifecycle_status' => LifecycleStatus::COMPLETED,
        ]);

        $this->artisan('operations:auto-transition')->assertSuccessful();

        expect($operation->refresh()->lifecycle_status)->toBe(LifecycleStatus::COMPLETED);
    });
});
