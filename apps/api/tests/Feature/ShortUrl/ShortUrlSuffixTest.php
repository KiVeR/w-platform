<?php

declare(strict_types=1);

use App\Models\ShortUrl;
use App\Models\ShortUrlSuffix;
use App\Models\ShortUrlSuffixRequest;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);
});

// --- STORE ---

it('can create a suffix request', function (): void {
    $shortUrl = ShortUrl::factory()->create(['is_enabled' => true]);
    $batchUuid = fake()->uuid();

    $response = $this->postJson('/api/short-url-requests', [
        'quantity' => 100,
        'short_url_id' => $shortUrl->id,
        'batch_uuid' => $batchUuid,
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'quantity', 'short_url_id']]);

    $this->assertDatabaseHas('short_url_suffix_requests', [
        'quantity' => 100,
        'short_url_id' => $shortUrl->id,
        'batch_uuid' => $batchUuid,
    ]);
});

// --- DESTROY ---

it('can cancel a suffix request by deleting suffixes for batch_uuid', function (): void {
    $shortUrl = ShortUrl::factory()->create(['is_enabled' => true]);
    $batchUuid = fake()->uuid();

    ShortUrlSuffix::factory()->count(3)->create([
        'short_url_id' => $shortUrl->id,
        'batch_uuid' => $batchUuid,
    ]);

    // Also create suffixes with a different batch_uuid to ensure only the target ones are deleted
    ShortUrlSuffix::factory()->count(2)->create([
        'short_url_id' => $shortUrl->id,
        'batch_uuid' => fake()->uuid(),
    ]);

    $response = $this->deleteJson('/api/short-url-requests', [
        'batch_uuid' => $batchUuid,
    ]);

    $response->assertNoContent();

    expect(ShortUrlSuffix::where('batch_uuid', $batchUuid)->count())->toBe(0);
    expect(ShortUrlSuffix::where('short_url_id', $shortUrl->id)->count())->toBe(2);
});

// --- DISPATCH ---

it('creates a ShortUrlSuffixRequest model on store', function (): void {
    $shortUrl = ShortUrl::factory()->create(['is_enabled' => true]);

    $response = $this->postJson('/api/short-url-requests', [
        'quantity' => 50,
        'short_url_id' => $shortUrl->id,
        'batch_uuid' => fake()->uuid(),
    ]);

    $response->assertCreated();

    expect(ShortUrlSuffixRequest::count())->toBe(1);
    expect(ShortUrlSuffixRequest::first()->quantity)->toBe(50);
});

// --- VALIDATION ---

it('validates required fields on suffix request creation', function (): void {
    $response = $this->postJson('/api/short-url-requests', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['quantity', 'short_url_id', 'batch_uuid']);
});

it('validates short_url_id must reference an enabled short url', function (): void {
    $disabledShortUrl = ShortUrl::factory()->create(['is_enabled' => false]);

    $response = $this->postJson('/api/short-url-requests', [
        'quantity' => 10,
        'short_url_id' => $disabledShortUrl->id,
        'batch_uuid' => fake()->uuid(),
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['short_url_id']);
});

it('validates batch_uuid must be a valid uuid', function (): void {
    $shortUrl = ShortUrl::factory()->create(['is_enabled' => true]);

    $response = $this->postJson('/api/short-url-requests', [
        'quantity' => 10,
        'short_url_id' => $shortUrl->id,
        'batch_uuid' => 'not-a-uuid',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['batch_uuid']);
});

it('validates batch_uuid is required on destroy', function (): void {
    $response = $this->deleteJson('/api/short-url-requests', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['batch_uuid']);
});
