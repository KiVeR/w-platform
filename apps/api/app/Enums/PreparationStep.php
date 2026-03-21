<?php

declare(strict_types=1);

namespace App\Enums;

enum PreparationStep: string
{
    case COUNTING      = 'counting';
    case ORDER_FORM    = 'order_form';
    case CONFIGURATION = 'configuration';

    public function label(): string
    {
        return match($this) {
            self::COUNTING      => 'Comptage',
            self::ORDER_FORM    => 'Bon de commande',
            self::CONFIGURATION => 'Configuration',
        };
    }
}
