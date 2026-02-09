<?php

declare(strict_types=1);

namespace App\Services\CampaignSending;

use App\Models\Partner;

class StopSmsService
{
    public function appendStop(string $message, Partner $partner): string
    {
        $router = $partner->router;

        if (! $router || ! $router->num_stop) {
            return $message;
        }

        $stopText = 'STOP '.$router->num_stop;

        if (str_contains($message, $stopText)) {
            return $message;
        }

        return $message.' '.$stopText;
    }

    public function containsBlockedDomain(string $message): bool
    {
        return str_contains(mb_strtolower($message), 'rsms.co');
    }
}
