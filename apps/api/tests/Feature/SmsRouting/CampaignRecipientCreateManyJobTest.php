<?php

declare(strict_types=1);

use App\Enums\CampaignRecipientStatus;
use App\Jobs\SmsRouting\CampaignRecipientCreateManyJob;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\CampaignRequestData;

describe('CampaignRecipientCreateManyJob', function (): void {
    it('creates recipients from campaign request data', function (): void {
        $campaign = Campaign::factory()->create();
        $requestData = CampaignRequestData::factory()->create([
            'campaign_id' => $campaign->id,
            'data' => [
                ['phone_number' => '+33612345678', 'civility' => 'M'],
                ['phone_number' => '+33698765432', 'civility' => 'F'],
                ['phone_number' => '+33655555555'],
            ],
        ]);

        $job = new CampaignRecipientCreateManyJob($campaign->id, $requestData->id);
        $job->handle();

        $recipients = CampaignRecipient::where('campaign_id', $campaign->id)->get();

        expect($recipients)->toHaveCount(3);
        expect($recipients->first()->status)->toBe(CampaignRecipientStatus::Queued);
        expect($recipients->first()->phone_number)->toBe('+33612345678');
    });

    it('skips items without phone_number', function (): void {
        $campaign = Campaign::factory()->create();
        $requestData = CampaignRequestData::factory()->create([
            'campaign_id' => $campaign->id,
            'data' => [
                ['phone_number' => '+33612345678'],
                ['civility' => 'M'], // no phone_number
                ['name' => 'John'], // no phone_number
            ],
        ]);

        $job = new CampaignRecipientCreateManyJob($campaign->id, $requestData->id);
        $job->handle();

        $recipients = CampaignRecipient::where('campaign_id', $campaign->id)->get();

        expect($recipients)->toHaveCount(1);
        expect($recipients->first()->phone_number)->toBe('+33612345678');
    });

    it('stores additional information as json', function (): void {
        $campaign = Campaign::factory()->create();
        $requestData = CampaignRequestData::factory()->create([
            'campaign_id' => $campaign->id,
            'data' => [
                ['phone_number' => '+33612345678', 'civility' => 'M', 'age' => 35],
            ],
        ]);

        $job = new CampaignRecipientCreateManyJob($campaign->id, $requestData->id);
        $job->handle();

        $recipient = CampaignRecipient::where('campaign_id', $campaign->id)->first();

        // additional_information is cast to array by Eloquent
        expect($recipient->additional_information)->toEqual(['civility' => 'M', 'age' => 35]);
    });

    it('handles empty data array gracefully', function (): void {
        $campaign = Campaign::factory()->create();
        $requestData = CampaignRequestData::factory()->create([
            'campaign_id' => $campaign->id,
            'data' => [],
        ]);

        $job = new CampaignRecipientCreateManyJob($campaign->id, $requestData->id);
        $job->handle();

        expect(CampaignRecipient::where('campaign_id', $campaign->id)->count())->toBe(0);
    });

    it('handles large datasets with chunking', function (): void {
        $campaign = Campaign::factory()->create();

        $items = [];
        for ($i = 0; $i < 600; $i++) {
            $items[] = ['phone_number' => '+336'.str_pad((string) $i, 8, '0', STR_PAD_LEFT)];
        }

        $requestData = CampaignRequestData::factory()->create([
            'campaign_id' => $campaign->id,
            'data' => $items,
        ]);

        $job = new CampaignRecipientCreateManyJob($campaign->id, $requestData->id);
        $job->handle();

        // Should insert all 600 records across multiple chunks of 500
        expect(CampaignRecipient::where('campaign_id', $campaign->id)->count())->toBe(600);
    });
});
