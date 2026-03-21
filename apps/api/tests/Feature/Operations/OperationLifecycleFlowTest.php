<?php

declare(strict_types=1);

use App\Enums\BillingMode;
use App\Enums\BillingStatus;
use App\Enums\CampaignStatus;
use App\Enums\CreativeStatus;
use App\Enums\LifecycleStatus;
use App\Models\Campaign;
use App\Models\Demande;
use App\Models\Operation;
use App\Models\Partner;
use App\Models\User;
use App\Services\Production\ReadinessService;
use App\Services\StateMachine\TransitionService;
use Carbon\Carbon;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('completes the full MVP lifecycle flow', function (): void {
    // Fix time to within sending window
    Carbon::setTestNow(Carbon::create(2026, 3, 21, 10, 0, 0, 'Europe/Paris'));

    $transitionService = app(TransitionService::class);
    $readinessService = app(ReadinessService::class);

    // 1. Create partner with credits, demande, and LOC operation
    $partner = Partner::factory()->create([
        'euro_credits' => '1000.00',
        'billing_mode' => BillingMode::PREPAID,
    ]);

    $user = User::factory()->create(['partner_id' => $partner->id]);
    $demande = Demande::factory()->forPartner($partner)->create();

    $operation = Operation::factory()->loc()->forDemande($demande)->create();

    expect($operation->lifecycle_status)->toBe(LifecycleStatus::DRAFT);

    // 2. Fill in all required fields for readiness
    $operation->update([
        'targeting'        => ['departments' => ['75']],
        'message'          => 'Promo -20% ce weekend !',
        'volume_estimated' => 5000,
        'unit_price'       => 0.04,
        'total_price'      => 200.00,
        'assigned_to'      => $user->id,
        'creative_status'  => CreativeStatus::APPROVED,
    ]);

    // 3. Verify readiness
    expect($readinessService->isReady($operation))->toBeTrue();
    expect($operation->isReadyForScheduling())->toBeTrue();
    expect($operation->isBillable())->toBeTrue();

    // 4. Transition draft -> preparing -> ready -> scheduled
    $operation = $transitionService->applyTransition($operation, 'lifecycle', LifecycleStatus::PREPARING);
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::PREPARING);

    $operation = $transitionService->applyTransition($operation, 'lifecycle', LifecycleStatus::READY);
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::READY);

    $operation->update(['scheduled_at' => now()->subMinute()]);
    $operation = $transitionService->applyTransition($operation, 'lifecycle', LifecycleStatus::SCHEDULED);
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::SCHEDULED);

    // 5. Run AutoTransition -> processing (within sending window)
    $this->artisan('operations:auto-transition')->assertSuccessful();
    $operation->refresh();
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::PROCESSING);

    // 6. Create a campaign that is "sent" — simulate delivery
    Campaign::factory()->sent()->create([
        'operation_id' => $operation->id,
        'partner_id'   => $partner->id,
    ]);

    // 7. Run AutoTransition -> delivered
    $this->artisan('operations:auto-transition')->assertSuccessful();
    $operation->refresh();
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::DELIVERED);

    // Manually set delivered_at (normally set by transition side-effect or business logic)
    $operation->update(['delivered_at' => now()]);

    // 8. Run AutoBill -> billing PENDING -> PREPAID
    $this->artisan('operations:auto-bill')->assertSuccessful();
    $operation->refresh();
    $partner->refresh();

    expect($operation->billing_status)->toBe(BillingStatus::PREPAID);
    expect((float) $partner->euro_credits)->toBe(800.00);

    // 9. Advance time 73h -> Run AutoTransition -> completed
    Carbon::setTestNow(Carbon::create(2026, 3, 24, 11, 0, 0, 'Europe/Paris'));

    $this->artisan('operations:auto-transition')->assertSuccessful();
    $operation->refresh();
    expect($operation->lifecycle_status)->toBe(LifecycleStatus::COMPLETED);

    // 10. Verify audit trail
    $transitions = $operation->transitions()->orderBy('created_at')->get();
    $lifecycleTransitions = $transitions->where('track', 'lifecycle');

    $statePath = $lifecycleTransitions->pluck('to_state')->toArray();
    expect($statePath)->toBe([
        'preparing',
        'ready',
        'scheduled',
        'processing',
        'delivered',
        'completed',
    ]);

    // Verify billing transition is recorded
    $billingTransitions = $transitions->where('track', 'billing');
    expect($billingTransitions)->toHaveCount(1);
    expect($billingTransitions->first()->to_state)->toBe('prepaid');

    Carbon::setTestNow();
});
