<?php

declare(strict_types=1);

namespace App\Exceptions;

use App\Enums\CampaignRoutingStatus;
use RuntimeException;

class InvalidRoutingStateException extends RuntimeException
{
    public function __construct(
        public readonly ?CampaignRoutingStatus $currentStatus,
        public readonly string $action,
    ) {
        $status = $currentStatus?->value ?? 'null';
        parent::__construct("Cannot {$action} routing: current status is {$status}");
    }
}
