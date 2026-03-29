<?php

declare(strict_types=1);

use App\Contracts\CampaignSenderInterface;
use App\DTOs\CostEstimate;
use App\Enums\CampaignStatus;
use App\Models\Campaign;
use App\Models\Partner;
use App\Models\PartnerPricing;
use App\Services\CampaignDispatchService;

// ── validateReadiness ──────────────────────────────────────────────

it('validateReadiness returns null when campaign is ready', function (): void {
    $campaign = Campaign::factory()
        ->forPartner(Partner::factory()->create())
        ->create(['message' => 'Hello world', 'sender' => 'WELLPACK']);

    $service = app(CampaignDispatchService::class);
    $result = $service->validateReadiness($campaign);

    expect($result)->toBeNull();
});

it('validateReadiness returns 422 when message is missing', function (): void {
    $campaign = Campaign::factory()
        ->forPartner(Partner::factory()->create())
        ->create(['message' => null, 'sender' => 'WELLPACK']);

    $service = app(CampaignDispatchService::class);
    $result = $service->validateReadiness($campaign);

    expect($result)->not->toBeNull();
    expect($result->getStatusCode())->toBe(422);

    $data = json_decode($result->getContent(), true);
    expect($data['errors'])->toHaveKey('message');
});

it('validateReadiness returns 422 when sender is missing', function (): void {
    $campaign = Campaign::factory()
        ->forPartner(Partner::factory()->create())
        ->create(['message' => 'Hello', 'sender' => null]);

    $service = app(CampaignDispatchService::class);
    $result = $service->validateReadiness($campaign);

    expect($result)->not->toBeNull();
    expect($result->getStatusCode())->toBe(422);

    $data = json_decode($result->getContent(), true);
    expect($data['errors'])->toHaveKey('sender');
});

it('validateReadiness returns 422 when both message and sender are missing', function (): void {
    $campaign = Campaign::factory()
        ->forPartner(Partner::factory()->create())
        ->create(['message' => null, 'sender' => null]);

    $service = app(CampaignDispatchService::class);
    $result = $service->validateReadiness($campaign);

    expect($result)->not->toBeNull();
    $data = json_decode($result->getContent(), true);
    expect($data['errors'])->toHaveKeys(['message', 'sender']);
});

it('validateReadiness returns 422 when message contains blocked domain', function (): void {
    $campaign = Campaign::factory()
        ->forPartner(Partner::factory()->create())
        ->create(['message' => 'Visit rsms.co for deals', 'sender' => 'WELLPACK']);

    $service = app(CampaignDispatchService::class);
    $result = $service->validateReadiness($campaign);

    expect($result)->not->toBeNull();
    expect($result->getStatusCode())->toBe(422);

    $data = json_decode($result->getContent(), true);
    expect($data['message'])->toBe('Message contains a blocked domain.');
});

// ── estimateAndPrice ───────────────────────────────────────────────

it('estimateAndPrice returns CostEstimate on success', function (): void {
    $partner = Partner::factory()->create();
    PartnerPricing::factory()->forPartner($partner)->create([
        'volume_min' => 0,
        'volume_max' => 100000,
        'router_price' => 0.0300,
        'data_price' => 0.0100,
        'ci_price' => 0.0050,
    ]);

    $campaign = Campaign::factory()
        ->forPartner($partner)
        ->create(['targeting' => ['method' => 'department', 'departments' => ['75']]]);

    // Bind a stub sender that returns a known volume
    $this->app->bind(CampaignSenderInterface::class, function () {
        return new class implements CampaignSenderInterface
        {
            public function send(\App\Models\Campaign $campaign): \App\DTOs\SendResult
            {
                return new \App\DTOs\SendResult(true, 'ext-1');
            }

            public function estimateVolume(\App\Models\Campaign $campaign): int
            {
                return 5000;
            }

            public function estimateVolumeFromTargeting(array $targeting): int
            {
                return 5000;
            }
        };
    });

    $service = app(CampaignDispatchService::class);
    $result = $service->estimateAndPrice($campaign);

    expect($result)->toBeInstanceOf(CostEstimate::class);
    expect($result->unitPrice)->toBe(0.04);
    expect($result->totalPrice)->toBe(200.0);

    $campaign->refresh();
    expect($campaign->volume_estimated)->toBe(5000);
    expect($campaign->sms_count)->toBe(5000);
    expect($campaign->unit_price)->toBe(0.04);
    expect($campaign->total_price)->toBe(200.0);
});

it('estimateAndPrice returns 422 when volume is zero', function (): void {
    $partner = Partner::factory()->create();
    $campaign = Campaign::factory()
        ->forPartner($partner)
        ->create(['targeting' => []]);

    $this->app->bind(CampaignSenderInterface::class, function () {
        return new class implements CampaignSenderInterface
        {
            public function send(\App\Models\Campaign $campaign): \App\DTOs\SendResult
            {
                return new \App\DTOs\SendResult(true, 'ext-1');
            }

            public function estimateVolume(\App\Models\Campaign $campaign): int
            {
                return 0;
            }

            public function estimateVolumeFromTargeting(array $targeting): int
            {
                return 0;
            }
        };
    });

    $service = app(CampaignDispatchService::class);
    $result = $service->estimateAndPrice($campaign);

    expect($result)->toBeInstanceOf(\Illuminate\Http\JsonResponse::class);
    expect($result->getStatusCode())->toBe(422);

    $data = json_decode($result->getContent(), true);
    expect($data['errors']['volume'])->toContain('Volume estimation returned 0.');
});

