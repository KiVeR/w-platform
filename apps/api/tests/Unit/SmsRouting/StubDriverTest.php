<?php

declare(strict_types=1);

use App\DTOs\SmsMessage;
use App\DTOs\SmsRecipient;
use App\Services\SmsRouting\Drivers\StubDriver;

it('returns success response', function (): void {
    $driver = new StubDriver;
    $message = new SmsMessage(content: 'Test message');
    $recipients = collect([
        new SmsRecipient(phoneNumber: '+33612345678'),
    ]);

    $response = $driver->batchUuid('stub-batch-123')
        ->from('Wellpack')
        ->to($recipients)
        ->message($message)
        ->send();

    expect($response->successful())->toBeTrue()
        ->and($response->json('success'))->toBeTrue()
        ->and($response->json('batch_id'))->toBe('stub-batch-123');
});

it('does not throw on checkRequiredValues', function (): void {
    $driver = new StubDriver;
    $driver->checkRequiredValues();

    expect(true)->toBeTrue();
});

it('has correct stop number', function (): void {
    expect(StubDriver::STOP_NUMBER)->toBe('00000');
});
