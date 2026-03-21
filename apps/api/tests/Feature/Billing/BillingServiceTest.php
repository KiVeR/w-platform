<?php

declare(strict_types=1);

use App\Enums\BillingMode;
use App\Enums\BillingStatus;
use App\Enums\LifecycleStatus;
use App\Models\Demande;
use App\Models\Operation;
use App\Models\Partner;
use App\Services\Production\BillingService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Log;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->billingService = app(BillingService::class);
});

describe('BillingService', function (): void {
    it('bills prepaid operation with debit and transitions to PREPAID', function (): void {
        $partner = Partner::factory()->create([
            'euro_credits' => '500.00',
            'billing_mode' => BillingMode::PREPAID,
        ]);

        $demande = Demande::factory()->forPartner($partner)->create();

        $operation = Operation::factory()->loc()->forDemande($demande)->create([
            'lifecycle_status' => LifecycleStatus::DELIVERED,
            'billing_status'   => BillingStatus::PENDING,
            'total_price'      => 100.00,
            'unit_price'       => 0.05,
        ]);

        $this->billingService->billOnDelivery($operation);

        $operation->refresh();
        $partner->refresh();

        expect($operation->billing_status)->toBe(BillingStatus::PREPAID);
        expect((float) $partner->euro_credits)->toBe(400.00);
    });

    it('skips non-billable operation', function (): void {
        $partner = Partner::factory()->create([
            'euro_credits' => '500.00',
            'billing_mode' => BillingMode::PREPAID,
        ]);

        $demande = Demande::factory()->forPartner($partner)->create();

        $operation = Operation::factory()->enrich()->forDemande($demande)->create([
            'lifecycle_status' => LifecycleStatus::DELIVERED,
        ]);

        $this->billingService->billOnDelivery($operation);

        $partner->refresh();
        expect((float) $partner->euro_credits)->toBe(500.00);
    });

    it('skips already billed operation', function (): void {
        $partner = Partner::factory()->create([
            'euro_credits' => '500.00',
            'billing_mode' => BillingMode::PREPAID,
        ]);

        $demande = Demande::factory()->forPartner($partner)->create();

        $operation = Operation::factory()->loc()->forDemande($demande)->create([
            'lifecycle_status' => LifecycleStatus::DELIVERED,
            'billing_status'   => BillingStatus::PREPAID,
            'total_price'      => 100.00,
        ]);

        $this->billingService->billOnDelivery($operation);

        $partner->refresh();
        expect((float) $partner->euro_credits)->toBe(500.00);
    });

    it('logs for immediate mode without deducting', function (): void {
        Log::spy();

        $partner = Partner::factory()->create([
            'euro_credits' => '500.00',
            'billing_mode' => BillingMode::IMMEDIATE,
        ]);

        $demande = Demande::factory()->forPartner($partner)->create();

        $operation = Operation::factory()->loc()->forDemande($demande)->create([
            'lifecycle_status' => LifecycleStatus::DELIVERED,
            'billing_status'   => BillingStatus::PENDING,
            'total_price'      => 100.00,
            'unit_price'       => 0.05,
        ]);

        $this->billingService->billOnDelivery($operation);

        Log::shouldHaveReceived('info')
            ->withArgs(fn (string $msg) => str_contains($msg, 'immediate not yet implemented'))
            ->once();

        $partner->refresh();
        expect((float) $partner->euro_credits)->toBe(500.00);
    });

    it('logs for end_of_month mode without deducting', function (): void {
        Log::spy();

        $partner = Partner::factory()->create([
            'euro_credits' => '500.00',
            'billing_mode' => BillingMode::END_OF_MONTH,
        ]);

        $demande = Demande::factory()->forPartner($partner)->create();

        $operation = Operation::factory()->loc()->forDemande($demande)->create([
            'lifecycle_status' => LifecycleStatus::DELIVERED,
            'billing_status'   => BillingStatus::PENDING,
            'total_price'      => 100.00,
            'unit_price'       => 0.05,
        ]);

        $this->billingService->billOnDelivery($operation);

        Log::shouldHaveReceived('info')
            ->withArgs(fn (string $msg) => str_contains($msg, 'end_of_month not yet implemented'))
            ->once();

        $partner->refresh();
        expect((float) $partner->euro_credits)->toBe(500.00);
    });

    it('bills prepaid with zero amount still transitions', function (): void {
        $partner = Partner::factory()->create([
            'euro_credits' => '500.00',
            'billing_mode' => BillingMode::PREPAID,
        ]);

        $demande = Demande::factory()->forPartner($partner)->create();

        $operation = Operation::factory()->loc()->forDemande($demande)->create([
            'lifecycle_status' => LifecycleStatus::DELIVERED,
            'billing_status'   => BillingStatus::PENDING,
            'total_price'      => 0,
            'unit_price'       => 0.05,
        ]);

        $this->billingService->billOnDelivery($operation);

        $operation->refresh();
        expect($operation->billing_status)->toBe(BillingStatus::PREPAID);
    });
});
