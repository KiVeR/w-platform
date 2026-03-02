<?php

declare(strict_types=1);

use App\Enums\CampaignRecipientStatus;
use App\Enums\CampaignRoutingStatus;
use App\Enums\CampaignStatus;
use App\Jobs\SmsRouting\DigestDeliveryReportsJob;
use App\Jobs\SmsRouting\QueryLogicMakeJob;
use App\Jobs\SmsRouting\RoutingLogicSendJob;
use App\Jobs\SmsRouting\RoutingLogicStartJob;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\CampaignRequestData;
use App\Models\DeliveryReport;
use App\Models\Router;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSinchRoutingConfig(array $overrides = []): array
{
    return array_merge([
        'region' => 'eu',
        'service_plan_id' => 'test-plan',
        'api_token' => 'test-token',
        'callback_url' => 'https://example.com/sinch/callback',
        'dry_run' => false,
        'allow_dry_run' => false,
    ], $overrides);
}

function configureWepak(): void
{
    config([
        'services.wepak.wedata_url' => 'https://wedata.test/smsenvoi.php',
        'services.wepak.api_key' => 'test-api-key',
    ]);
}

function configureSinchRouting(): void
{
    config([
        'sms-routing.default' => 'sinch',
        'sms-routing.drivers.sinch' => makeSinchRoutingConfig(),
    ]);
}

// ─── Test 1: QueryLogicMakeJob creates recipients from Wepak response ────────

it('query logic make job creates recipients from wepak response', function (): void {
    configureWepak();

    Http::fake([
        '*wedata*' => Http::response(json_encode([
            ['phone_number' => '+33612345678', 'age' => 35, 'gender' => 'homme'],
            ['phone_number' => '+33698765432', 'age' => 42, 'gender' => 'femme'],
        ])),
    ]);

    $campaign = Campaign::factory()->create([
        'routing_status' => CampaignRoutingStatus::QueryPending,
        'targeting' => ['liste_cp_dept' => [['label' => '75', 'dept' => '75']]],
        'status' => CampaignStatus::SCHEDULED,
    ]);

    (new QueryLogicMakeJob($campaign->id))->handle();

    $campaign->refresh();

    expect($campaign->routing_status)->toBe(CampaignRoutingStatus::MessageGenerationPending);
    expect($campaign->campaignRecipients()->count())->toBe(2);

    $recipients = $campaign->campaignRecipients()->orderBy('phone_number')->get();
    expect($recipients->pluck('phone_number')->sort()->values()->toArray())
        ->toBe(['+33612345678', '+33698765432']);
    expect($recipients->every(fn ($r) => $r->status === CampaignRecipientStatus::Queued))->toBeTrue();

    expect(CampaignRequestData::where('campaign_id', $campaign->id)->exists())->toBeTrue();
});

it('query logic make job stores raw response in campaign request data', function (): void {
    configureWepak();

    $responseData = [
        ['phone_number' => '+33611223344'],
    ];

    Http::fake([
        '*wedata*' => Http::response(json_encode($responseData)),
    ]);

    $campaign = Campaign::factory()->create([
        'routing_status' => CampaignRoutingStatus::QueryPending,
        'targeting' => ['liste_cp_dept' => [['label' => '77', 'dept' => '77']]],
    ]);

    (new QueryLogicMakeJob($campaign->id))->handle();

    $requestData = CampaignRequestData::where('campaign_id', $campaign->id)->first();

    expect($requestData)->not->toBeNull();
    expect($requestData->data)->toBeArray();
    expect($requestData->data[0]['phone_number'])->toBe('+33611223344');
});

it('query logic make job marks campaign as failed when wepak returns no recipients', function (): void {
    configureWepak();

    Http::fake([
        '*wedata*' => Http::response(json_encode([])),
    ]);

    $campaign = Campaign::factory()->create([
        'routing_status' => CampaignRoutingStatus::QueryPending,
        'targeting' => ['liste_cp_dept' => [['label' => '99', 'dept' => '99']]],
    ]);

    (new QueryLogicMakeJob($campaign->id))->handle();

    $campaign->refresh();

    expect($campaign->routing_status)->toBe(CampaignRoutingStatus::QueryFailed);
    expect($campaign->campaignRecipients()->count())->toBe(0);
});

it('query logic make job skips if routing status is not query pending', function (): void {
    configureWepak();

    Http::fake(['*wedata*' => Http::response('[]')]);

    $campaign = Campaign::factory()->create([
        'routing_status' => CampaignRoutingStatus::QueryInProgress,
        'targeting' => ['liste_cp_dept' => [['label' => '75', 'dept' => '75']]],
    ]);

    (new QueryLogicMakeJob($campaign->id))->handle();

    Http::assertNothingSent();

    $campaign->refresh();
    expect($campaign->routing_status)->toBe(CampaignRoutingStatus::QueryInProgress);
});

