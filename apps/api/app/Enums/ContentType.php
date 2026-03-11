<?php

declare(strict_types=1);

namespace App\Enums;

enum ContentType: string
{
    case LANDING_PAGE = 'landing_page';
    case RCS = 'rcs';
    case SMS = 'sms';
}
