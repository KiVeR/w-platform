<?php

declare(strict_types=1);

namespace App\Services\SmsRouting\Drivers;

use App\Contracts\SmsRoutingDriverInterface;
use App\DTOs\SmsRecipient;
use App\Services\SmsRouting\Concerns\HasSmsRoutingState;
use Exception;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class InfobipDriver implements SmsRoutingDriverInterface
{
    use HasSmsRoutingState;

    public const string STOP_NUMBER = '36173';

    /** @param array{base_url: string, api_token: string, notify_url: string, dry_run: bool, from_testing: string} $config */
    public function __construct(protected array $config) {}

    public function send(): Response
    {
        return Http::acceptJson()
            ->withToken($this->config['api_token'], 'App')
            ->post($this->getUrl(), $this->getData());
    }

    public function getUrl(): string
    {
        return "https://{$this->config['base_url']}.api.infobip.com/sms/3/messages";
    }

    /** @return array<string, mixed> */
    public function getData(): array
    {
        $messages = $this->recipients?->map(function (SmsRecipient $recipient): array {
            return [
                'sender' => $this->config['dry_run'] === false ? $this->fromValue : $this->config['from_testing'],
                'destinations' => [['to' => $recipient->phoneNumber]],
                'content' => ['text' => $recipient->messagePreview ?? $this->smsMessage?->getContentWithStop() ?? ''],
                'webhooks' => [
                    'delivery' => ['url' => $this->config['notify_url']],
                    'contentType' => 'application/json',
                    'callbackData' => $this->batchUuidValue,
                ],
            ];
        })->toArray() ?? [];

        return [
            'messages' => $messages,
            'options' => ['schedule' => ['bulkId' => $this->batchUuidValue]],
        ];
    }

    public function checkRequiredValues(): void
    {
        if (empty($this->config['base_url'])) {
            throw new Exception('You must provide a base url');
        }
        if (empty($this->config['api_token'])) {
            throw new Exception('You must provide an api token');
        }
    }
}
