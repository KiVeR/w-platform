<?php

declare(strict_types=1);

namespace App\Services\SmsRouting\Drivers;

use App\Contracts\SmsRoutingDriverInterface;
use App\Services\SmsRouting\Concerns\HasSmsRoutingState;
use Exception;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class SinchDriver implements SmsRoutingDriverInterface
{
    use HasSmsRoutingState;

    public const string STOP_NUMBER = '36111';

    /** @param array{region: string, service_plan_id: string, api_token: string, callback_url: string, dry_run: bool, allow_dry_run: bool} $config */
    public function __construct(protected array $config) {}

    public function send(): Response
    {
        return Http::acceptJson()
            ->withToken($this->config['api_token'])
            ->post($this->getUrl(), $this->getData());
    }

    public function getUrl(): string
    {
        $region = $this->config['region'];
        $servicePlan = $this->config['service_plan_id'];
        $url = "https://{$region}.sms.api.sinch.com/xms/v1/{$servicePlan}/batches";

        if ($this->config['dry_run'] && $this->config['allow_dry_run'] === true) {
            $url .= '/dry_run';
        }

        return $url;
    }

    /** @return array<string, mixed> */
    public function getData(): array
    {
        return [
            'from' => $this->fromValue,
            'to' => $this->recipients?->pluck('phoneNumber')->toArray() ?? [],
            'body' => $this->smsMessage?->getContentWithStop() ?? '',
            'delivery_report' => 'per_recipient_final',
            'type' => 'mt_text',
            'callback_url' => $this->config['callback_url'],
            'client_reference' => $this->batchUuidValue,
        ];
    }

    public function checkRequiredValues(): void
    {
        if (empty($this->config['region'])) {
            throw new Exception('You must provide a region');
        }
        if (empty($this->config['service_plan_id'])) {
            throw new Exception('You must provide a service plan id');
        }
        if (empty($this->config['api_token'])) {
            throw new Exception('You must provide an api token');
        }
        if (empty($this->config['callback_url'])) {
            throw new Exception('You must provide a callback url');
        }
    }
}
