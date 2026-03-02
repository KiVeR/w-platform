<?php

declare(strict_types=1);

use App\DTOs\SmsMessage;
use App\DTOs\SmsRecipient;
use App\Services\SmsRouting\Drivers\SinchDriver;
use Illuminate\Support\Facades\Http;

function makeSinchConfig(array $overrides = []): array
{
    return array_merge([
        'region' => 'eu',
        'service_plan_id' => 'test-plan-id',
        'api_token' => 'test-api-token',
        'callback_url' => 'https://example.com/callback',
        'dry_run' => false,
        'allow_dry_run' => false,
    ], $overrides);
}

it('sends SMS with correct bearer token and payload', function (): void {
    Http::fake(['*' => Http::response(['id' => 'batch-abc'], 201)]);

    $driver = new SinchDriver(makeSinchConfig());
    $driver->batchUuid('batch-123')
        ->from('SenderName')
        ->to(collect([new SmsRecipient('33612345678')]))
        ->message(new SmsMessage('Hello', 'Hello STOP 36111'));

    $driver->send();

    Http::assertSent(function ($request): bool {
        expect($request->hasHeader('Authorization'))->toBeTrue();
        expect($request->header('Authorization')[0])->toBe('Bearer test-api-token');

        $data = $request->data();
        expect($data['from'])->toBe('SenderName');
        expect($data['to'])->toBe(['33612345678']);
        expect($data['body'])->toBe('Hello STOP 36111');
        expect($data['delivery_report'])->toBe('per_recipient_final');
        expect($data['type'])->toBe('mt_text');
        expect($data['callback_url'])->toBe('https://example.com/callback');
        expect($data['client_reference'])->toBe('batch-123');

        return true;
    });
});

it('builds correct URL with region and service plan id', function (): void {
    $driver = new SinchDriver(makeSinchConfig([
        'region' => 'us',
        'service_plan_id' => 'my-plan',
    ]));

    expect($driver->getUrl())->toBe('https://us.sms.api.sinch.com/xms/v1/my-plan/batches');
});

it('appends dry_run to URL when dry_run and allow_dry_run are both true', function (): void {
    $driver = new SinchDriver(makeSinchConfig([
        'dry_run' => true,
        'allow_dry_run' => true,
    ]));

    expect($driver->getUrl())->toBe('https://eu.sms.api.sinch.com/xms/v1/test-plan-id/batches/dry_run');
});

it('does not append dry_run to URL when dry_run is true but allow_dry_run is false', function (): void {
    $driver = new SinchDriver(makeSinchConfig([
        'dry_run' => true,
        'allow_dry_run' => false,
    ]));

    expect($driver->getUrl())->toBe('https://eu.sms.api.sinch.com/xms/v1/test-plan-id/batches');
});

it('does not append dry_run to URL when allow_dry_run is true but dry_run is false', function (): void {
    $driver = new SinchDriver(makeSinchConfig([
        'dry_run' => false,
        'allow_dry_run' => true,
    ]));

    expect($driver->getUrl())->toBe('https://eu.sms.api.sinch.com/xms/v1/test-plan-id/batches');
});

it('sends to multiple recipients', function (): void {
    Http::fake(['*' => Http::response([], 200)]);

    $driver = new SinchDriver(makeSinchConfig());
    $driver->batchUuid('batch-multi')
        ->from('Sender')
        ->to(collect([
            new SmsRecipient('33611111111'),
            new SmsRecipient('33622222222'),
            new SmsRecipient('33633333333'),
        ]))
        ->message(new SmsMessage('Test'));

    $driver->send();

    Http::assertSent(function ($request): bool {
        $data = $request->data();
        expect($data['to'])->toBe(['33611111111', '33622222222', '33633333333']);

        return true;
    });
});

it('uses message content without stop when contentWithStop is null', function (): void {
    Http::fake(['*' => Http::response([], 200)]);

    $driver = new SinchDriver(makeSinchConfig());
    $driver->batchUuid('batch-xyz')
        ->from('Sender')
        ->to(collect([new SmsRecipient('33612345678')]))
        ->message(new SmsMessage('Plain content'));

    $driver->send();

    Http::assertSent(function ($request): bool {
        expect($request->data()['body'])->toBe('Plain content');

        return true;
    });
});

it('throws exception when region is missing', function (): void {
    $driver = new SinchDriver(makeSinchConfig(['region' => '']));

    expect(fn () => $driver->checkRequiredValues())->toThrow(Exception::class, 'You must provide a region');
});

it('throws exception when service_plan_id is missing', function (): void {
    $driver = new SinchDriver(makeSinchConfig(['service_plan_id' => '']));

    expect(fn () => $driver->checkRequiredValues())->toThrow(Exception::class, 'You must provide a service plan id');
});

it('throws exception when api_token is missing', function (): void {
    $driver = new SinchDriver(makeSinchConfig(['api_token' => '']));

    expect(fn () => $driver->checkRequiredValues())->toThrow(Exception::class, 'You must provide an api token');
});

it('throws exception when callback_url is missing', function (): void {
    $driver = new SinchDriver(makeSinchConfig(['callback_url' => '']));

    expect(fn () => $driver->checkRequiredValues())->toThrow(Exception::class, 'You must provide a callback url');
});

it('handles HTTP 4xx error response', function (): void {
    Http::fake(['*' => Http::response(['error' => 'Unauthorized'], 401)]);

    $driver = new SinchDriver(makeSinchConfig());
    $driver->batchUuid('batch-err')
        ->from('Sender')
        ->to(collect([new SmsRecipient('33612345678')]))
        ->message(new SmsMessage('Test'));

    $response = $driver->send();

    expect($response->status())->toBe(401);
    expect($response->failed())->toBeTrue();
});

it('handles HTTP 5xx error response', function (): void {
    Http::fake(['*' => Http::response(['error' => 'Internal Server Error'], 500)]);

    $driver = new SinchDriver(makeSinchConfig());
    $driver->batchUuid('batch-err')
        ->from('Sender')
        ->to(collect([new SmsRecipient('33612345678')]))
        ->message(new SmsMessage('Test'));

    $response = $driver->send();

    expect($response->status())->toBe(500);
    expect($response->serverError())->toBeTrue();
});
