<?php

declare(strict_types=1);

use App\Enums\BillingMode;
use App\Enums\BillingStatus;
use App\Enums\LifecycleStatus;
use App\Models\Demande;
use App\Models\Operation;
use App\Models\Partner;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

describe('operations:auto-bill', function (): void {
    it('bills delivered operations with prepaid billing mode', function (): void {
        $partner = Partner::factory()->create([
            'billing_mode' => BillingMode::PREPAID,
            'euro_credits' => '1000.00',
        ]);
        $demande = Demande::factory()->forPartner($partner)->create();
        $operation = Operation::factory()->loc()->forDemande($demande)->create([
            'lifecycle_status' => LifecycleStatus::DELIVERED,
            'billing_status' => BillingStatus::PENDING,
            'total_price' => 50.00,
        ]);

        $this->artisan('operations:auto-bill')->assertSuccessful();

        expect($operation->refresh()->billing_status)->toBe(BillingStatus::PREPAID);
    });

    it('skips operations that are not delivered', function (): void {
        $partner = Partner::factory()->create([
            'billing_mode' => BillingMode::PREPAID,
            'euro_credits' => '1000.00',
        ]);
        $demande = Demande::factory()->forPartner($partner)->create();
        $operation = Operation::factory()->loc()->forDemande($demande)->create([
            'lifecycle_status' => LifecycleStatus::PROCESSING,
            'billing_status' => BillingStatus::PENDING,
            'total_price' => 50.00,
        ]);

        $this->artisan('operations:auto-bill')->assertSuccessful();

        expect($operation->refresh()->billing_status)->toBe(BillingStatus::PENDING);
    });

    it('skips operations with non-pending billing status', function (): void {
        $partner = Partner::factory()->create([
            'billing_mode' => BillingMode::PREPAID,
            'euro_credits' => '1000.00',
        ]);
        $demande = Demande::factory()->forPartner($partner)->create();
        $operation = Operation::factory()->loc()->forDemande($demande)->create([
            'lifecycle_status' => LifecycleStatus::DELIVERED,
            'billing_status' => BillingStatus::INVOICED,
            'total_price' => 50.00,
        ]);

        $this->artisan('operations:auto-bill')->assertSuccessful();

        expect($operation->refresh()->billing_status)->toBe(BillingStatus::INVOICED);
    });

    it('deducts credits from partner balance on prepaid billing', function (): void {
        $partner = Partner::factory()->create([
            'billing_mode' => BillingMode::PREPAID,
            'euro_credits' => '500.00',
        ]);
        $demande = Demande::factory()->forPartner($partner)->create();
        Operation::factory()->loc()->forDemande($demande)->create([
            'lifecycle_status' => LifecycleStatus::DELIVERED,
            'billing_status' => BillingStatus::PENDING,
            'total_price' => 200.00,
        ]);

        $this->artisan('operations:auto-bill')->assertSuccessful();

        expect((float) $partner->refresh()->euro_credits)->toBe(300.00);
    });

    it('skips non-billable operation types', function (): void {
        $partner = Partner::factory()->create([
            'billing_mode' => BillingMode::PREPAID,
            'euro_credits' => '1000.00',
        ]);
        $demande = Demande::factory()->forPartner($partner)->create();

        // ENRICH type does not require billing — model boot forces billing_status to NOT_APPLICABLE
        $operation = Operation::factory()->enrich()->forDemande($demande)->create([
            'lifecycle_status' => LifecycleStatus::DELIVERED,
            'total_price' => 50.00,
        ]);

        // Verify the model boot set it to NOT_APPLICABLE for non-billable type
        expect($operation->billing_status)->toBe(BillingStatus::NOT_APPLICABLE);

        $this->artisan('operations:auto-bill')->assertSuccessful();

        // Still NOT_APPLICABLE — command only touches PENDING + DELIVERED
        expect($operation->refresh()->billing_status)->toBe(BillingStatus::NOT_APPLICABLE);
    });

    it('does not bill zero-price operations', function (): void {
        $partner = Partner::factory()->create([
            'billing_mode' => BillingMode::PREPAID,
            'euro_credits' => '500.00',
        ]);
        $demande = Demande::factory()->forPartner($partner)->create();

        $operation = Operation::factory()->loc()->forDemande($demande)->create([
            'lifecycle_status' => LifecycleStatus::DELIVERED,
            'total_price' => 0,
        ]);

        $this->artisan('operations:auto-bill')->assertSuccessful();

        // Still transitions to PREPAID even with 0 amount (no deduction needed)
        expect($operation->refresh()->billing_status)->toBe(BillingStatus::PREPAID);
        expect((float) $partner->refresh()->euro_credits)->toBe(500.00);
    });
});
