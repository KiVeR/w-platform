<?php

declare(strict_types=1);

namespace App\Enums;

enum CampaignStatus: string
{
    case DRAFT = 'draft';
    case SCHEDULED = 'scheduled';
    case SENDING = 'sending';
    case SENT = 'sent';
    case CANCELLED = 'cancelled';
    case FAILED = 'failed';
}
