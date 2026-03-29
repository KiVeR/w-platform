<?php

declare(strict_types=1);

namespace App\Enums;

enum CampaignRoutingStatus: string
{
    // Query phase
    case QueryPending = 'QUERY_PENDING';
    case QueryInProgress = 'QUERY_IN_PROGRESS';
    case QueryFailed = 'QUERY_FAILED';

    // Short URL phase
    case ShortUrlError = 'SHORT_URL_ERROR';
    case ShortUrlSuffixPending = 'SHORT_URL_SUFFIX_PENDING';
    case ShortUrlSuffixRequested = 'SHORT_URL_SUFFIX_REQUESTED';
    case ShortUrlSuffixFailed = 'SHORT_URL_SUFFIX_FAILED';

    // Message generation phase
    case MessageGenerationPending = 'MESSAGE_GENERATION_PENDING';
    case MessageGenerationRequested = 'MESSAGE_GENERATION_REQUESTED';
    case MessageGenerationFailed = 'MESSAGE_GENERATION_FAILED';

    // Routing phase
    case RoutingPending = 'ROUTING_PENDING';
    case RoutingInProgress = 'ROUTING_IN_PROGRESS';
    case RoutingCompleted = 'ROUTING_COMPLETED';
    case RoutingPaused = 'ROUTING_PAUSED';
    case RoutingFailed = 'ROUTING_FAILED';
    case RoutingCanceled = 'ROUTING_CANCELED';

    public function isTerminal(): bool
    {
        return in_array($this, [
            self::RoutingCompleted,
            self::RoutingFailed,
            self::RoutingCanceled,
        ]);
    }

    public function isFailed(): bool
    {
        return in_array($this, [
            self::QueryFailed,
            self::ShortUrlError,
            self::ShortUrlSuffixFailed,
            self::MessageGenerationFailed,
            self::RoutingFailed,
        ]);
    }

    public function canStart(): bool
    {
        return in_array($this, [
            self::RoutingPending,
            self::RoutingPaused,
        ]);
    }

    public function canPause(): bool
    {
        return $this === self::RoutingInProgress;
    }

    public function canCancel(): bool
    {
        return ! in_array($this, [
            self::RoutingCompleted,
            self::RoutingCanceled,
        ]);
    }
}
