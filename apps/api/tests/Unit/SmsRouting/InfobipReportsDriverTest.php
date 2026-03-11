<?php

declare(strict_types=1);

use App\Services\SmsRouting\Reporting\InfobipReportsDriver;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

beforeEach(function (): void {
    $this->driver = new InfobipReportsDriver(
        baseUrl: 'abc123',
        apiToken: 'infobip-token',
    );
});

it('pulls delivery reports for active campaigns', function (): void {
    Http::fake([
        'abc123.api.infobip.com/sms/1/reports*' => Http::response([
            'results' => [
                ['messageId' => 'msg-1', 'status' => ['name' => 'DELIVERED_TO_HANDSET']],
            ],
        ]),
    ]);

    $campaigns = collect([
        ['batch_id' => 'bulk-1', 'campaign_id' => 1],
    ]);

    $reports = $this->driver->pull($campaigns);

    expect($reports)->toHaveCount(1)
        ->and($reports[0]['batch_id'])->toBe('bulk-1')
        ->and($reports[0]['campaign_id'])->toBe(1)
        ->and($reports[0]['report']['results'])->toHaveCount(1);
});

it('sends App token auth', function (): void {
    Http::fake([
        'abc123.api.infobip.com/*' => Http::response(['results' => []]),
    ]);

    $campaigns = collect([['batch_id' => 'bulk-auth', 'campaign_id' => 10]]);
    $this->driver->pull($campaigns);

    Http::assertSent(function ($request): bool {
        return $request->hasHeader('Authorization', 'App infobip-token');
    });
});

it('passes bulkId as query parameter', function (): void {
    Http::fake([
        'abc123.api.infobip.com/*' => Http::response(['results' => []]),
    ]);

    $campaigns = collect([['batch_id' => 'bulk-qp', 'campaign_id' => 7]]);
    $this->driver->pull($campaigns);

    Http::assertSent(function ($request): bool {
        return str_contains($request->url(), 'bulkId=bulk-qp');
    });
});

it('skips failed HTTP responses and logs warning', function (): void {
    Http::fake([
        'abc123.api.infobip.com/*' => Http::response('Server Error', 500),
    ]);

    Log::shouldReceive('warning')->once()->withArgs(function (string $message, array $context): bool {
        return $message === 'Infobip reports pull failed'
            && $context['batch_id'] === 'bulk-fail'
            && $context['status'] === 500;
    });

    $campaigns = collect([['batch_id' => 'bulk-fail', 'campaign_id' => 3]]);

    $reports = $this->driver->pull($campaigns);

    expect($reports)->toHaveCount(0);
});

it('catches exceptions and logs error', function (): void {
    Http::fake([
        'abc123.api.infobip.com/*' => fn () => throw new \RuntimeException('Timeout'),
    ]);

    Log::shouldReceive('error')->once()->withArgs(function (string $message, array $context): bool {
        return $message === 'Infobip reports pull exception'
            && $context['batch_id'] === 'bulk-err'
            && $context['error'] === 'Timeout';
    });

    $campaigns = collect([['batch_id' => 'bulk-err', 'campaign_id' => 4]]);

    $reports = $this->driver->pull($campaigns);

    expect($reports)->toHaveCount(0);
});

it('returns empty collection for empty campaigns', function (): void {
    $reports = $this->driver->pull(collect());

    expect($reports)->toHaveCount(0);
});
