<?php

declare(strict_types=1);

use App\Models\ShortUrl;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);
});

// --- INDEX ---

it('can list short urls with pagination', function (): void {
    ShortUrl::factory()->count(5)->create();

    $response = $this->getJson('/api/short-urls');

    $response->assertOk()
        ->assertJsonCount(5, 'data')
        ->assertJsonStructure([
            'data' => [['id', 'slug', 'link', 'click_count', 'is_enabled']],
            'links',
            'meta',
        ]);
});

it('can list short urls without pagination', function (): void {
    ShortUrl::factory()->count(20)->create();

    $response = $this->getJson('/api/short-urls?no_pagination=1');

    $response->assertOk()
        ->assertJsonCount(20, 'data');
});

it('can search short urls via POST list endpoint', function (): void {
    ShortUrl::factory()->create(['slug' => 'unique-test-slug', 'link' => 'https://example.com/unique']);
    ShortUrl::factory()->create(['slug' => 'other-slug', 'link' => 'https://other.com']);
    ShortUrl::factory()->count(3)->create();

    $response = $this->postJson('/api/short-urls/list', [
        'search' => 'unique',
    ]);

    $response->assertOk();

    $data = $response->json('data');

    $matchesUnique = false;
    foreach ($data as $item) {
        if (str_contains($item['slug'], 'unique') || str_contains($item['link'] ?? '', 'unique')) {
            $matchesUnique = true;
        }
    }

    expect($matchesUnique)->toBeTrue();
});

it('can filter short urls by slug', function (): void {
    ShortUrl::factory()->create(['slug' => 'target-slug']);
    ShortUrl::factory()->count(3)->create();

    $response = $this->getJson('/api/short-urls?slug=target-slug');

    $response->assertOk();

    $data = $response->json('data');
    expect(count($data))->toBeGreaterThanOrEqual(1);
    expect($data[0]['slug'])->toContain('target-slug');
});

it('can filter short urls by is_enabled', function (): void {
    ShortUrl::factory()->count(2)->create(['is_enabled' => true]);
    ShortUrl::factory()->count(3)->create(['is_enabled' => false]);

    $response = $this->getJson('/api/short-urls?is_enabled=1');

    $response->assertOk();

    $data = $response->json('data');
    foreach ($data as $item) {
        expect($item['is_enabled'])->toBeTrue();
    }
});

it('can filter disabled short urls with is_enabled=0', function (): void {
    ShortUrl::factory()->count(2)->create(['is_enabled' => true]);
    ShortUrl::factory()->count(3)->create(['is_enabled' => false]);

    $response = $this->getJson('/api/short-urls?is_enabled=0');

    $response->assertOk();

    $data = $response->json('data');
    expect($data)->toHaveCount(3);

    foreach ($data as $item) {
        expect($item['is_enabled'])->toBeFalse();
    }
});

it('can filter short urls by ids', function (): void {
    $first = ShortUrl::factory()->create();
    $second = ShortUrl::factory()->create();
    ShortUrl::factory()->count(2)->create();

    $response = $this->getJson("/api/short-urls?ids[]={$first->id}&ids[]={$second->id}");

    $response->assertOk()
        ->assertJsonCount(2, 'data');

    expect(collect($response->json('data'))->pluck('id')->all())
        ->toContain($first->id, $second->id);
});

it('can filter short urls by import_id', function (): void {
    ShortUrl::factory()->create(['import_id' => 'import-a']);
    ShortUrl::factory()->create(['import_id' => 'import-b']);
    ShortUrl::factory()->create(['import_id' => null]);

    $response = $this->getJson('/api/short-urls?import_id=import-a');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.import_id', 'import-a');
});

it('can filter internal short urls with no-link flag', function (): void {
    ShortUrl::factory()->count(2)->create(['link' => null]);
    ShortUrl::factory()->count(2)->create(['link' => 'https://example.com']);

    $response = $this->getJson('/api/short-urls?no-link=1');

    $response->assertOk()
        ->assertJsonCount(2, 'data');

    foreach ($response->json('data') as $item) {
        expect($item['link'])->toBeNull();
    }
});

// --- STORE ---

it('can create short url with auto-generated slug', function (): void {
    $response = $this->postJson('/api/short-urls', [
        'link' => 'https://example.com/my-page',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'slug', 'link', 'is_enabled']])
        ->assertJsonPath('data.link', 'https://example.com/my-page')
        ->assertJsonPath('data.is_enabled', true);

    $slug = $response->json('data.slug');
    expect($slug)->toBeString()->not->toBeEmpty();

    $this->assertDatabaseHas('short_urls', [
        'id' => $response->json('data.id'),
        'link' => 'https://example.com/my-page',
    ]);
});

