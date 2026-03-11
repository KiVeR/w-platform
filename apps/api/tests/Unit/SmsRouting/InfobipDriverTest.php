<?php

declare(strict_types=1);

use App\DTOs\SmsMessage;
use App\DTOs\SmsRecipient;
use App\Services\SmsRouting\Drivers\InfobipDriver;
use Illuminate\Support\Facades\Http;

beforeEach(function (): void {
    $this->config = [
        'base_url' => 'abc123',
        'api_token' => 'infobip-token',
        'notify_url' => 'https://example.com/webhook',
        'dry_run' => false,
        'from_testing' => 'InfoSMS',
    ];
});

it('builds the correct URL', function (): void {
    $driver = new InfobipDriver($this->config);

    expect($driver->getUrl())->toBe('https://abc123.api.infobip.com/sms/3/messages');
});

it('builds correct payload with per-recipient messages', function (): void {
    $driver = new InfobipDriver($this->config);
    $message = new SmsMessage(content: 'Hello', contentWithStop: 'Hello STOP 36173');
    $recipients = collect([
        new SmsRecipient(phoneNumber: '+33612345678', messagePreview: 'Hello John STOP 36173'),
        new SmsRecipient(phoneNumber: '+33687654321', messagePreview: 'Hello Jane STOP 36173'),
    ]);

    $driver->batchUuid('batch-uuid-456')
        ->from('Wellpack')
        ->to($recipients)
        ->message($message);

    $data = $driver->getData();

    expect($data['messages'])->toHaveCount(2)
        ->and($data['messages'][0]['sender'])->toBe('Wellpack')
        ->and($data['messages'][0]['destinations'][0]['to'])->toBe('+33612345678')
        ->and($data['messages'][0]['content']['text'])->toBe('Hello John STOP 36173')
        ->and($data['messages'][0]['webhooks']['delivery']['url'])->toBe('https://example.com/webhook')
        ->and($data['messages'][0]['webhooks']['callbackData'])->toBe('batch-uuid-456')
        ->and($data['messages'][1]['content']['text'])->toBe('Hello Jane STOP 36173')
        ->and($data['options']['schedule']['bulkId'])->toBe('batch-uuid-456');
});

it('uses from_testing sender in dry_run mode', function (): void {
    $this->config['dry_run'] = true;
    $driver = new InfobipDriver($this->config);
    $message = new SmsMessage(content: 'Test');
    $recipients = collect([new SmsRecipient(phoneNumber: '+33612345678')]);

    $driver->batchUuid('batch-dry')
        ->from('Wellpack')
        ->to($recipients)
        ->message($message);

    $data = $driver->getData();

    expect($data['messages'][0]['sender'])->toBe('InfoSMS');
});

it('falls back to message content when no messagePreview', function (): void {
    $driver = new InfobipDriver($this->config);
    $message = new SmsMessage(content: 'Hello', contentWithStop: 'Hello STOP 36173');
    $recipients = collect([new SmsRecipient(phoneNumber: '+33612345678')]);

    $driver->batchUuid('batch-fb')
        ->from('Wellpack')
        ->to($recipients)
        ->message($message);

    $data = $driver->getData();

    expect($data['messages'][0]['content']['text'])->toBe('Hello STOP 36173');
});

it('sends HTTP request with App token', function (): void {
    Http::fake([
        'abc123.api.infobip.com/*' => Http::response(['messages' => [['messageId' => 'msg-1']]], 200),
    ]);

    $driver = new InfobipDriver($this->config);
    $message = new SmsMessage(content: 'Hello');
    $recipients = collect([new SmsRecipient(phoneNumber: '+33612345678')]);

    $response = $driver->batchUuid('batch-789')
        ->from('Wellpack')
        ->to($recipients)
        ->message($message)
        ->send();

    expect($response->status())->toBe(200);

    Http::assertSent(function ($request): bool {
        return $request->hasHeader('Authorization', 'App infobip-token')
            && $request->url() === 'https://abc123.api.infobip.com/sms/3/messages';
    });
});

it('throws on missing base url', function (): void {
    $this->config['base_url'] = '';
    $driver = new InfobipDriver($this->config);
    $driver->checkRequiredValues();
})->throws(Exception::class, 'You must provide a base url');

it('throws on missing api token', function (): void {
    $this->config['api_token'] = '';
    $driver = new InfobipDriver($this->config);
    $driver->checkRequiredValues();
})->throws(Exception::class, 'You must provide an api token');

it('has correct stop number', function (): void {
    expect(InfobipDriver::STOP_NUMBER)->toBe('36173');
});
