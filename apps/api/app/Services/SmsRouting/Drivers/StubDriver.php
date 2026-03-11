<?php

declare(strict_types=1);

namespace App\Services\SmsRouting\Drivers;

use App\Contracts\SmsRoutingDriverInterface;
use App\Services\SmsRouting\Concerns\HasSmsRoutingState;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class StubDriver implements SmsRoutingDriverInterface
{
    use HasSmsRoutingState;

    public const string STOP_NUMBER = '00000';

    public function send(): Response
    {
        Http::fake([
            'stub-sms-routing/*' => Http::response(['success' => true, 'batch_id' => $this->batchUuidValue]),
        ]);

        /** @var Response */
        return Http::post('https://stub-sms-routing/send', [
            'batch_uuid' => $this->batchUuidValue,
            'from' => $this->fromValue,
            'recipients_count' => $this->recipients?->count() ?? 0,
        ]);
    }

    public function checkRequiredValues(): void
    {
        // No validation needed for stub driver
    }
}
