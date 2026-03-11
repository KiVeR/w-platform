<?php

declare(strict_types=1);

use App\DTOs\SmsMessage;
use App\DTOs\SmsRecipient;
use App\Services\SmsRouting\Drivers\InfobipDriver;
use Illuminate\Support\Facades\Http;

function makeInfobipConfig(array $overrides = []): array
{
    return array_merge([
        'base_url' => 'xyz123',
        'api_token' => 'test-infobip-token',
        'notify_url' => 'https://example.com/infobip/notify',
        'dry_run' => false,
        'from_testing' => 'InfoSMS',
    ], $overrides);
}

it('sends SMS with App token prefix (not Bearer)', function (): void {
    Http::fake(['*' => Http::response(['bulkId' => 'bulk-abc'], 200)]);

    $driver = new InfobipDriver(makeInfobipConfig());
    $driver->batchUuid('batch-123')
        ->from('MyBrand')
        ->to(collect([new SmsRecipient('33612345678')]))
        ->message(new SmsMessage('Hello', 'Hello STOP 36173'));

    $driver->send();

    Http::assertSent(function ($request): bool {
        expect($request->hasHeader('Authorization'))->toBeTrue();
        expect($request->header('Authorization')[0])->toBe('App test-infobip-token');

        return true;
    });
});

it('builds correct URL with base_url', function (): void {
    $driver = new InfobipDriver(makeInfobipConfig(['base_url' => 'mybase']));

    expect($driver->getUrl())->toBe('https://mybase.api.infobip.com/sms/3/messages');
});

it('constructs messages per recipient with correct structure', function (): void {
    Http::fake(['*' => Http::response([], 200)]);

    $driver = new InfobipDriver(makeInfobipConfig());
    $driver->batchUuid('bulk-xyz')
        ->from('Sender')
        ->to(collect([
            new SmsRecipient('33611111111', null, 'uuid-1'),
            new SmsRecipient('33622222222', null, 'uuid-2'),
        ]))
        ->message(new SmsMessage('Content', 'Content STOP 36173'));

    $driver->send();

    Http::assertSent(function ($request): bool {
        $data = $request->data();
        expect($data)->toHaveKey('messages');
        expect($data['messages'])->toHaveCount(2);

        $msg1 = $data['messages'][0];
        expect($msg1['sender'])->toBe('Sender');
        expect($msg1['destinations'])->toBe([['to' => '33611111111']]);
        expect($msg1['content']['text'])->toBe('Content STOP 36173');
        expect($msg1['webhooks']['delivery']['url'])->toBe('https://example.com/infobip/notify');
        expect($msg1['webhooks']['callbackData'])->toBe('bulk-xyz');
        expect($msg1['webhooks']['contentType'])->toBe('application/json');

        $msg2 = $data['messages'][1];
        expect($msg2['destinations'])->toBe([['to' => '33622222222']]);

        return true;
    });
});

it('includes bulkId in options schedule', function (): void {
    Http::fake(['*' => Http::response([], 200)]);

    $driver = new InfobipDriver(makeInfobipConfig());
    $driver->batchUuid('bulk-id-123')
        ->from('Sender')
        ->to(collect([new SmsRecipient('33612345678')]))
        ->message(new SmsMessage('Test'));

    $driver->send();

    Http::assertSent(function ($request): bool {
        $data = $request->data();
        expect($data['options']['schedule']['bulkId'])->toBe('bulk-id-123');

        return true;
    });
});

it('uses from_testing as sender when dry_run is true', function (): void {
    Http::fake(['*' => Http::response([], 200)]);

    $driver = new InfobipDriver(makeInfobipConfig([
        'dry_run' => true,
        'from_testing' => 'TestSender',
    ]));
    $driver->batchUuid('batch-dry')
        ->from('RealBrand')
        ->to(collect([new SmsRecipient('33612345678')]))
        ->message(new SmsMessage('Test'));

    $driver->send();

    Http::assertSent(function ($request): bool {
        $data = $request->data();
        expect($data['messages'][0]['sender'])->toBe('TestSender');

        return true;
    });
});

it('uses real sender when dry_run is false', function (): void {
    Http::fake(['*' => Http::response([], 200)]);

    $driver = new InfobipDriver(makeInfobipConfig(['dry_run' => false]));
    $driver->batchUuid('batch-real')
        ->from('RealBrand')
        ->to(collect([new SmsRecipient('33612345678')]))
        ->message(new SmsMessage('Test'));

    $driver->send();

    Http::assertSent(function ($request): bool {
        $data = $request->data();
        expect($data['messages'][0]['sender'])->toBe('RealBrand');

        return true;
    });
});

it('uses messagePreview from recipient when provided', function (): void {
    Http::fake(['*' => Http::response([], 200)]);

    $driver = new InfobipDriver(makeInfobipConfig());
    $driver->batchUuid('batch-preview')
        ->from('Sender')
        ->to(collect([
            new SmsRecipient('33611111111', 'Personalized for Jean', 'uuid-jean'),
            new SmsRecipient('33622222222', null, 'uuid-marie'),
        ]))
        ->message(new SmsMessage('Generic', 'Generic STOP 36173'));

    $driver->send();

    Http::assertSent(function ($request): bool {
        $data = $request->data();
        expect($data['messages'][0]['content']['text'])->toBe('Personalized for Jean');
        expect($data['messages'][1]['content']['text'])->toBe('Generic STOP 36173');

        return true;
    });
});

it('throws exception when base_url is missing', function (): void {
    $driver = new InfobipDriver(makeInfobipConfig(['base_url' => '']));

    expect(fn () => $driver->checkRequiredValues())->toThrow(Exception::class, 'You must provide a base url');
});

it('throws exception when api_token is missing', function (): void {
    $driver = new InfobipDriver(makeInfobipConfig(['api_token' => '']));

    expect(fn () => $driver->checkRequiredValues())->toThrow(Exception::class, 'You must provide an api token');
});

it('handles HTTP 4xx error response', function (): void {
    Http::fake(['*' => Http::response(['requestError' => ['serviceException' => ['text' => 'Bad Request']]], 400)]);

    $driver = new InfobipDriver(makeInfobipConfig());
    $driver->batchUuid('batch-err')
        ->from('Sender')
        ->to(collect([new SmsRecipient('33612345678')]))
        ->message(new SmsMessage('Test'));

    $response = $driver->send();

    expect($response->status())->toBe(400);
    expect($response->failed())->toBeTrue();
});

it('handles HTTP 5xx error response', function (): void {
    Http::fake(['*' => Http::response([], 500)]);

    $driver = new InfobipDriver(makeInfobipConfig());
    $driver->batchUuid('batch-err')
        ->from('Sender')
        ->to(collect([new SmsRecipient('33612345678')]))
        ->message(new SmsMessage('Test'));

    $response = $driver->send();

    expect($response->status())->toBe(500);
    expect($response->serverError())->toBeTrue();
});
