<?php

declare(strict_types=1);

use App\DTOs\SmsMessage;
use App\DTOs\SmsRecipient;
use App\Services\SmsRouting\Drivers\HighConnexionDriver;
use Illuminate\Support\Facades\Http;

beforeEach(function (): void {
    $this->config = [
        'base_url' => 'sms',
        'account_id' => 'acc-123',
        'password' => 'secret-pass',
        'callback_url' => 'https://example.com/hc-webhook',
        'dry_run' => false,
        'from_testing' => 'TestSMS',
    ];
});

it('builds the correct URL', function (): void {
    $driver = new HighConnexionDriver($this->config);

    expect($driver->getUrl())->toBe('https://sms.hcnx.eu/api');
});

it('builds correct payload', function (): void {
    $driver = new HighConnexionDriver($this->config);
    $message = new SmsMessage(content: 'Hello from HC');
    $recipients = collect([
        new SmsRecipient(phoneNumber: '+33612345678', uuid: 'r-uuid-1'),
        new SmsRecipient(phoneNumber: '+33687654321', uuid: 'r-uuid-2'),
    ]);

    $driver->batchUuid('batch-hc-123')
        ->from('Wellpack')
        ->to($recipients)
        ->message($message);

    $data = $driver->getData();

    expect($data['push']['accountid'])->toBe('acc-123')
        ->and($data['push']['password'])->toBe('secret-pass')
        ->and($data['push']['sender'])->toBe('Wellpack')
        ->and($data['push']['ret_id'])->toBe('batch-hc-123')
        ->and($data['push']['webhook_url'])->toBe('https://example.com/hc-webhook')
        ->and($data['push']['message'])->toHaveCount(1)
        ->and($data['push']['message'][0]['text'])->toBe('Hello from HC')
        ->and($data['push']['message'][0]['to'])->toHaveCount(2)
        ->and($data['push']['message'][0]['to'][0]['value'])->toBe('+33612345678')
        ->and($data['push']['message'][0]['to'][0]['ret_id'])->toBe('r-uuid-1')
        ->and($data['push']['message'][0]['to'][0]['param'])->toBe([])
        ->and($data['push']['message'][0]['to'][1]['value'])->toBe('+33687654321')
        ->and($data['push']['message'][0]['to'][1]['ret_id'])->toBe('r-uuid-2');
});

it('uses from_testing sender in dry_run mode', function (): void {
    $this->config['dry_run'] = true;
    $driver = new HighConnexionDriver($this->config);
    $message = new SmsMessage(content: 'Test');
    $recipients = collect([new SmsRecipient(phoneNumber: '+33612345678')]);

    $driver->batchUuid('batch-dry')
        ->from('Wellpack')
        ->to($recipients)
        ->message($message);

    $data = $driver->getData();

    expect($data['push']['sender'])->toBe('TestSMS');
});

it('sends HTTP request', function (): void {
    Http::fake([
        'sms.hcnx.eu/*' => Http::response(['status' => 'ok'], 200),
    ]);

    $driver = new HighConnexionDriver($this->config);
    $message = new SmsMessage(content: 'Hello');
    $recipients = collect([new SmsRecipient(phoneNumber: '+33612345678')]);

    $response = $driver->batchUuid('batch-hc')
        ->from('Wellpack')
        ->to($recipients)
        ->message($message)
        ->send();

    expect($response->status())->toBe(200);

    Http::assertSent(function ($request): bool {
        return $request->url() === 'https://sms.hcnx.eu/api';
    });
});

it('throws on missing base url', function (): void {
    $this->config['base_url'] = '';
    $driver = new HighConnexionDriver($this->config);
    $driver->checkRequiredValues();
})->throws(Exception::class, 'You must provide a base url');

it('throws on missing account_id', function (): void {
    $this->config['account_id'] = '';
    $driver = new HighConnexionDriver($this->config);
    $driver->checkRequiredValues();
})->throws(Exception::class, 'You must provide an account_id');

it('throws on missing password', function (): void {
    $this->config['password'] = '';
    $driver = new HighConnexionDriver($this->config);
    $driver->checkRequiredValues();
})->throws(Exception::class, 'You must provide a password');

it('throws on missing callback url', function (): void {
    $this->config['callback_url'] = '';
    $driver = new HighConnexionDriver($this->config);
    $driver->checkRequiredValues();
})->throws(Exception::class, 'You must provide a callback url');

it('has correct stop number', function (): void {
    expect(HighConnexionDriver::STOP_NUMBER)->toBe('36105');
});