it('estimateAndPrice returns 422 when no pricing found', function (): void {
    $partner = Partner::factory()->create();
    $campaign = Campaign::factory()
        ->forPartner($partner)
        ->create(['targeting' => ['method' => 'department', 'departments' => ['75']]]);

    $this->app->bind(CampaignSenderInterface::class, function () {
        return new class implements CampaignSenderInterface
        {
            public function send(\App\Models\Campaign $campaign): \App\DTOs\SendResult
            {
                return new \App\DTOs\SendResult(true, 'ext-1');
            }

            public function estimateVolume(\App\Models\Campaign $campaign): int
            {
                return 5000;
            }

            public function estimateVolumeFromTargeting(array $targeting): int
            {
                return 5000;
            }
        };
    });

    $service = app(CampaignDispatchService::class);
    $result = $service->estimateAndPrice($campaign);

    expect($result)->toBeInstanceOf(\Illuminate\Http\JsonResponse::class);
    expect($result->getStatusCode())->toBe(422);
});

// ── deductCredits ──────────────────────────────────────────────────

it('deductCredits deducts from partner', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => 500.00]);
    $campaign = Campaign::factory()
        ->forPartner($partner)
        ->create(['is_demo' => false]);

    $estimate = new CostEstimate(unitPrice: 0.04, totalPrice: 200.0, pricingId: 1);

    $service = app(CampaignDispatchService::class);
    $result = $service->deductCredits($campaign, $estimate);

    expect($result)->toBeNull();

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(300.0);
});

it('deductCredits returns 422 when insufficient credits', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => 50.00]);
    $campaign = Campaign::factory()
        ->forPartner($partner)
        ->create(['is_demo' => false]);

    $estimate = new CostEstimate(unitPrice: 0.04, totalPrice: 200.0, pricingId: 1);

    $service = app(CampaignDispatchService::class);
    $result = $service->deductCredits($campaign, $estimate);

    expect($result)->not->toBeNull();
    expect($result->getStatusCode())->toBe(422);

    $data = json_decode($result->getContent(), true);
    expect($data['errors'])->toHaveKey('euro_credits');
});

it('deductCredits skips for demo campaigns', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => 500.00]);
    $campaign = Campaign::factory()
        ->forPartner($partner)
        ->demo()
        ->create();

    $estimate = new CostEstimate(unitPrice: 0.04, totalPrice: 200.0, pricingId: 1);

    $service = app(CampaignDispatchService::class);
    $result = $service->deductCredits($campaign, $estimate);

    expect($result)->toBeNull();

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(500.0);
});

it('deductCredits skips when totalPrice is zero', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => 500.00]);
    $campaign = Campaign::factory()
        ->forPartner($partner)
        ->create(['is_demo' => false]);

    $estimate = new CostEstimate(unitPrice: 0.0, totalPrice: 0.0, pricingId: 1);

    $service = app(CampaignDispatchService::class);
    $result = $service->deductCredits($campaign, $estimate);

    expect($result)->toBeNull();

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(500.0);
});

// ── refundCredits ──────────────────────────────────────────────────

it('refundCredits refunds a scheduled campaign', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => 300.00]);
    $campaign = Campaign::factory()
        ->forPartner($partner)
        ->scheduled()
        ->withPricing(0.04, 200.0)
        ->create(['is_demo' => false]);

    $service = app(CampaignDispatchService::class);
    $service->refundCredits($campaign);

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(500.0);
});

it('refundCredits refunds a sending campaign', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => 300.00]);
    $campaign = Campaign::factory()
        ->forPartner($partner)
        ->sending()
        ->withPricing(0.04, 200.0)
        ->create(['is_demo' => false]);

    $service = app(CampaignDispatchService::class);
    $service->refundCredits($campaign);

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(500.0);
});

it('refundCredits skips for demo campaigns', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => 300.00]);
    $campaign = Campaign::factory()
        ->forPartner($partner)
        ->scheduled()
        ->withPricing(0.04, 200.0)
        ->demo()
        ->create();

    $service = app(CampaignDispatchService::class);
    $service->refundCredits($campaign);

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(300.0);
});

it('refundCredits skips for draft campaigns', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => 300.00]);
    $campaign = Campaign::factory()
        ->forPartner($partner)
        ->withPricing(0.04, 200.0)
        ->create(['is_demo' => false, 'status' => CampaignStatus::DRAFT]);

    $service = app(CampaignDispatchService::class);
    $service->refundCredits($campaign);

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(300.0);
});

it('refundCredits skips when total_price is zero', function (): void {
    $partner = Partner::factory()->create(['euro_credits' => 300.00]);
    $campaign = Campaign::factory()
        ->forPartner($partner)
        ->scheduled()
        ->withPricing(0.0, 0.0)
        ->create(['is_demo' => false]);

    $service = app(CampaignDispatchService::class);
    $service->refundCredits($campaign);

    $partner->refresh();
    expect((float) $partner->euro_credits)->toBe(300.0);
});
