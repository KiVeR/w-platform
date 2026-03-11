<?php

declare(strict_types=1);

use App\DTOs\SmsMessage;
use App\DTOs\SmsRecipient;
use App\Services\SmsRouting\Drivers\HighConnexionDriver;
use Illuminate\Support\Facades\Http;

function makeHighConnexionConfig(array $overrides = []): array
{
    return array_merge([
        'base_url' => 'api',
        'account_id' => 'account-123',
        'password' => 'secret-pass',
        'callback_url' => 'https://example.com/hc/callback',
        'dry_run' => false,
        'from_testing' => 'TestSMS',
    ], $overrides);
}

it('sends SMS without Authorization header (auth in body)', function (): void {
    Http::fake(['*' => Http::response(['success' => true], 200)]);

    $driver = new HighConnexionDriver(makeHighConnexionConfig());
    $driver->batchUuid('batch-123')
        ->from('MyBrand')
        ->to(collect([new SmsRecipient('33612345678', null, 'uuid-1')]))
        ->message(new SmsMessage('Hello world'));

    $driver->send();

    Http::assertSent(function ($request): bool {
        expect($request->hasHeader('Authorization'))->toBeFalse();

        return true;
    });
});

it('builds correct URL with base_url', function (): void {
    $driver = new HighConnexionDriver(makeHighConnexionConfig(['base_url' => 'mybase']));

    expect($driver->getUrl())->toBe('https://mybase.hcnx.eu/api');
});

it('constructs push payload with correct structure', function (): void {
    Http::fake(['*' => Http::response([], 200)]);

    $driver = new HighConnexionDriver(makeHighConnexionConfig());
    $driver->batchUuid('ret-id-abc')
        ->from('MyBrand')
        ->to(collect([new SmsRecipient('33612345678', null, 'rec-uuid-1')]))
        ->message(new SmsMessage('Hello world'));

    $driver->send();

    Http::assertSent(function ($request): bool {
        $data = $request->data();
        expect($data)->toHaveKey('push');

        $push = $data['push'];
        expect($push['accountid'])->toBe('account-123');
        expect($push['password'])->toBe('secret-pass');
        expect($push['sender'])->toBe('MyBrand');
        expect($push['ret_id'])->toBe('ret-id-abc');
        expect($push['webhook_url'])->toBe('https://example.com/hc/callback');
        expect($push['message'])->toHaveCount(1);
        expect($push['message'][0]['text'])->toBe('Hello world');

        return true;
    });
});

it('constructs recipients payload with value, ret_id, and param', function (): void {
    Http::fake(['*' => Http::response([], 200)]);

    $driver = new HighConnexionDriver(makeHighConnexionConfig());
    $driver->batchUuid('batch-multi')
        ->from('Sender')
        ->to(collect([
            new SmsRecipient('33611111111', null, 'uuid-a'),
            new SmsRecipient('33622222222', null, 'uuid-b'),
        ]))
        ->message(new SmsMessage('Test'));

    $driver->send();

    Http::assertSent(function ($request): bool {
        $data = $request->data();
        $recipients = $data['push']['message'][0]['to'];

        expect($recipients)->toHaveCount(2);
        expect($recipients[0]['value'])->toBe('33611111111');
        expect($recipients[0]['ret_id'])->toBe('uuid-a');
        expect($recipients[0]['param'])->toBe([]);
        expect($recipients[1]['value'])->toBe('33622222222');
        expect($recipients[1]['ret_id'])->toBe('uuid-b');
        expect($recipients[1]['param'])->toBe([]);

        return true;
    });
});

it('uses from_testing as sender when dry_run is true', function (): void {
    Http::fake(['*' => Http::response([], 200)]);

    $driver = new HighConnexionDriver(makeHighConnexionConfig([
        'dry_run' => true,
        'from_testing' => 'TestSender',
    ]));
    $driver->batchUuid('batch-dry')
        ->from('RealBrand')
        ->to(collect([new SmsRecipient('33612345678', null, 'uuid-x')]))
        ->message(new SmsMessage('Test'));

    $driver->send();

    Http::assertSent(function ($request): bool {
        $data = $request->data();
        expect($data['push']['sender'])->toBe('TestSender');

        return true;
    });
});

it('uses real sender when dry_run is false', function (): void {
    Http::fake(['*' => Http::response([], 200)]);

    $driver = new HighConnexionDriver(makeHighConnexionConfig(['dry_run' => false]));
    $driver->batchUuid('batch-real')
        ->from('RealBrand')
        ->to(collect([new SmsRecipient('33612345678')]))
        ->message(new SmsMessage('Test'));

    $driver->send();

    Http::assertSent(function ($request): bool {
        $data = $request->data();
        expect($data['push']['sender'])->toBe('RealBrand');

        return true;
    });
});

it('uses message content (not contentWithStop) in HighConnexion payload', function (): void {
    Http::fake(['*' => Http::response([], 200)]);

    $driver = new HighConnexionDriver(makeHighConnexionConfig());
    $driver->batchUuid('batch-stop')
        ->from('Sender')
        ->to(collect([new SmsRecipient('33612345678')]))
        ->message(new SmsMessage('Plain content', 'Plain content STOP 36105'));

    $driver->send();

    Http::assertSent(function ($request): bool {
        $data = $request->data();
        // HighConnexion uses message->content (not contentWithStop)
        expect($data['push']['message'][0]['text'])->toBe('Plain content');

        return true;
    });
});

it('throws exception when base_url is missing', function (): void {
    $driver = new HighConnexionDriver(makeHighConnexionConfig(['base_url' => '']));

    expect(fn () => $driver->checkRequiredValues())->toThrow(Exception::class, 'You must provide a base url');
});

it('throws exception when account_id is missing', function (): void {
    $driver = new HighConnexionDriver(makeHighConnexionConfig(['account_id' => '']));

    expect(fn () => $driver->checkRequiredValues())->toThrow(Exception::class, 'You must provide an account_id');
});

it('throws exception when password is missing', function (): void {
    $driver = new HighConnexionDriver(makeHighConnexionConfig(['password' => '']));

    expect(fn () => $driver->checkRequiredValues())->toThrow(Exception::class, 'You must provide a password');
});

it('throws exception when callback_url is missing', function (): void {
    $driver = new HighConnexionDriver(makeHighConnexionConfig(['callback_url' => '']));

    expect(fn () => $driver->checkRequiredValues())->toThrow(Exception::class, 'You must provide a callback url');
});

it('handles HTTP 4xx error response', function (): void {
    Http::fake(['*' => Http::response(['error' => 'Bad Request'], 400)]);

    $driver = new HighConnexionDriver(makeHighConnexionConfig());
    $driver->batchUuid('batch-err')
        ->from('Sender')
        ->to(collect([new SmsRecipient('33612345678')]))
        ->message(new SmsMessage('Test'));

    $response = $driver->send();

    expect($response->status())->toBe(400);
    expect($response->failed())->toBeTrue();
});

it('handles HTTP 5xx error response', function (): void {
    Http::fake(['*' => Http::response([], 503)]);

    $driver = new HighConnexionDriver(makeHighConnexionConfig());
    $driver->batchUuid('batch-err')
        ->from('Sender')
        ->to(collect([new SmsRecipient('33612345678')]))
        ->message(new SmsMessage('Test'));

    $response = $driver->send();

    expect($response->status())->toBe(503);
    expect($response->serverError())->toBeTrue();
});
