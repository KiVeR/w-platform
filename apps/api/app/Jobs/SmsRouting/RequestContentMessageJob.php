<?php

declare(strict_types=1);

namespace App\Jobs\SmsRouting;

use App\Enums\CampaignRecipientStatus;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use Illuminate\Bus\Batchable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Merged port of RequestContentMessageJob + InsertContentMessageJob from trigger-api.
 *
 * Retrieves the campaign message template, iterates over recipients,
 * interpolates variables from VariableSchema global_data + recipient
 * additional_information, and saves message_preview on each CampaignRecipient.
 */
class RequestContentMessageJob implements ShouldBeUnique, ShouldQueue
{
    use Batchable, Queueable;

    public function __construct(
        public readonly int $campaignId,
    ) {}

    public function uniqueId(): int
    {
        return $this->campaignId;
    }

    public function handle(): void
    {
        if ($this->batch()?->cancelled()) {
            return;
        }

        $campaign = Campaign::where('id', $this->campaignId)
            ->select(['id', 'message', 'variable_schema_id'])
            ->with(['variableSchema'])
            ->firstOrFail();

        $messageTemplate = $campaign->message ?? '';

        if ($messageTemplate === '') {
            Log::warning("RequestContentMessageJob: campaign {$this->campaignId} has no message template");

            return;
        }

        $processed = 0;

        $campaign->campaignRecipients()
            ->where('status', CampaignRecipientStatus::Queued)
            ->chunkById(500, function ($recipients) use ($messageTemplate, &$processed): void {
                foreach ($recipients as $recipient) {
                    try {
                        $preview = $this->interpolateMessage($messageTemplate, $recipient);
                        $recipient->update([
                            'message_preview' => $preview,
                            'message_preview_length' => mb_strlen($preview),
                        ]);
                        $processed++;
                    } catch (\Throwable $e) {
                        $recipient->update([
                            'status' => CampaignRecipientStatus::Failed,
                        ]);
                        Log::error("RequestContentMessageJob: failed for recipient {$recipient->id}", [
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            });

        Log::info("RequestContentMessageJob: campaign {$this->campaignId} — {$processed} messages generated");
    }

    private function interpolateMessage(string $template, CampaignRecipient $recipient): string
    {
        $variables = $recipient->getMergedAdditionalInformation();

        return preg_replace_callback('/\{\{(\w+)\}\}/', function (array $matches) use ($variables): string {
            $key = $matches[1];

            return (string) ($variables[$key] ?? $matches[0]);
        }, $template) ?? $template;
    }
}
