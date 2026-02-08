<?php

declare(strict_types=1);

namespace App\Enums;

enum CampaignType: string
{
    case PROSPECTION = 'prospection';
    case FIDELISATION = 'fidelisation';
    case COMPTAGE = 'comptage';
}
