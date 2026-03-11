<?php

declare(strict_types=1);

namespace App\Jobs\SmsRouting;

use App\Enums\CampaignRecipientStatus;
use App\Enums\CampaignRoutingStatus;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\CampaignRequestData;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use JsonMachine\Items;
use JsonMachine\JsonDecoder\ExtJsonDecoder;

class QueryLogicMakeJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $timeout;

    public bool $failOnTimeout;

    public function __construct(
        public readonly int $campaignId,
    ) {
        $this->onQueue('default');
        $this->timeout = (int) config('sms-routing.query_timeout', 1800);
        $this->failOnTimeout = (bool) config('sms-routing.query_fail_on_timeout', true);
    }

    public function uniqueId(): int
    {
        return $this->campaignId;
    }

    public function handle(): void
    {
        set_time_limit($this->timeout + 10);

        $campaign = Campaign::where('id', $this->campaignId)
            ->select(['id', 'routing_status', 'targeting'])
            ->firstOrFail();

        if ($campaign->routing_status !== CampaignRoutingStatus::QueryPending) {
            return;
        }

        $campaign->update(['routing_status' => CampaignRoutingStatus::QueryInProgress]);

        try {
            $response = Http::asForm()
                ->timeout($this->timeout)
                ->post(config('services.wepak.wedata_url'), [
                    'data' => json_encode($campaign->targeting),
                    'api_key' => config('services.wepak.api_key'),
                ]);

            if (! $response->successful()) {
                $this->markFailed($campaign, "Wepak API returned HTTP {$response->status()}");

                return;
            }

            $this->processResponse($campaign, $response->body());

        } catch (\Throwable $e) {
            $this->markFailed($campaign, $e->getMessage());

            throw $e;
        }
    }

    private function processResponse(Campaign $campaign, string $body): void
    {
        DB::beginTransaction();

        try {
            // Store raw response in campaign_request_data for reference
            CampaignRequestData::create([
                'campaign_id' => $campaign->id,
                'data' => json_decode($body, true) ?: [],
            ]);

            // Stream-parse recipients from JSON response
            $items = Items::fromString($body, [
                'decoder' => new ExtJsonDecoder(true),
            ]);

            $batch = [];
            $batchSize = 500;

            foreach ($items as $item) {
                if (! is_array($item) || ! isset($item['phone_number'])) {
                    continue;
                }

                $batch[] = [
                    'campaign_id' => $campaign->id,
                    'status' => CampaignRecipientStatus::Queued->value,
                    'phone_number' => $item['phone_number'],
                    'additional_information' => json_encode(
                        collect($item)->except('phone_number')->toArray()
                    ),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                if (count($batch) >= $batchSize) {
                    CampaignRecipient::insert($batch);
                    $batch = [];
                }
            }

            if ($batch !== []) {
                CampaignRecipient::insert($batch);
            }

            $recipientCount = $campaign->campaignRecipients()->count();

            if ($recipientCount === 0) {
                DB::rollBack();
                $this->markFailed($campaign, 'No recipients found in Wepak response');

                return;
            }

            $campaign->update([
                'routing_status' => CampaignRoutingStatus::MessageGenerationPending,
            ]);

            DB::commit();

            Log::info("QueryLogicMakeJob: campaign {$campaign->id} — {$recipientCount} recipients created");

        } catch (\Throwable $e) {
            DB::rollBack();
            $this->markFailed($campaign, $e->getMessage());

            throw $e;
        }
    }

    private function markFailed(Campaign $campaign, string $reason): void
    {
        $campaign->update(['routing_status' => CampaignRoutingStatus::QueryFailed]);

        Log::error("QueryLogicMakeJob failed for campaign {$campaign->id}: {$reason}");

        // Clean up any partially created recipients
        $campaign->campaignRecipients()->delete();
    }
}
