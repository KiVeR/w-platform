<?php

declare(strict_types=1);

use App\Models\AIUsage;
use App\Models\Partner;
use App\Models\User;
use App\Services\AI\AIQuotaService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Queue;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// --- AIQuotaService unit tests ---

it('returns true for canGenerate when user has not used quota', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('merchant');

    $service = app(AIQuotaService::class);

    expect($service->canGenerate($user))->toBeTrue();
});

it('returns false for canGenerate when user has no role', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();

    $service = app(AIQuotaService::class);

    expect($service->canGenerate($user))->toBeFalse();
});

it('returns false for canGenerate when quota is exhausted', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('merchant');

    $periodKey = now()->format('Y-m');
    AIUsage::create([
        'user_id' => $user->id,
        'period_key' => $periodKey,
        'count' => 20, // merchant limit
        'last_generated_at' => now(),
    ]);

    $service = app(AIQuotaService::class);

    expect($service->canGenerate($user))->toBeFalse();
});

it('increments usage for a user', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $service = app(AIQuotaService::class);
    $periodKey = $service->getCurrentPeriodKey();

    $service->incrementUsage($user);

    $usage = AIUsage::where('user_id', $user->id)
        ->where('period_key', $periodKey)
        ->first();

    expect($usage)->not->toBeNull()
        ->and($usage->count)->toBe(1);
});

it('increments usage from existing record', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $service = app(AIQuotaService::class);
    $periodKey = $service->getCurrentPeriodKey();

    AIUsage::create([
        'user_id' => $user->id,
        'period_key' => $periodKey,
        'count' => 5,
        'last_generated_at' => now(),
    ]);

    $service->incrementUsage($user);

    $usage = AIUsage::where('user_id', $user->id)
        ->where('period_key', $periodKey)
        ->first();

    expect($usage->count)->toBe(6);
});

it('refunds usage when count is above zero', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $service = app(AIQuotaService::class);
    $periodKey = $service->getCurrentPeriodKey();

    AIUsage::create([
        'user_id' => $user->id,
        'period_key' => $periodKey,
        'count' => 3,
        'last_generated_at' => now(),
    ]);

    $service->refundUsage($user);

    $usage = AIUsage::where('user_id', $user->id)
        ->where('period_key', $periodKey)
        ->first();

    expect($usage->count)->toBe(2);
});

it('does not decrement below zero on refund', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    $service = app(AIQuotaService::class);
    $periodKey = $service->getCurrentPeriodKey();

    AIUsage::create([
        'user_id' => $user->id,
        'period_key' => $periodKey,
        'count' => 0,
        'last_generated_at' => now(),
    ]);

    $service->refundUsage($user);

    $usage = AIUsage::where('user_id', $user->id)
        ->where('period_key', $periodKey)
        ->first();

    expect($usage->count)->toBe(0);
});

it('returns correct quota info for a user', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('merchant');

    $service = app(AIQuotaService::class);
    $periodKey = $service->getCurrentPeriodKey();

    AIUsage::create([
        'user_id' => $user->id,
        'period_key' => $periodKey,
        'count' => 5,
        'last_generated_at' => now(),
    ]);

    $info = $service->getQuotaInfo($user);

    expect($info['limit'])->toBe(20)
        ->and($info['remaining'])->toBe(15)
        ->and($info['can_generate'])->toBeTrue()
        ->and($info['resets_at'])->toBeString();
});

it('period key format is Y-m', function (): void {
    $service = app(AIQuotaService::class);

    expect($service->getCurrentPeriodKey())->toMatch('/^\d{4}-\d{2}$/');
});

it('quota resets in a new period', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('merchant');

    // Insert usage in previous period
    AIUsage::create([
        'user_id' => $user->id,
        'period_key' => '2020-01',
        'count' => 20,
        'last_generated_at' => now(),
    ]);

    $service = app(AIQuotaService::class);

    // Current period has no usage, so should be able to generate
    expect($service->canGenerate($user))->toBeTrue();
});

// --- GET /api/ai/quota ---

it('returns quota info for authenticated user', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->getJson('/api/ai/quota');

    $response->assertOk()
        ->assertJsonStructure(['remaining', 'limit', 'resets_at', 'can_generate'])
        ->assertJson([
            'limit' => 100,
            'remaining' => 100,
            'can_generate' => true,
        ]);
});

it('quota endpoint requires authentication', function (): void {
    $response = $this->getJson('/api/ai/quota');

    $response->assertUnauthorized();
});

it('quota decrements as user generates', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $service = app(AIQuotaService::class);
    $service->incrementUsage($user);
    $service->incrementUsage($user);

    $response = $this->getJson('/api/ai/quota');

    $response->assertOk()
        ->assertJson([
            'limit' => 100,
            'remaining' => 98,
            'can_generate' => true,
        ]);
});

// --- POST /api/ai/generate with quota check ---

it('rejects generation when quota is exhausted', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('merchant');
    Passport::actingAs($user);

    $periodKey = now()->format('Y-m');
    AIUsage::create([
        'user_id' => $user->id,
        'period_key' => $periodKey,
        'count' => 20, // merchant limit reached
        'last_generated_at' => now(),
    ]);

    $response = $this->postJson('/api/ai/generate', [
        'prompt' => 'Create a landing page',
    ]);

    $response->assertStatus(429)
        ->assertJsonStructure(['message', 'quota'])
        ->assertJson([
            'message' => 'Monthly AI generation quota exceeded.',
        ]);
});

it('allows generation when quota is not exhausted', function (): void {
    Queue::fake();

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('merchant');
    Passport::actingAs($user);

    $periodKey = now()->format('Y-m');
    AIUsage::create([
        'user_id' => $user->id,
        'period_key' => $periodKey,
        'count' => 19, // one below merchant limit
        'last_generated_at' => now(),
    ]);

    $response = $this->postJson('/api/ai/generate', [
        'prompt' => 'Create a landing page',
    ]);

    $response->assertStatus(202);
});

it('admin has higher quota than merchant', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('admin');
    Passport::actingAs($user);

    $response = $this->getJson('/api/ai/quota');

    $response->assertOk()
        ->assertJson([
            'limit' => 100,
        ]);
});
