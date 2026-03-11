<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Phone number formatting options.
 */
enum PhoneFormat: string
{
    case E164 = 'E164';                     // +33612345678
    case NATIONAL = 'NATIONAL';             // 06 12 34 56 78
    case INTERNATIONAL = 'INTERNATIONAL';   // +33 6 12 34 56 78
    case RFC3966 = 'RFC3966';               // tel:+33-6-12-34-56-78
}