// ─── Test 2: RoutingLogicSendJob dispatches SMS and updates recipient status ─

it('routing logic send job dispatches sms and marks recipients as dispatched', function (): void {
    configureSinchRouting();

    Http::fake([
        '*sinch*' => Http::response(['id' => 'batch-sinch-abc'], 201),
    ]);

    $router = Router::factory()->sinch()->create();
    $batchUuid = Str::uuid()->toString();

    $campaign = Campaign::factory()->create([
        'routing_status' => CampaignRoutingStatus::RoutingInProgress,
        'router_id' => $router->id,
        'message' => 'Bonjour, voici votre offre !',
        'sender' => 'Wellpack',
    ]);

    $recipient = CampaignRecipient::factory()->create([
        'campaign_id' => $campaign->id,
        'status' => CampaignRecipientStatus::Queued,
        'phone_number' => '+33612345678',
    ]);

    $job = new RoutingLogicSendJob(
        campaignId: $campaign->id,
        recipientIds: [$recipient->id],
        batchUuid: $batchUuid,
    );
    app()->call([$job, 'handle']);

    $recipient->refresh();

    expect($recipient->status)->toBe(CampaignRecipientStatus::Dispatched);
    expect($recipient->routing_batch_uuid)->toBe($batchUuid);

    Http::assertSent(function ($request) use ($batchUuid): bool {
        $data = $request->data();
        expect($data['client_reference'])->toBe($batchUuid);
        // SinchDriver sends phone_number as-is (e.g. '+33612345678')
        expect($data['to'])->toContain('+33612345678');

        return true;
    });
});

it('routing logic send job skips if campaign routing status is not routing in progress', function (): void {
    configureSinchRouting();

    Http::fake(['*sinch*' => Http::response(['id' => 'batch-abc'], 201)]);

    $router = Router::factory()->sinch()->create();
    $batchUuid = Str::uuid()->toString();

    $campaign = Campaign::factory()->create([
        'routing_status' => CampaignRoutingStatus::RoutingPending,
        'router_id' => $router->id,
        'message' => 'Test',
    ]);

    $recipient = CampaignRecipient::factory()->create([
        'campaign_id' => $campaign->id,
        'status' => CampaignRecipientStatus::Queued,
    ]);

    $job = new RoutingLogicSendJob(
        campaignId: $campaign->id,
        recipientIds: [$recipient->id],
        batchUuid: $batchUuid,
    );
    app()->call([$job, 'handle']);

    Http::assertNothingSent();

    $recipient->refresh();
    expect($recipient->status)->toBe(CampaignRecipientStatus::Queued);
});

// ─── Test 3: Webhook → DeliveryReport storage ────────────────────────────────

it('sinch webhook stores delivery report', function (): void {
    $payload = [
        'type' => 'recipient_delivery_report_sms',
        'batch_id' => 'batch-sinch-1',
        'recipient' => '+33612345678',
        'status' => 'Delivered',
        'client_reference' => Str::uuid()->toString(),
        'at' => now()->toIso8601String(),
    ];

    $response = $this->postJson('/api/webhooks/sinch', $payload);

    $response->assertOk()->assertJson(['status' => 'ok']);

    expect(DeliveryReport::where('provider', 'sinch')->count())->toBe(1);

    $report = DeliveryReport::where('provider', 'sinch')->first();
    expect($report->digested)->toBeFalse();
    expect($report->report['type'])->toBe('recipient_delivery_report_sms');
    expect($report->report['recipient'])->toBe('+33612345678');
});

it('sinch webhook stores array of delivery reports', function (): void {
    $payload = [
        [
            'type' => 'recipient_delivery_report_sms',
            'recipient' => '+33611111111',
            'status' => 'Delivered',
            'client_reference' => Str::uuid()->toString(),
            'at' => now()->toIso8601String(),
        ],
        [
            'type' => 'recipient_delivery_report_sms',
            'recipient' => '+33622222222',
            'status' => 'Failed',
            'client_reference' => Str::uuid()->toString(),
            'at' => now()->toIso8601String(),
        ],
    ];

    $response = $this->postJson('/api/webhooks/sinch', $payload);

    $response->assertOk()->assertJson(['status' => 'ok']);

    expect(DeliveryReport::where('provider', 'sinch')->count())->toBe(2);
});

// ─── Test 4: DigestDeliveryReportsJob updates recipient status ───────────────

