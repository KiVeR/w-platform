<?php

declare(strict_types=1);

namespace App\Enums;

enum OperationRoutingStatus: string
{
    case NOT_APPLICABLE = 'not_applicable';
    case PENDING        = 'pending';
    case IN_PROGRESS    = 'in_progress';
    case COMPLETED      = 'completed';
    case FAILED         = 'failed';

    public function label(): string
    {
        return match($this) {
            self::NOT_APPLICABLE => 'Non applicable',
            self::PENDING        => 'En attente',
            self::IN_PROGRESS    => 'En cours',
            self::COMPLETED      => 'Terminé',
            self::FAILED         => 'Échoué',
        };
    }

    public function isTerminal(): bool
    {
        return match($this) {
            self::NOT_APPLICABLE, self::COMPLETED, self::FAILED => true,
            default => false,
        };
    }

    /** @return list<self> */
    public function transitionsFrom(): array
    {
        return match($this) {
            self::NOT_APPLICABLE => [],
            self::PENDING        => [],
            self::IN_PROGRESS    => [self::PENDING],
            self::COMPLETED      => [self::IN_PROGRESS],
            self::FAILED         => [self::IN_PROGRESS, self::PENDING],
        };
    }
}
