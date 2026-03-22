<?php

declare(strict_types=1);

namespace App\Services\Production;

use App\DTOs\ChecklistItem;
use App\Enums\CreativeStatus;
use App\Enums\OperationType;
use App\Models\Operation;

final class ReadinessService
{
    /**
     * @return list<ChecklistItem>
     */
    public function getChecklist(Operation $operation): array
    {
        return match ($operation->type) {
            OperationType::LOC,
            OperationType::RLOC,
            OperationType::ACQ => $this->acquisitionChecklist($operation),
            OperationType::FID => $this->fidelisationChecklist($operation),
            OperationType::QUAL => $this->qualificationChecklist($operation),
            OperationType::REP => $this->repetitionChecklist($operation),
            OperationType::ENRICH,
            OperationType::VALID,
            OperationType::FILTRE => $this->dataOpChecklist($operation),
        };
    }

    public function isReady(Operation $operation): bool
    {
        foreach ($this->getChecklist($operation) as $item) {
            if ($item->isBlocking()) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return list<ChecklistItem>
     */
    public function getBlockingItems(Operation $operation): array
    {
        return array_values(
            array_filter(
                $this->getChecklist($operation),
                fn (ChecklistItem $item): bool => $item->isBlocking(),
            )
        );
    }

    // -- Checklists per type ------------------------------------------------

    /** @return list<ChecklistItem> */
    private function acquisitionChecklist(Operation $op): array
    {
        $items = [
            $this->checkTargetingSet($op),
            $this->checkMessageSet($op),
            $this->checkVolumeEstimated($op),
            $this->checkPricingSet($op),
            $this->checkAssigned($op),
        ];

        if ($op->type->requiresCreative()) {
            $items[] = $this->checkCreativeApproved($op);
        }

        return $items;
    }

    /** @return list<ChecklistItem> */
    private function fidelisationChecklist(Operation $op): array
    {
        return [
            $this->checkTargetingNA(),
            $this->checkMessageSet($op),
            $this->checkPricingSet($op),
            $this->checkAssigned($op),
        ];
    }

    /** @return list<ChecklistItem> */
    private function qualificationChecklist(Operation $op): array
    {
        return [
            $this->checkTargetingNA(),
            $this->checkMessageSet($op),
            $this->checkAssigned($op),
        ];
    }

    /** @return list<ChecklistItem> */
    private function repetitionChecklist(Operation $op): array
    {
        return [
            $this->checkParentExists($op),
            $this->checkMessageSet($op),
            $this->checkAssigned($op),
        ];
    }

    /** @return list<ChecklistItem> */
    private function dataOpChecklist(Operation $op): array
    {
        return [
            $this->checkAssigned($op),
        ];
    }

    // -- Individual checks --------------------------------------------------

    private function checkTargetingSet(Operation $op): ChecklistItem
    {
        $targeting = $op->targeting;
        $ok = is_array($targeting) && $targeting !== [];

        return new ChecklistItem(
            'targeting',
            $ok ? 'pass' : 'fail',
            $ok ? 'Ciblage défini' : 'Ciblage manquant',
        );
    }

    private function checkTargetingNA(): ChecklistItem
    {
        return new ChecklistItem('targeting', 'na', 'Ciblage non requis');
    }

    private function checkMessageSet(Operation $op): ChecklistItem
    {
        $ok = $op->message !== null && $op->message !== '';

        return new ChecklistItem(
            'message',
            $ok ? 'pass' : 'fail',
            $ok ? 'Message défini' : 'Message manquant',
        );
    }

    private function checkVolumeEstimated(Operation $op): ChecklistItem
    {
        $ok = ($op->volume_estimated ?? 0) > 0;

        return new ChecklistItem(
            'volume',
            $ok ? 'pass' : 'fail',
            $ok ? 'Volume estimé' : 'Volume non estimé',
        );
    }

    private function checkCreativeApproved(Operation $op): ChecklistItem
    {
        $ok = $op->creative_status === CreativeStatus::APPROVED
            || $op->creative_status === CreativeStatus::NOT_APPLICABLE;

        return new ChecklistItem(
            'creative',
            $ok ? 'pass' : 'fail',
            $ok ? 'Créatif validé' : 'Créatif non approuvé',
        );
    }

    private function checkAssigned(Operation $op): ChecklistItem
    {
        $ok = $op->assigned_to !== null;

        return new ChecklistItem(
            'assigned',
            $ok ? 'pass' : 'fail',
            $ok ? 'Opérateur affecté' : 'Opérateur non affecté',
        );
    }

    private function checkPricingSet(Operation $op): ChecklistItem
    {
        $ok = ($op->unit_price ?? 0) > 0;

        return new ChecklistItem(
            'pricing',
            $ok ? 'pass' : 'fail',
            $ok ? 'Tarification définie' : 'Tarification manquante',
        );
    }

    private function checkParentExists(Operation $op): ChecklistItem
    {
        $ok = $op->parent_operation_id !== null;

        return new ChecklistItem(
            'parent',
            $ok ? 'pass' : 'fail',
            $ok ? 'Opération parente liée' : 'Opération parente manquante',
        );
    }
}
