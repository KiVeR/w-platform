<?php

declare(strict_types=1);

use App\DTOs\SmsMessage;
use App\DTOs\SmsRecipient;
use App\Services\SmsRouting\Drivers\SinchDriver;
use Illuminate\Support\Facades\Http;

beforeEach(function (): void {
    $this->config = [
        'region' => 'eu',
        'service_plan_id' => 'plan-123',
        'api_token' => 'test-token',
        'callback_url' => 'https://example.com/callback',
        'dry_run' => false,
        'allow_dry_run' => false,
    ];
});

it('builds the correct URL', function (): void {
    $driver = new SinchDriver($this->config);

    expect($driver->getUrl())->toBe('https://eu.sms.api.sinch.com/xms/v1/plan-123/batches');
});

it('appends dry_run to URL when enabled', function (): void {
    $this->config['dry_run'] = true;
    $this->config['allow_dry_run'] = true;
    $driver = new SinchDriver($this->config);

    expect($driver->getUrl())->toBe('https://eu.sms.api.sinch.com/xms/v1/plan-123/batches/dry_run');
});

it('builds correct payload', function (): void {
    $driver = new SinchDriver($this->config);
    $message = new SmsMessage(content: 'Hello world', contentWithStop: 'Hello world STOP 36111');
    $recipients = collect([
        new SmsRecipient(phoneNumber: '+33612345678'),
        new SmsRecipient(phoneNumber: '+33687654321'),
    ]);

    $driver->batchUuid('batch-uuid-123')
        ->from('Wellpack')
        ->to($recipients)
        ->message($message);

    $data = $driver->getData();

    expect($data['from'])->toBe('Wellpack')
        ->and($data['to'])->toBe(['+33612345678', '+33687654321'])
        ->and($data['body'])->toBe('Hello world STOP 36111')
        ->and($data['delivery_report'])->toBe('per_recipient_final')
        ->and($data['type'])->toBe('mt_text')
        ->and($data['callback_url'])->toBe('https://example.com/callback')
        ->and($data['client_reference'])->toBe('batch-uuid-123');
});

it('sends HTTP request with bearer token', function (): void {
    Http::fake([
        'eu.sms.api.sinch.com/*' => Http::response(['id' => 'sinch-batch-id'], 201),
    ]);

    $driver = new SinchDriver($this->config);
    $message = new SmsMessage(content: 'Hello');
    $recipients = collect([new SmsRecipient(phoneNumber: '+33612345678')]);

    $response = $driver->batchUuid('batch-123')
        ->from('Wellpack')
        ->to($recipients)
        ->message($message)
        ->send();

    expect($response->status())->toBe(201)
        ->and($response->json('id'))->toBe('sinch-batch-id');

    Http::assertSent(function ($request): bool {
        return $request->hasHeader('Authorization', 'Bearer test-token')
            && $request->url() === 'https://eu.sms.api.sinch.com/xms/v1/plan-123/batches';
    });
});

it('throws on missing region', function (): void {
    $this->config['region'] = '';
    $driver = new SinchDriver($this->config);
    $driver->checkRequiredValues();
})->throws(Exception::class, 'You must provide a region');

it('throws on missing service plan id', function (): void {
    $this->config['service_plan_id'] = '';
    $driver = new SinchDriver($this->config);
    $driver->checkRequiredValues();
})->throws(Exception::class, 'You must provide a service plan id');

it('throws on missing api token', function (): void {
    $this->config['api_token'] = '';
    $driver = new SinchDriver($this->config);
    $driver->checkRequiredValues();
})->throws(Exception::class, 'You must provide an api token');

it('throws on missing callback url', function (): void {
    $this->config['callback_url'] = '';
    $driver = new SinchDriver($this->config);
    $driver->checkRequiredValues();
})->throws(Exception::class, 'You must provide a callback url');

it('has correct stop number', function (): void {
    expect(SinchDriver::STOP_NUMBER)->toBe('36111');
});
