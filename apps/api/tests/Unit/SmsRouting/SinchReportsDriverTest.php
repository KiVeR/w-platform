<?php

declare(strict_types=1);

use App\Services\SmsRouting\Reporting\SinchReportsDriver;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

beforeEach(function (): void {
    $this->driver = new SinchReportsDriver(
        region: 'eu',
        servicePlanId: 'plan-123',
        apiToken: 'test-token',
    );
});

it('pulls delivery reports for active campaigns', function (): void {
    Http::fake([
        'eu.sms.api.sinch.com/xms/v1/plan-123/batches/batch-1/delivery_report' => Http::response([
            'type' => 'delivery_report_sms',
            'batch_id' => 'batch-1',
            'statuses' => [
                ['code' => 0, 'status' => 'Delivered', 'count' => 95],
                ['code' => 1, 'status' => 'Failed', 'count' => 5],
            ],
        ]),
        'eu.sms.api.sinch.com/xms/v1/plan-123/batches/batch-2/delivery_report' => Http::response([
            'type' => 'delivery_report_sms',
            'batch_id' => 'batch-2',
            'statuses' => [
                ['code' => 0, 'status' => 'Delivered', 'count' => 200],
            ],
        ]),
    ]);

    $campaigns = collect([
        ['batch_id' => 'batch-1', 'campaign_id' => 1],
        ['batch_id' => 'batch-2', 'campaign_id' => 2],
    ]);

    $reports = $this->driver->pull($campaigns);

    expect($reports)->toHaveCount(2)
        ->and($reports[0]['batch_id'])->toBe('batch-1')
        ->and($reports[0]['campaign_id'])->toBe(1)
        ->and($reports[0]['report']['batch_id'])->toBe('batch-1')
        ->and($reports[1]['batch_id'])->toBe('batch-2')
        ->and($reports[1]['campaign_id'])->toBe(2);
});

it('sends bearer token auth', function (): void {
    Http::fake([
        'eu.sms.api.sinch.com/*' => Http::response(['type' => 'delivery_report_sms']),
    ]);

    $campaigns = collect([['batch_id' => 'batch-auth', 'campaign_id' => 10]]);
    $this->driver->pull($campaigns);

    Http::assertSent(function ($request): bool {
        return $request->hasHeader('Authorization', 'Bearer test-token');
    });
});

it('skips failed HTTP responses and logs warning', function (): void {
    Http::fake([
        'eu.sms.api.sinch.com/xms/v1/plan-123/batches/batch-ok/delivery_report' => Http::response(['type' => 'report'], 200),
        'eu.sms.api.sinch.com/xms/v1/plan-123/batches/batch-fail/delivery_report' => Http::response('Not Found', 404),
    ]);

    Log::shouldReceive('warning')->once()->withArgs(function (string $message, array $context): bool {
        return $message === 'Sinch reports pull failed'
            && $context['batch_id'] === 'batch-fail'
            && $context['status'] === 404;
    });

    $campaigns = collect([
        ['batch_id' => 'batch-ok', 'campaign_id' => 1],
        ['batch_id' => 'batch-fail', 'campaign_id' => 2],
    ]);

    $reports = $this->driver->pull($campaigns);

    expect($reports)->toHaveCount(1)
        ->and($reports[0]['batch_id'])->toBe('batch-ok');
});

it('catches exceptions and logs error', function (): void {
    Http::fake([
        'eu.sms.api.sinch.com/*' => fn () => throw new \RuntimeException('Connection refused'),
    ]);

    Log::shouldReceive('error')->once()->withArgs(function (string $message, array $context): bool {
        return $message === 'Sinch reports pull exception'
            && $context['batch_id'] === 'batch-err'
            && $context['error'] === 'Connection refused';
    });

    $campaigns = collect([['batch_id' => 'batch-err', 'campaign_id' => 5]]);

    $reports = $this->driver->pull($campaigns);

    expect($reports)->toHaveCount(0);
});

it('returns empty collection for empty campaigns', function (): void {
    $reports = $this->driver->pull(collect());

    expect($reports)->toHaveCount(0);
});
