<?php

declare(strict_types=1);

namespace App\Enums;

enum ProcessingStatus: string
{
    case COUNTING = 'counting';
    case ROUTING = 'routing';
    case SENDING = 'sending';
    case STATS_PENDING = 'stats_pending';

    public function label(): string
    {
        return match ($this) {
            self::COUNTING => 'Comptage',
            self::ROUTING => 'Routage',
            self::SENDING => 'Envoi',
            self::STATS_PENDING => 'Statistiques en attente',
        };
    }
}