it('can create short url with custom slug', function (): void {
    $response = $this->postJson('/api/short-urls', [
        'slug' => 'my-custom-slug',
        'link' => 'https://example.com/custom',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.slug', 'my-custom-slug')
        ->assertJsonPath('data.link', 'https://example.com/custom');
});

it('can create fake short url for preview', function (): void {
    $response = $this->postJson('/api/short-urls', [
        'fake' => true,
    ]);

    $response->assertOk()
        ->assertJsonStructure(['data' => ['id', 'slug']])
        ->assertJsonPath('data.id', null);

    $slug = $response->json('data.slug');
    expect($slug)->toBeString()->not->toBeEmpty();

    expect(ShortUrl::where('slug', $slug)->exists())->toBeFalse();
});

it('can create fake short url with prefix', function (): void {
    $response = $this->postJson('/api/short-urls', [
        'fake' => true,
        'prefix' => 'promo',
    ]);

    $response->assertOk();

    $slug = $response->json('data.slug');
    expect($slug)->toStartWith('promo');
});

// --- SHOW ---

it('can show short url by id', function (): void {
    $shortUrl = ShortUrl::factory()->create([
        'slug' => 'show-test',
        'link' => 'https://example.com/show',
    ]);

    $response = $this->getJson("/api/short-urls/{$shortUrl->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $shortUrl->id)
        ->assertJsonPath('data.slug', 'show-test')
        ->assertJsonPath('data.link', 'https://example.com/show');
});

it('can show short url by slug', function (): void {
    $shortUrl = ShortUrl::factory()->create([
        'slug' => 'lookup-by-slug',
        'link' => 'https://example.com/lookup',
    ]);

    $response = $this->getJson('/api/short-urls/lookup-by-slug');

    $response->assertOk()
        ->assertJsonPath('data.id', $shortUrl->id)
        ->assertJsonPath('data.slug', 'lookup-by-slug');
});

it('can check short url type via query param', function (): void {
    $external = ShortUrl::factory()->create(['link' => 'https://example.com']);
    $internal = ShortUrl::factory()->create(['link' => null]);

    $this->getJson("/api/short-urls/{$external->id}?type=true")
        ->assertOk()
        ->assertExactJson(['external' => true]);

    $this->getJson("/api/short-urls/{$internal->id}?type=true")
        ->assertOk()
        ->assertExactJson(['external' => false]);
});

// --- UPDATE ---

it('can update short url', function (): void {
    $shortUrl = ShortUrl::factory()->create([
        'slug' => 'original-slug',
        'is_enabled' => true,
    ]);

    $response = $this->putJson("/api/short-urls/{$shortUrl->id}", [
        'slug' => 'updated-slug',
        'link' => 'https://updated.com',
        'is_enabled' => false,
        'is_draft' => true,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.slug', 'updated-slug')
        ->assertJsonPath('data.link', 'https://updated.com')
        ->assertJsonPath('data.is_enabled', false)
        ->assertJsonPath('data.is_draft', true);
});

// --- DESTROY ---

it('can delete short url', function (): void {
    $shortUrl = ShortUrl::factory()->create();

    $this->deleteJson("/api/short-urls/{$shortUrl->id}")
        ->assertNoContent();

    $this->assertDatabaseMissing('short_urls', ['id' => $shortUrl->id]);
});

// --- VALIDATION ---

it('validates unique enabled slug on create', function (): void {
    ShortUrl::factory()->create([
        'slug' => 'taken-slug',
        'is_enabled' => true,
    ]);

    $response = $this->postJson('/api/short-urls', [
        'slug' => 'taken-slug',
        'link' => 'https://example.com/duplicate',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['slug']);
});

it('validates slug must not contain underscores on create', function (): void {
    $response = $this->postJson('/api/short-urls', [
        'slug' => 'bad_slug_here',
        'link' => 'https://example.com',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['slug']);
});

it('validates slug must not contain underscores on update', function (): void {
    $shortUrl = ShortUrl::factory()->create();

    $response = $this->putJson("/api/short-urls/{$shortUrl->id}", [
        'slug' => 'bad_update_slug',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['slug']);
});

it('validates link is required on create', function (): void {
    $response = $this->postJson('/api/short-urls', [
        'slug' => 'no-link',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['link']);
});

it('returns 404 for non-existent short url', function (): void {
    $this->getJson('/api/short-urls/999999')
        ->assertNotFound();
});
