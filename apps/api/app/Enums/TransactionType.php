<?php

declare(strict_types=1);

namespace App\Enums;

enum TransactionType: string
{
    case CREDIT     = 'credit';
    case DEBIT      = 'debit';
    case REFUND     = 'refund';
    case ADJUSTMENT = 'adjustment';

    public function label(): string
    {
        return match($this) {
            self::CREDIT     => 'Crédit',
            self::DEBIT      => 'Débit',
            self::REFUND     => 'Remboursement',
            self::ADJUSTMENT => 'Ajustement',
        };
    }
}
