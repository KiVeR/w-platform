<?php

declare(strict_types=1);

namespace App\Enums;

enum IrisType: string
{
    case HABITAT = 'H';
    case ACTIVITE = 'A';
    case DIVERS = 'D';
    case NON_SUBDIVISE = 'Z';
}
