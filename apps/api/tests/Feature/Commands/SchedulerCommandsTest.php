<?php

declare(strict_types=1);

use App\Enums\CampaignRoutingStatus;
use App\Jobs\SmsRouting\DigestDeliveryReportsJob;
use App\Jobs\SmsRouting\PullReportsJob;
use App\Jobs\SmsRouting\QueryLogicMakeJob;
use App\Jobs\SmsRouting\RoutingLogicStartJob;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\DeliveryReport;
use App\Models\Partner;
use App\Models\Router;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Queue;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
    Queue::fake();

    $this->partner = Partner::factory()->create();
    $this->router = Router::factory()->sinch()->create();
});

describe('app:request-campaign-query', function (): void {
    it('dispatches QueryLogicMakeJob for query-pending campaigns', function (): void {
        Campaign::factory()->forPartner($this->partner)->create([
            'routing_status' => CampaignRoutingStatus::QueryPending,
            'routing_at' => now()->subMinute(),
            'router_id' => $this->router->id,
        ]);

        $this->artisan('app:request-campaign-query')->assertSuccessful();

        Queue::assertPushed(QueryLogicMakeJob::class, 1);
    });

    it('ignores campaigns with future routing_at', function (): void {
        Campaign::factory()->forPartner($this->partner)->create([
            'routing_status' => CampaignRoutingStatus::QueryPending,
            'routing_at' => now()->addHour(),
            'router_id' => $this->router->id,
        ]);

        $this->artisan('app:request-campaign-query')->assertSuccessful();

        Queue::assertNotPushed(QueryLogicMakeJob::class);
    });

    it('ignores campaigns that already have recipients', function (): void {
        $campaign = Campaign::factory()->forPartner($this->partner)->create([
            'routing_status' => CampaignRoutingStatus::QueryPending,
            'routing_at' => now()->subMinute(),
            'router_id' => $this->router->id,
        ]);

        CampaignRecipient::factory()->for($campaign)->create();

        $this->artisan('app:request-campaign-query')->assertSuccessful();

        Queue::assertNotPushed(QueryLogicMakeJob::class);
    });

    it('ignores campaigns with wrong status', function (): void {
        Campaign::factory()->forPartner($this->partner)->create([
            'routing_status' => CampaignRoutingStatus::RoutingPending,
            'routing_at' => now()->subMinute(),
            'router_id' => $this->router->id,
        ]);

        $this->artisan('app:request-campaign-query')->assertSuccessful();

        Queue::assertNotPushed(QueryLogicMakeJob::class);
    });
});

describe('app:request-campaign-routing', function (): void {
    it('dispatches RoutingLogicStartJob for routing-pending campaigns with recipients', function (): void {
        $campaign = Campaign::factory()->forPartner($this->partner)->create([
            'routing_status' => CampaignRoutingStatus::RoutingPending,
            'routing_at' => now()->subMinute(),
            'router_id' => $this->router->id,
        ]);

        CampaignRecipient::factory()->for($campaign)->create();

        $this->artisan('app:request-campaign-routing')->assertSuccessful();

        Queue::assertPushed(RoutingLogicStartJob::class, 1);
    });

    it('ignores campaigns without recipients', function (): void {
        Campaign::factory()->forPartner($this->partner)->create([
            'routing_status' => CampaignRoutingStatus::RoutingPending,
            'routing_at' => now()->subMinute(),
            'router_id' => $this->router->id,
        ]);

        $this->artisan('app:request-campaign-routing')->assertSuccessful();

        Queue::assertNotPushed(RoutingLogicStartJob::class);
    });
});

describe('app:digest-delivery-reports', function (): void {
    it('dispatches digest job for providers with undigested reports', function (): void {
        DeliveryReport::factory()->sinch()->create(['digested' => false]);
        DeliveryReport::factory()->infobip()->create(['digested' => false]);

        $this->artisan('app:digest-delivery-reports')->assertSuccessful();

        Queue::assertPushed(DigestDeliveryReportsJob::class, 2);
    });

    it('skips providers without undigested reports', function (): void {
        DeliveryReport::factory()->sinch()->digested()->create();

        $this->artisan('app:digest-delivery-reports')->assertSuccessful();

        Queue::assertNotPushed(DigestDeliveryReportsJob::class);
    });
});

describe('app:pull-reports', function (): void {
    it('dispatches PullReportsJob', function (): void {
        $this->artisan('app:pull-reports')->assertSuccessful();

        Queue::assertPushed(PullReportsJob::class, 1);
    });
});