it('digest delivery reports job marks sinch delivered recipient', function (): void {
    $batchUuid = Str::uuid()->toString();
    $phone = '+33612345678';
    $deliveredAt = now()->subMinutes(5)->toIso8601String();

    $campaign = Campaign::factory()->create(['routing_status' => CampaignRoutingStatus::RoutingInProgress]);
    $recipient = CampaignRecipient::factory()->create([
        'campaign_id' => $campaign->id,
        'phone_number' => $phone,
        'status' => CampaignRecipientStatus::Dispatched,
        'routing_batch_uuid' => $batchUuid,
    ]);

    DeliveryReport::create([
        'provider' => 'sinch',
        'report' => [
            'type' => 'recipient_delivery_report_sms',
            'recipient' => $phone,
            'status' => 'Delivered',
            'client_reference' => $batchUuid,
            'at' => $deliveredAt,
        ],
        'digested' => false,
    ]);

    (new DigestDeliveryReportsJob('sinch'))->handle();

    $recipient->refresh();

    expect($recipient->status)->toBe(CampaignRecipientStatus::Delivered);
    expect($recipient->delivered_at)->not->toBeNull();
    expect(DeliveryReport::where('provider', 'sinch')->where('digested', true)->count())->toBe(1);
});

it('digest delivery reports job handles sinch failed status', function (): void {
    $batchUuid = Str::uuid()->toString();
    $phone = '+33699887766';

    $campaign = Campaign::factory()->create(['routing_status' => CampaignRoutingStatus::RoutingInProgress]);
    $recipient = CampaignRecipient::factory()->create([
        'campaign_id' => $campaign->id,
        'phone_number' => $phone,
        'status' => CampaignRecipientStatus::Dispatched,
        'routing_batch_uuid' => $batchUuid,
    ]);

    DeliveryReport::create([
        'provider' => 'sinch',
        'report' => [
            'type' => 'recipient_delivery_report_sms',
            'recipient' => $phone,
            'status' => 'Failed',
            'client_reference' => $batchUuid,
        ],
        'digested' => false,
    ]);

    (new DigestDeliveryReportsJob('sinch'))->handle();

    $recipient->refresh();

    expect($recipient->status)->toBe(CampaignRecipientStatus::Failed);
});

it('digest delivery reports job handles sinch stop request', function (): void {
    $batchUuid = Str::uuid()->toString();
    $phone = '+33677665544';

    $campaign = Campaign::factory()->create(['routing_status' => CampaignRoutingStatus::RoutingInProgress]);
    $recipient = CampaignRecipient::factory()->create([
        'campaign_id' => $campaign->id,
        'phone_number' => $phone,
        'status' => CampaignRecipientStatus::Dispatched,
        'routing_batch_uuid' => $batchUuid,
    ]);

    DeliveryReport::create([
        'provider' => 'sinch',
        'report' => [
            'type' => 'mo_text',
            'from' => $phone,
            'body' => 'STOP',
            'client_reference' => $batchUuid,
            'sent_at' => now()->toIso8601String(),
        ],
        'digested' => false,
    ]);

    (new DigestDeliveryReportsJob('sinch'))->handle();

    $recipient->refresh();

    expect($recipient->stop_requested_at)->not->toBeNull();
});

it('digest delivery reports job marks infobip delivered recipient', function (): void {
    $batchUuid = Str::uuid()->toString();
    $phone = '+33655443322';

    $campaign = Campaign::factory()->create(['routing_status' => CampaignRoutingStatus::RoutingInProgress]);
    $recipient = CampaignRecipient::factory()->create([
        'campaign_id' => $campaign->id,
        'phone_number' => $phone,
        'status' => CampaignRecipientStatus::Dispatched,
        'routing_batch_uuid' => $batchUuid,
    ]);

    // Infobip: phone stored as +33... but report uses 33... (without +)
    DeliveryReport::create([
        'provider' => 'infobip',
        'report' => [
            'to' => '33655443322',
            'callbackData' => $batchUuid,
            'status' => ['groupName' => 'DELIVERED'],
            'doneAt' => now()->toIso8601String(),
        ],
        'digested' => false,
    ]);

    (new DigestDeliveryReportsJob('infobip'))->handle();

    $recipient->refresh();

    expect($recipient->status)->toBe(CampaignRecipientStatus::Delivered);
    expect($recipient->delivered_at)->not->toBeNull();
});

// ─── Test 5: End-to-end workflow (query → route → webhook → digest) ──────────

