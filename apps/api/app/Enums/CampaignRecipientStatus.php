<?php

declare(strict_types=1);

namespace App\Enums;

enum CampaignRecipientStatus: string
{
    case Queued = 'QUEUED';
    case Dispatched = 'DISPATCHED';
    case Delivered = 'DELIVERED';
    case Undeliverable = 'UNDELIVERABLE';
    case Failed = 'FAILED';
    case Rejected = 'REJECTED';
    case Expired = 'EXPIRED';
    case Canceled = 'CANCELED';

    public function isTerminal(): bool
    {
        return in_array($this, [
            self::Delivered,
            self::Undeliverable,
            self::Failed,
            self::Rejected,
            self::Expired,
            self::Canceled,
        ]);
    }
}
