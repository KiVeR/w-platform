<?php

declare(strict_types=1);

namespace App\Jobs\SmsRouting;

use App\Enums\CampaignRecipientStatus;
use App\Models\CampaignRecipient;
use App\Models\DeliveryReport;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class DigestDeliveryReportsJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $provider,
    ) {
        $this->onQueue('report');
    }

    public function uniqueId(): string
    {
        return "digest-{$this->provider}";
    }

    public function handle(): void
    {
        $processed = 0;

        DeliveryReport::where('provider', $this->provider)
            ->where('digested', false)
            ->orderBy('id')
            ->chunk(100, function ($reports) use (&$processed): void {
                $updates = [];

                foreach ($reports as $report) {
                    $update = $this->digestReport($report);

                    if ($update !== null) {
                        $updates[] = $update;
                    }

                    $report->update(['digested' => true]);
                }

                // Batch update recipients
                foreach ($updates as $update) {
                    $recipientId = $update['id'];
                    unset($update['id']);
                    CampaignRecipient::where('id', $recipientId)->update($update);
                }

                $processed += $reports->count();
            });

        Log::info("DigestDeliveryReportsJob: processed {$processed} {$this->provider} reports");
    }

    /**
     * @return array<string, mixed>|null
     */
    private function digestReport(DeliveryReport $deliveryReport): ?array
    {
        return match ($this->provider) {
            'sinch' => $this->digestSinch($deliveryReport->report),
            'infobip' => $this->digestInfobip($deliveryReport->report),
            'highconnexion' => $this->digestHighConnexion($deliveryReport->report),
            default => null,
        };
    }

    /**
     * @param  array<string, mixed>  $report
     * @return array<string, mixed>|null
     */
    private function digestSinch(array $report): ?array
    {
        $type = $report['type'] ?? null;

        if ($type === 'recipient_delivery_report_sms') {
            $recipient = $this->findRecipientByPhoneAndBatch(
                $report['recipient'] ?? '',
                $report['client_reference'] ?? '',
            );

            if ($recipient === null) {
                return null;
            }

            $data = ['id' => $recipient->id];
            $status = $this->mapSinchStatus($report['status'] ?? '');

            if ($status !== null) {
                $data['status'] = $status->value;

                if ($status === CampaignRecipientStatus::Delivered && isset($report['at'])) {
                    $data['delivered_at'] = Carbon::parse($report['at']);
                }
            }

            return $data;
        }

        if ($type === 'mo_text') {
            $recipient = $this->findRecipientByPhoneAndBatch(
                $report['from'] ?? '',
                $report['client_reference'] ?? '',
            );

            if ($recipient === null) {
                return null;
            }

            if ($this->isStopRequest($report['body'] ?? '')) {
                return [
                    'id' => $recipient->id,
                    'stop_requested_at' => Carbon::parse($report['sent_at'] ?? now()),
                ];
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $report
     * @return array<string, mixed>|null
     */
    private function digestInfobip(array $report): ?array
    {
        $isDeliveryReport = isset($report['status']);
        $batchId = $report['callbackData'] ?? '';

        $phone = $isDeliveryReport
            ? '+'.($report['to'] ?? '')
            : '+'.($report['from'] ?? '');

        $recipient = CampaignRecipient::where('routing_batch_uuid', $batchId)
            ->where('phone_number', $phone)
            ->select(['id'])
            ->first();

        if ($recipient === null) {
            return null;
        }

        $data = ['id' => $recipient->id];

        if ($isDeliveryReport) {
            $groupName = strtoupper((string) ($report['status']['groupName'] ?? ''));
            $status = match ($groupName) {
                'DELIVERED' => CampaignRecipientStatus::Delivered,
                'UNDELIVERABLE' => CampaignRecipientStatus::Undeliverable,
                'EXPIRED' => CampaignRecipientStatus::Expired,
                'REJECTED' => CampaignRecipientStatus::Rejected,
                default => null,
            };

            if ($status !== null) {
                $data['status'] = $status->value;

                if ($status === CampaignRecipientStatus::Delivered && isset($report['doneAt'])) {
                    $data['delivered_at'] = Carbon::parse($report['doneAt']);
                }
            }
        } else {
            if ($this->isStopRequest($report['text'] ?? '')) {
                $data['stop_requested_at'] = Carbon::parse($report['receivedAt'] ?? now());
            }
        }

        return count($data) > 1 ? $data : null;
    }

    /**
     * @param  array<string, mixed>  $report
     * @return array<string, mixed>|null
     */
    private function digestHighConnexion(array $report): ?array
    {
        $eventStatus = $report['event']['event_status'] ?? '';
        $sms = $report['sms'] ?? [];
        $smsStatus = $sms['sms_status'] ?? '';

        $recipient = CampaignRecipient::where('phone_number', $sms['sms_msisdn'] ?? '')
            ->select(['id'])
            ->first();

        if ($recipient === null) {
            return null;
        }

        $data = ['id' => $recipient->id];
        $status = null;

        if ($eventStatus === 'MT') {
            $status = match ($smsStatus) {
                'SENT' => CampaignRecipientStatus::Dispatched,
                'ERROR_INVOP', 'ERROR_NOCREDIT', 'ERROR_BLACKLIST', 'ERROR_BADPASSWORD', 'ERROR_UNKNOWN' => CampaignRecipientStatus::Failed,
                default => null,
            };
        } elseif ($eventStatus === 'DLR') {
            $status = match ($smsStatus) {
                'SENT' => CampaignRecipientStatus::Dispatched,
                'RECEIVED' => CampaignRecipientStatus::Delivered,
                'ERROR_EXPIRED' => CampaignRecipientStatus::Expired,
                'ERROR_NPAI', 'ERROR_NPAIPORTED' => CampaignRecipientStatus::Undeliverable,
                'ERROR_INVOP', 'ERROR_NETWORK', 'ERROR_CREDIT', 'ERROR_UNKNOWN' => CampaignRecipientStatus::Failed,
                default => null,
            };

            if ($status === CampaignRecipientStatus::Delivered) {
                $data['delivered_at'] = Carbon::parse($report['event']['event_date'] ?? now());
            }
        } elseif ($eventStatus === 'MO' && $smsStatus === 'INCOMING') {
            if ($this->isStopRequest($sms['sms_response'] ?? '')) {
                $data['stop_requested_at'] = Carbon::parse($report['event']['event_date'] ?? now());
            }
        }

        if ($status !== null) {
            $data['status'] = $status->value;
        }

        return count($data) > 1 ? $data : null;
    }

    private function mapSinchStatus(string $rawStatus): ?CampaignRecipientStatus
    {
        return match (strtolower($rawStatus)) {
            'delivered' => CampaignRecipientStatus::Delivered,
            'rejected' => CampaignRecipientStatus::Rejected,
            'failed' => CampaignRecipientStatus::Failed,
            'expired' => CampaignRecipientStatus::Expired,
            'aborted', 'cancelled', 'deleted', 'unknown' => CampaignRecipientStatus::Canceled,
            default => null,
        };
    }

    private function findRecipientByPhoneAndBatch(string $phone, string $batchUuid): ?CampaignRecipient
    {
        return CampaignRecipient::where('phone_number', $phone)
            ->where('routing_batch_uuid', $batchUuid)
            ->select(['id'])
            ->first();
    }

    private function isStopRequest(string $body): bool
    {
        return str_contains(strtoupper(trim($body)), 'STOP');
    }
}
