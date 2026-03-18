<?php

declare(strict_types=1);

use App\DTOs\CampaignStats;

it('parses wepak response with sent and delivered', function (): void {
    $stats = CampaignStats::fromWepakResponse([
        'message' => [
            'SENT' => 1000,
            'DELIVERED' => 950,
            'UNDELIVERABLE' => 20,
            'REJECTED' => 10,
            'EXPIRED' => 5,
            'STOP' => 15,
        ],
    ]);

    expect($stats->sent)->toBe(1000)
        ->and($stats->delivered)->toBe(950)
        ->and($stats->undeliverable)->toBe(20)
        ->and($stats->rejected)->toBe(10)
        ->and($stats->expired)->toBe(5)
        ->and($stats->stop)->toBe(15);
});

it('calculates deliverability rate from wepak response', function (): void {
    $stats = CampaignStats::fromWepakResponse([
        'message' => ['SENT' => 1000, 'DELIVERED' => 950],
    ]);

    expect($stats->deliverabilityRate)->toBe(95.0)
        ->and($stats->clicks)->toBe(0)
        ->and($stats->ctr)->toBe(0.0);
});

it('parses trigger api response with clicks and ctr', function (): void {
    $stats = CampaignStats::fromTriggerApiResponse([
        'data' => [
            'total' => 1000,
            'delivered' => 950,
            'clicks' => 125,
            'deliverability_rate' => 95.0,
            'ctr' => 13.16,
        ],
    ]);

    expect($stats->sent)->toBe(1000)
        ->and($stats->delivered)->toBe(950)
        ->and($stats->clicks)->toBe(125)
        ->and($stats->deliverabilityRate)->toBe(95.0)
        ->and($stats->ctr)->toBe(13.16);
});

it('handles trigger api response with all fields', function (): void {
    $stats = CampaignStats::fromTriggerApiResponse([
        'data' => [
            'total' => 500,
            'delivered' => 480,
            'clicks' => 60,
            'deliverability_rate' => 96.0,
            'ctr' => 12.5,
        ],
    ]);

    expect($stats->undeliverable)->toBe(0)
        ->and($stats->rejected)->toBe(0)
        ->and($stats->expired)->toBe(0)
        ->and($stats->stop)->toBe(0);
});

it('handles empty wepak response with zeros', function (): void {
    $stats = CampaignStats::fromWepakResponse([]);

    expect($stats->sent)->toBe(0)
        ->and($stats->delivered)->toBe(0)
        ->and($stats->deliverabilityRate)->toBe(0.0);
});

it('handles empty trigger api response with zeros', function (): void {
    $stats = CampaignStats::fromTriggerApiResponse([]);

    expect($stats->sent)->toBe(0)
        ->and($stats->delivered)->toBe(0)
        ->and($stats->clicks)->toBe(0)
        ->and($stats->ctr)->toBe(0.0);
});

it('builds local performance stats with legacy-compatible ratios', function (): void {
    $stats = CampaignStats::fromLocalPerformance(
        sent: 3,
        delivered: 2,
        clicks: 1,
    );

    expect($stats->sent)->toBe(3)
        ->and($stats->delivered)->toBe(2)
        ->and($stats->clicks)->toBe(1)
        ->and($stats->deliverabilityRate)->toBe(66.67)
        ->and($stats->ctr)->toBe(50.0);
});
