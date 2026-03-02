<?php

declare(strict_types=1);

use App\Models\DeliveryReport;

it('stores a sinch delivery report', function (): void {
    $payload = [
        'type' => 'recipient_delivery_report_sms',
        'status' => 'delivered',
        'recipient' => '+33612345678',
        'client_reference' => 'batch-uuid-123',
        'at' => '2026-03-01T12:00:00Z',
    ];

    $response = $this->postJson('/api/webhooks/sinch', $payload);

    $response->assertOk();
    expect(DeliveryReport::count())->toBe(1);

    $report = DeliveryReport::first();
    expect($report)
        ->provider->toBe('sinch')
        ->digested->toBeFalse()
        ->report->toEqual($payload);
});

it('stores an infobip delivery report', function (): void {
    $payload = [
        'to' => '33612345678',
        'status' => ['groupName' => 'DELIVERED'],
        'callbackData' => 'batch-uuid-456',
        'doneAt' => '2026-03-01T12:00:00Z',
    ];

    $response = $this->postJson('/api/webhooks/infobip', $payload);

    $response->assertOk();

    $report = DeliveryReport::first();
    expect($report)
        ->provider->toBe('infobip')
        ->digested->toBeFalse();
});

it('stores a highconnexion delivery report', function (): void {
    $payload = [
        'event' => ['event_status' => 'DLR', 'event_date' => '2026-03-01T12:00:00Z'],
        'sms' => ['sms_msisdn' => '+33612345678', 'sms_status' => 'RECEIVED'],
    ];

    $response = $this->postJson('/api/webhooks/highconnexion', $payload);

    $response->assertOk();

    $report = DeliveryReport::first();
    expect($report)
        ->provider->toBe('highconnexion')
        ->digested->toBeFalse();
});

it('handles array of reports from a single provider', function (): void {
    $payload = [
        ['type' => 'recipient_delivery_report_sms', 'status' => 'delivered', 'recipient' => '+33600000001'],
        ['type' => 'recipient_delivery_report_sms', 'status' => 'failed', 'recipient' => '+33600000002'],
    ];

    $response = $this->postJson('/api/webhooks/sinch', $payload);

    $response->assertOk();
    expect(DeliveryReport::count())->toBe(2);
    expect(DeliveryReport::where('provider', 'sinch')->count())->toBe(2);
});

it('webhooks are public and require no authentication', function (): void {
    // No Passport::actingAs or actingAsClient — should still work
    $response = $this->postJson('/api/webhooks/sinch', [
        'type' => 'test',
        'status' => 'delivered',
    ]);

    $response->assertOk();
});
