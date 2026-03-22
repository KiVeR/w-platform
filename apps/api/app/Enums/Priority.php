<?php

declare(strict_types=1);

namespace App\Enums;

enum Priority: string
{
    case HIGH = 'high';
    case MEDIUM = 'medium';
    case LOW = 'low';

    public function label(): string
    {
        return match ($this) {
            self::HIGH => 'Haute',
            self::MEDIUM => 'Moyenne',
            self::LOW => 'Basse',
        };
    }

    public function sortOrder(): int
    {
        return match ($this) {
            self::HIGH => 1,
            self::MEDIUM => 2,
            self::LOW => 3,
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::HIGH => 'red',
            self::MEDIUM => 'orange',
            self::LOW => 'gray',
        };
    }
}
