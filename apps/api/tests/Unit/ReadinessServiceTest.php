<?php

declare(strict_types=1);

use App\DTOs\ChecklistItem;
use App\Enums\BillingStatus;
use App\Enums\CreativeStatus;
use App\Models\Operation;
use App\Models\User;
use App\Services\Production\ReadinessService;
use Database\Seeders\RolesAndPermissionsSeeder;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->service = app(ReadinessService::class);
});

describe('ReadinessService', function (): void {
    it('reports LOC operation as ready when all checks pass', function (): void {
        $user = User::factory()->create();
        $operation = Operation::factory()->loc()->create([
            'targeting' => ['departments' => ['75']],
            'message' => 'Hello SMS',
            'volume_estimated' => 1000,
            'unit_price' => 0.05,
            'assigned_to' => $user->id,
            'creative_status' => CreativeStatus::APPROVED,
        ]);

        expect($this->service->isReady($operation))->toBeTrue();
        expect($this->service->getBlockingItems($operation))->toBeEmpty();
    });

    it('reports LOC operation as not ready when targeting is missing', function (): void {
        $user = User::factory()->create();
        $operation = Operation::factory()->loc()->create([
            'targeting' => null,
            'message' => 'Hello SMS',
            'volume_estimated' => 1000,
            'unit_price' => 0.05,
            'assigned_to' => $user->id,
            'creative_status' => CreativeStatus::APPROVED,
        ]);

        expect($this->service->isReady($operation))->toBeFalse();

        $blocking = $this->service->getBlockingItems($operation);
        expect($blocking)->toHaveCount(1);
        expect($blocking[0]->name)->toBe('targeting');
    });

    it('reports LOC operation as not ready when creative is not approved', function (): void {
        $user = User::factory()->create();
        $operation = Operation::factory()->loc()->create([
            'targeting' => ['departments' => ['75']],
            'message' => 'Hello SMS',
            'volume_estimated' => 1000,
            'unit_price' => 0.05,
            'assigned_to' => $user->id,
            'creative_status' => CreativeStatus::PENDING,
        ]);

        expect($this->service->isReady($operation))->toBeFalse();

        $blocking = $this->service->getBlockingItems($operation);
        $names = array_map(fn (ChecklistItem $i) => $i->name, $blocking);
        expect($names)->toContain('creative');
    });

    it('marks targeting as NA for FID operations', function (): void {
        $user = User::factory()->create();
        $operation = Operation::factory()->fid()->create([
            'message' => 'Hello FID',
            'unit_price' => 0.04,
            'assigned_to' => $user->id,
        ]);

        $checklist = $this->service->getChecklist($operation);
        $targeting = collect($checklist)->firstWhere('name', 'targeting');

        expect($targeting)->not->toBeNull();
        expect($targeting->status)->toBe('na');
        expect($targeting->isNotApplicable())->toBeTrue();
    });

    it('only requires assignment for ENRICH operations', function (): void {
        $user = User::factory()->create();
        $operation = Operation::factory()->enrich()->create([
            'assigned_to' => $user->id,
        ]);

        $checklist = $this->service->getChecklist($operation);
        expect($checklist)->toHaveCount(1);
        expect($checklist[0]->name)->toBe('assigned');
        expect($this->service->isReady($operation))->toBeTrue();
    });

    it('requires parent for REP operations', function (): void {
        $operation = Operation::factory()->rep()->create([
            'parent_operation_id' => null,
            'message' => 'Hello REP',
            'assigned_to' => User::factory()->create()->id,
        ]);

        expect($this->service->isReady($operation))->toBeFalse();

        $blocking = $this->service->getBlockingItems($operation);
        $names = array_map(fn (ChecklistItem $i) => $i->name, $blocking);
        expect($names)->toContain('parent');
    });

    it('passes REP when parent exists', function (): void {
        $parent = Operation::factory()->loc()->create();
        $user = User::factory()->create();
        $operation = Operation::factory()->rep()->forDemande($parent->demande)->create([
            'parent_operation_id' => $parent->id,
            'message' => 'Hello REP',
            'assigned_to' => $user->id,
        ]);

        $blocking = $this->service->getBlockingItems($operation);
        $names = array_map(fn (ChecklistItem $i) => $i->name, $blocking);
        expect($names)->not->toContain('parent');
    });

    it('returns correct blocking items for unready operation', function (): void {
        $operation = Operation::factory()->loc()->create([
            'targeting' => null,
            'message' => null,
            'volume_estimated' => 0,
            'unit_price' => 0,
            'assigned_to' => null,
            'creative_status' => CreativeStatus::PENDING,
        ]);

        $blocking = $this->service->getBlockingItems($operation);
        expect(count($blocking))->toBeGreaterThanOrEqual(5);
    });

    it('ChecklistItem toArray works correctly', function (): void {
        $item = new ChecklistItem('test', 'pass', 'OK');

        expect($item->toArray())->toBe([
            'name' => 'test',
            'status' => 'pass',
            'message' => 'OK',
        ]);
        expect($item->passes())->toBeTrue();
        expect($item->isBlocking())->toBeFalse();
        expect($item->isNotApplicable())->toBeFalse();
    });

    it('reports FILTRE operation only needs assignment', function (): void {
        $operation = Operation::factory()->filtre()->create([
            'assigned_to' => null,
        ]);

        expect($this->service->isReady($operation))->toBeFalse();

        $operation->assigned_to = User::factory()->create()->id;
        expect($this->service->isReady($operation))->toBeTrue();
    });
});

describe('Operation helpers', function (): void {
    it('isReadyForScheduling delegates to ReadinessService', function (): void {
        $user = User::factory()->create();
        $operation = Operation::factory()->loc()->create([
            'targeting' => ['departments' => ['75']],
            'message' => 'Hello',
            'volume_estimated' => 1000,
            'unit_price' => 0.05,
            'assigned_to' => $user->id,
            'creative_status' => CreativeStatus::APPROVED,
        ]);

        expect($operation->isReadyForScheduling())->toBeTrue();
    });

    it('isBillable returns true for pending billable type', function (): void {
        $operation = Operation::factory()->loc()->create([
            'billing_status' => BillingStatus::PENDING,
        ]);

        expect($operation->isBillable())->toBeTrue();
    });

    it('isBillable returns false for non-billable type', function (): void {
        $operation = Operation::factory()->enrich()->create();

        expect($operation->isBillable())->toBeFalse();
    });

    it('isBillable returns false when already billed', function (): void {
        $operation = Operation::factory()->loc()->create([
            'billing_status' => BillingStatus::PREPAID,
        ]);

        expect($operation->isBillable())->toBeFalse();
    });
});