it('full workflow: query pending → recipients created → routing → dispatched → delivered', function (): void {
    configureWepak();
    configureSinchRouting();

    $phone = '+33600112233';
    $batchUuid = Str::uuid()->toString();

    // Step 1: Set up Wepak fake for query phase
    Http::fake([
        '*wedata*' => Http::response(json_encode([
            ['phone_number' => $phone],
        ])),
        '*sinch*' => Http::response(['id' => 'sinch-batch-xyz'], 201),
    ]);

    $router = Router::factory()->sinch()->create();

    // Create campaign in QueryPending state
    $campaign = Campaign::factory()->create([
        'routing_status' => CampaignRoutingStatus::QueryPending,
        'status' => CampaignStatus::SCHEDULED,
        'router_id' => $router->id,
        'message' => 'Votre offre exclusive !',
        'sender' => 'Wellpack',
        'targeting' => ['liste_cp_dept' => [['label' => '75', 'dept' => '75']]],
    ]);

    // Step 2: Run QueryLogicMakeJob
    (new QueryLogicMakeJob($campaign->id))->handle();

    $campaign->refresh();
    expect($campaign->routing_status)->toBe(CampaignRoutingStatus::MessageGenerationPending);

    $recipient = $campaign->campaignRecipients()->first();
    expect($recipient)->not->toBeNull();
    expect($recipient->phone_number)->toBe($phone);
    expect($recipient->status)->toBe(CampaignRecipientStatus::Queued);

    // Step 3: Transition to RoutingPending (simulating pipeline step)
    $campaign->update(['routing_status' => CampaignRoutingStatus::RoutingPending]);

    // Step 4: Run RoutingLogicStartJob — this dispatches RoutingLogicSendJob via Bus::batch()
    // We manually run RoutingLogicSendJob directly to avoid batch infrastructure in tests
    $campaign->update(['routing_status' => CampaignRoutingStatus::RoutingInProgress]);

    $sendJob = new RoutingLogicSendJob(
        campaignId: $campaign->id,
        recipientIds: [$recipient->id],
        batchUuid: $batchUuid,
    );
    app()->call([$sendJob, 'handle']);

    $recipient->refresh();
    expect($recipient->status)->toBe(CampaignRecipientStatus::Dispatched);
    expect($recipient->routing_batch_uuid)->toBe($batchUuid);

    // Step 5: POST sinch webhook
    $webhookPayload = [
        'type' => 'recipient_delivery_report_sms',
        'recipient' => $phone,
        'status' => 'Delivered',
        'client_reference' => $batchUuid,
        'at' => now()->toIso8601String(),
    ];

    $response = $this->postJson('/api/webhooks/sinch', $webhookPayload);
    $response->assertOk();

    expect(DeliveryReport::where('provider', 'sinch')->where('digested', false)->count())->toBe(1);

    // Step 6: Run DigestDeliveryReportsJob
    (new DigestDeliveryReportsJob('sinch'))->handle();

    $recipient->refresh();
    expect($recipient->status)->toBe(CampaignRecipientStatus::Delivered);
    expect($recipient->delivered_at)->not->toBeNull();

    expect(DeliveryReport::where('provider', 'sinch')->where('digested', true)->count())->toBe(1);
});

// ─── Test 6: RoutingLogicStartJob creates batch and sets RoutingInProgress ───

it('routing logic start job transitions campaign to routing in progress', function (): void {
    configureSinchRouting();

    Http::fake(['*sinch*' => Http::response(['id' => 'batch-abc'], 201)]);

    $router = Router::factory()->sinch()->create();

    $campaign = Campaign::factory()->create([
        'routing_status' => CampaignRoutingStatus::RoutingPending,
        'router_id' => $router->id,
        'message' => 'Hello from Wellpack',
        'sender' => 'Wellpack',
    ]);

    // Create a recipient so job doesn't bail early
    CampaignRecipient::factory()->count(2)->create([
        'campaign_id' => $campaign->id,
        'status' => CampaignRecipientStatus::Queued,
    ]);

    (new RoutingLogicStartJob($campaign->id))->handle();

    $campaign->refresh();

    // In test environment Bus::batch() runs synchronously; the 'then' callback
    // fires immediately after all jobs complete, setting status to RoutingCompleted.
    // We verify the job ran (routing_batch_id is set) and the campaign progressed.
    expect($campaign->routing_batch_id)->not->toBeNull();
    expect($campaign->routing_status)->toBeIn([
        CampaignRoutingStatus::RoutingInProgress,
        CampaignRoutingStatus::RoutingCompleted,
    ]);
});

it('routing logic start job skips when no recipients exist', function (): void {
    $router = Router::factory()->sinch()->create();

    $campaign = Campaign::factory()->create([
        'routing_status' => CampaignRoutingStatus::RoutingPending,
        'router_id' => $router->id,
    ]);

    (new RoutingLogicStartJob($campaign->id))->handle();

    $campaign->refresh();

    // Should remain RoutingPending since no recipients
    expect($campaign->routing_status)->toBe(CampaignRoutingStatus::RoutingPending);
});
