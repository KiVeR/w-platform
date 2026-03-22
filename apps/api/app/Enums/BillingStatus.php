<?php

declare(strict_types=1);

namespace App\Enums;

enum BillingStatus: string
{
    case NOT_APPLICABLE = 'not_applicable';
    case PENDING = 'pending';
    case INVOICED = 'invoiced';
    case PAID = 'paid';
    case CREDITED = 'credited';
    case PREPAID = 'prepaid';

    public function label(): string
    {
        return match ($this) {
            self::NOT_APPLICABLE => 'Non applicable',
            self::PENDING => 'En attente',
            self::INVOICED => 'Facturé',
            self::PAID => 'Payé',
            self::CREDITED => 'Avoir',
            self::PREPAID => 'Prépayé',
        };
    }

    public function isTerminal(): bool
    {
        return match ($this) {
            self::NOT_APPLICABLE, self::PAID, self::CREDITED, self::PREPAID => true,
            default => false,
        };
    }

    /** @return list<self> */
    public function transitionsFrom(): array
    {
        return match ($this) {
            self::NOT_APPLICABLE => [],
            self::PENDING => [],
            self::INVOICED => [self::PENDING],
            self::PAID => [self::INVOICED],
            self::CREDITED => [self::PAID, self::INVOICED],
            self::PREPAID => [self::PENDING],
        };
    }
}
