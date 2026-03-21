<?php

declare(strict_types=1);

use App\Enums\BillingStatus;
use App\Enums\CreativeStatus;
use App\Enums\LifecycleStatus;
use App\Enums\OperationRoutingStatus;
use App\Enums\OperationType;
use App\Models\Demande;
use App\Models\Operation;
use App\Models\User;

it('defaults to draft lifecycle_status', function (): void {
    $operation = Operation::factory()->create();

    expect($operation->lifecycle_status)->toBe(LifecycleStatus::DRAFT);
});

it('initializes tracks for LOC (creative=pending, billing=pending, routing=pending)', function (): void {
    $operation = Operation::factory()->loc()->create();

    expect($operation->creative_status)->toBe(CreativeStatus::PENDING)
        ->and($operation->billing_status)->toBe(BillingStatus::PENDING)
        ->and($operation->routing_status)->toBe(OperationRoutingStatus::PENDING);
});

it('initializes tracks for ENRICH (creative=not_applicable, billing=not_applicable, routing=not_applicable)', function (): void {
    $operation = Operation::factory()->enrich()->create();

    expect($operation->creative_status)->toBe(CreativeStatus::NOT_APPLICABLE)
        ->and($operation->billing_status)->toBe(BillingStatus::NOT_APPLICABLE)
        ->and($operation->routing_status)->toBe(OperationRoutingStatus::NOT_APPLICABLE);
});

it('initializes tracks for FILTRE (all not_applicable)', function (): void {
    $operation = Operation::factory()->filtre()->create();

    expect($operation->creative_status)->toBe(CreativeStatus::NOT_APPLICABLE)
        ->and($operation->billing_status)->toBe(BillingStatus::NOT_APPLICABLE)
        ->and($operation->routing_status)->toBe(OperationRoutingStatus::NOT_APPLICABLE);
});

it('belongs to demande', function (): void {
    $demande = Demande::factory()->create();
    $operation = Operation::factory()->forDemande($demande)->create();

    expect($operation->demande->id)->toBe($demande->id);
});

it('can have a parent operation', function (): void {
    $demande = Demande::factory()->create();
    $parent = Operation::factory()->forDemande($demande)->loc()->create();
    $child = Operation::factory()->forDemande($demande)->rep()->create([
        'parent_operation_id' => $parent->id,
    ]);

    expect($child->parentOperation->id)->toBe($parent->id)
        ->and($parent->childOperations)->toHaveCount(1);
});

it('scopeActive excludes completed and cancelled operations', function (): void {
    $demande = Demande::factory()->create();

    Operation::factory()->forDemande($demande)->create(['lifecycle_status' => LifecycleStatus::PREPARING->value]);
    Operation::factory()->forDemande($demande)->create(['lifecycle_status' => LifecycleStatus::COMPLETED->value]);
    Operation::factory()->forDemande($demande)->create(['lifecycle_status' => LifecycleStatus::CANCELLED->value]);

    $active = Operation::active()->get();

    expect($active)->toHaveCount(1)
        ->and($active->first()->lifecycle_status)->toBe(LifecycleStatus::PREPARING);
});

it('auto-generates ref_operation and line_number on create', function (): void {
    $demande = Demande::factory()->create();
    $op1 = Operation::factory()->forDemande($demande)->create();
    $op2 = Operation::factory()->forDemande($demande)->create();

    expect($op1->ref_operation)->toMatch('/^OP-\d{6}-[A-Z0-9]{6}$/')
        ->and($op1->line_number)->toBe(1)
        ->and($op2->line_number)->toBe(2);
});
