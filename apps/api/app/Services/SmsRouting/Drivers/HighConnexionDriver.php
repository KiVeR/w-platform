<?php

declare(strict_types=1);

namespace App\Services\SmsRouting\Drivers;

use App\Contracts\SmsRoutingDriverInterface;
use App\DTOs\SmsRecipient;
use App\Services\SmsRouting\Concerns\HasSmsRoutingState;
use Exception;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class HighConnexionDriver implements SmsRoutingDriverInterface
{
    use HasSmsRoutingState;

    public const string STOP_NUMBER = '36105';

    /** @param array{base_url: string, account_id: string, password: string, callback_url: string, dry_run: bool, from_testing: string} $config */
    public function __construct(protected array $config) {}

    public function send(): Response
    {
        return Http::acceptJson()->post($this->getUrl(), $this->getData());
    }

    public function getUrl(): string
    {
        return "https://{$this->config['base_url']}.hcnx.eu/api";
    }

    /** @return array<string, mixed> */
    public function getData(): array
    {
        $messageText = $this->smsMessage?->content ?? '';
        $recipients = $this->getRecipientsPayload();
        $sender = $this->config['dry_run'] === false ? $this->fromValue : $this->config['from_testing'];

        return [
            'push' => [
                'accountid' => $this->config['account_id'],
                'password' => $this->config['password'],
                'sender' => $sender,
                'ret_id' => $this->batchUuidValue,
                'webhook_url' => $this->config['callback_url'],
                'message' => [['text' => $messageText, 'to' => $recipients]],
            ],
        ];
    }

    /** @return list<array{value: string, ret_id: string|null, param: list<never>}> */
    private function getRecipientsPayload(): array
    {
        return $this->recipients?->map(function (SmsRecipient $recipient): array {
            return [
                'value' => $recipient->phoneNumber,
                'ret_id' => $recipient->uuid,
                'param' => [],
            ];
        })->toArray() ?? [];
    }

    public function checkRequiredValues(): void
    {
        if (empty($this->config['base_url'])) {
            throw new Exception('You must provide a base url');
        }
        if (empty($this->config['account_id'])) {
            throw new Exception('You must provide an account_id');
        }
        if (empty($this->config['password'])) {
            throw new Exception('You must provide a password');
        }
        if (empty($this->config['callback_url'])) {
            throw new Exception('You must provide a callback url');
        }
    }
}
