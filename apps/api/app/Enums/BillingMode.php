<?php

declare(strict_types=1);

namespace App\Enums;

enum BillingMode: string
{
    case PREPAID      = 'prepaid';
    case IMMEDIATE    = 'immediate';
    case END_OF_MONTH = 'end_of_month';

    public function label(): string
    {
        return match($this) {
            self::PREPAID      => 'Prépayé',
            self::IMMEDIATE    => 'Facturation immédiate',
            self::END_OF_MONTH => 'Facturation fin de mois',
        };
    }

    public function requiresBalanceCheck(): bool
    {
        return $this === self::PREPAID;
    }

    public function autoInvoiceOnDelivery(): bool
    {
        return $this === self::IMMEDIATE;
    }
}
