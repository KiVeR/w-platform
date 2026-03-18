<?php

declare(strict_types=1);

namespace App\DTOs;

readonly class CampaignStats
{
    public function __construct(
        public int $sent,
        public int $delivered,
        public int $undeliverable,
        public int $rejected,
        public int $expired,
        public int $stop,
        public int $clicks,
        public float $deliverabilityRate,
        public float $ctr,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromWepakResponse(array $data): self
    {
        $msg = $data['message'] ?? [];
        $sent = (int) ($msg['SENT'] ?? 0);
        $delivered = (int) ($msg['DELIVERED'] ?? 0);

        return new self(
            sent: $sent,
            delivered: $delivered,
            undeliverable: (int) ($msg['UNDELIVERABLE'] ?? 0),
            rejected: (int) ($msg['REJECTED'] ?? 0),
            expired: (int) ($msg['EXPIRED'] ?? 0),
            stop: (int) ($msg['STOP'] ?? 0),
            clicks: 0,
            deliverabilityRate: $sent > 0 ? round(($delivered / $sent) * 100, 2) : 0.0,
            ctr: 0.0,
        );
    }

    /** @param array<string, mixed> $data */
    public static function fromTriggerApiResponse(array $data): self
    {
        $stats = $data['data'] ?? [];
        $total = (int) ($stats['total'] ?? 0);
        $delivered = (int) ($stats['delivered'] ?? 0);

        return self::fromLocalPerformance(
            sent: $total,
            delivered: $delivered,
            clicks: (int) ($stats['clicks'] ?? 0),
        );
    }

    public static function fromLocalPerformance(int $sent, int $delivered, int $clicks): self
    {
        return new self(
            sent: $sent,
            delivered: $delivered,
            undeliverable: 0,
            rejected: 0,
            expired: 0,
            stop: 0,
            clicks: $clicks,
            deliverabilityRate: $sent > 0 ? round(($delivered / $sent) * 100, 2) : 0.0,
            ctr: $delivered > 0 ? round(($clicks / $delivered) * 100, 2) : 0.0,
        );
    }
}
