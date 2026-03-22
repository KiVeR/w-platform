<?php

declare(strict_types=1);

namespace App\Enums;

enum LifecycleStatus: string
{
    case DRAFT = 'draft';
    case PREPARING = 'preparing';
    case ON_HOLD = 'on_hold';
    case READY = 'ready';
    case SCHEDULED = 'scheduled';
    case PROCESSING = 'processing';
    case DELIVERED = 'delivered';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Brouillon',
            self::PREPARING => 'En préparation',
            self::ON_HOLD => 'En attente',
            self::READY => 'Prêt',
            self::SCHEDULED => 'Planifié',
            self::PROCESSING => 'En cours',
            self::DELIVERED => 'Diffusé',
            self::COMPLETED => 'Terminé',
            self::CANCELLED => 'Annulé',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::DRAFT => 'gray',
            self::PREPARING => 'blue',
            self::ON_HOLD => 'orange',
            self::READY => 'teal',
            self::SCHEDULED => 'indigo',
            self::PROCESSING => 'purple',
            self::DELIVERED => 'green',
            self::COMPLETED => 'green',
            self::CANCELLED => 'red',
        };
    }

    public function isTerminal(): bool
    {
        return match ($this) {
            self::COMPLETED, self::CANCELLED => true,
            default => false,
        };
    }

    public function isActive(): bool
    {
        return match ($this) {
            self::PREPARING, self::READY, self::SCHEDULED, self::PROCESSING, self::DELIVERED => true,
            default => false,
        };
    }

    /** @return list<self> */
    public function transitionsFrom(): array
    {
        return match ($this) {
            self::DRAFT => [],
            self::PREPARING => [self::DRAFT, self::ON_HOLD],
            self::ON_HOLD => [self::PREPARING, self::READY, self::SCHEDULED],
            self::READY => [self::PREPARING],
            self::SCHEDULED => [self::READY],
            self::PROCESSING => [self::SCHEDULED],
            self::DELIVERED => [self::PROCESSING],
            self::COMPLETED => [self::DELIVERED],
            self::CANCELLED => [self::DRAFT, self::PREPARING, self::ON_HOLD, self::READY, self::SCHEDULED, self::PROCESSING],
        };
    }
}
