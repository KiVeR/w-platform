<?php

declare(strict_types=1);

namespace App\Enums;

enum CreativeStatus: string
{
    case NOT_APPLICABLE      = 'not_applicable';
    case PENDING             = 'pending';
    case IN_PROGRESS         = 'in_progress';
    case PENDING_APPROVAL    = 'pending_approval';
    case REVISION_REQUESTED  = 'revision_requested';
    case APPROVED            = 'approved';

    public function label(): string
    {
        return match($this) {
            self::NOT_APPLICABLE     => 'Non applicable',
            self::PENDING            => 'En attente',
            self::IN_PROGRESS        => 'En cours',
            self::PENDING_APPROVAL   => 'En attente de validation',
            self::REVISION_REQUESTED => 'Révision demandée',
            self::APPROVED           => 'Approuvé',
        };
    }

    public function isTerminal(): bool
    {
        return match($this) {
            self::NOT_APPLICABLE, self::APPROVED => true,
            default => false,
        };
    }

    /** @return list<self> */
    public function transitionsFrom(): array
    {
        return match($this) {
            self::NOT_APPLICABLE     => [],
            self::PENDING            => [],
            self::IN_PROGRESS        => [self::PENDING, self::REVISION_REQUESTED],
            self::PENDING_APPROVAL   => [self::IN_PROGRESS],
            self::REVISION_REQUESTED => [self::PENDING_APPROVAL],
            self::APPROVED           => [self::PENDING_APPROVAL],
        };
    }
}
