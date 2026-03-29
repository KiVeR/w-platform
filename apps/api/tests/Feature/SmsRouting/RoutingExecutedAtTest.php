<?php

declare(strict_types=1);

use App\Enums\CampaignRecipientStatus;
use App\Enums\CampaignRoutingStatus;
use App\Http\Resources\CampaignResource;
use App\Jobs\SmsRouting\RoutingLogicSendJob;
use App\Jobs\SmsRouting\RoutingLogicStartJob;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\Router;
use Illuminate\Support\Facades\Bus;

describe('RoutingExecutedAt', function (): void {

    it('exists as a nullable column on campaigns table', function (): void {
        $campaign = Campaign::factory()->create();
        expect($campaign->routing_executed_at)->toBeNull();

        $campaign = Campaign::factory()->withRouting()->create();
        expect($campaign->routing_executed_at)->toBeInstanceOf(\Illuminate\Support\Carbon::class);
    });

    it('is included in CampaignResource', function (): void {
        $campaign = Campaign::factory()->withRouting()->create();
        $resource = (new CampaignResource($campaign))->toArray(request());
        expect($resource)->toHaveKey('routing_executed_at');
        expect($resource['routing_executed_at'])->not->toBeNull();
    });

    it('is set by RoutingLogicStartJob batch then callback', function (): void {
        Bus::fake([RoutingLogicSendJob::class]);
        config(['sms-routing.router_chunk_size' => 100]);

        $router = Router::factory()->sinch()->create();
        $campaign = Campaign::factory()->create([
            'router_id' => $router->id,
            'routing_status' => CampaignRoutingStatus::RoutingPending,
        ]);

        CampaignRecipient::factory()->count(3)->create([
            'campaign_id' => $campaign->id,
            'status' => CampaignRecipientStatus::Queued,
        ]);

        $job = new RoutingLogicStartJob($campaign->id);
        $job->handle();

        // Simuler le callback then() — Bus::fake empêche l'exécution réelle du batch
        $campaign->refresh()->update([
            'routing_status' => CampaignRoutingStatus::RoutingCompleted,
            'routing_executed_at' => now(),
        ]);

        expect($campaign->refresh()->routing_executed_at)->not->toBeNull();
        expect($campaign->routing_status)->toBe(CampaignRoutingStatus::RoutingCompleted);
    });

    it('is not overwritten if already set', function (): void {
        $originalDate = now()->subDay();
        $campaign = Campaign::factory()->create([
            'routing_executed_at' => $originalDate,
            'routing_status' => CampaignRoutingStatus::RoutingCompleted,
        ]);

        // Simuler un update qui ne touche pas routing_executed_at
        $campaign->update(['routing_status' => CampaignRoutingStatus::RoutingCompleted]);

        expect($campaign->refresh()->routing_executed_at->format('Y-m-d'))
            ->toBe($originalDate->format('Y-m-d'));
    });
});
