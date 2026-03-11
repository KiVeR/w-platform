<?php

declare(strict_types=1);

use App\Models\ImportableLink;
use App\Models\ShortUrl;
use App\Models\User;
use App\Services\ShortUrl\ShortUrlService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);
});

// --- UPLOAD ---

it('can upload a CSV file', function (): void {
    Storage::fake();

    $csvContent = "https://example.com\nhttps://example.org";
    $file = UploadedFile::fake()->createWithContent('test.csv', $csvContent);

    $mock = Mockery::mock(ShortUrlService::class);
    $mock->shouldReceive('getUrlsFromFile')
        ->once()
        ->andReturn(['https://example.com', 'https://example.org']);

    $this->app->instance(ShortUrlService::class, $mock);

    $response = $this->postJson('/api/importable-links/upload', [
        'file' => $file,
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'count']])
        ->assertJsonPath('data.count', 2);

    $importableLink = ImportableLink::latest('id')->first();
    expect($importableLink)->not->toBeNull();
    expect($importableLink->count)->toBe(2);
});

it('validates file type on upload (rejects non-CSV/XLS/XLSX)', function (): void {
    Storage::fake();

    $file = UploadedFile::fake()->create('test.pdf', 100);

    $response = $this->postJson('/api/importable-links/upload', [
        'file' => $file,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['file']);
});

it('validates file is required on upload', function (): void {
    $response = $this->postJson('/api/importable-links/upload', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['file']);
});

// --- IMPORT ---

it('can import links from uploaded file', function (): void {
    Storage::fake();

    $importableLink = ImportableLink::factory()->create(['imported' => false]);
    $csvContent = "https://example.com\nhttps://example.org";
    $file = UploadedFile::fake()->createWithContent('test.csv', $csvContent);
    $importableLink->addMedia($file)->toMediaCollection('importable_links');

    $mock = Mockery::mock(ShortUrlService::class);
    $mock->shouldReceive('getUrlsFromFile')
        ->once()
        ->andReturn(['https://example.com', 'https://example.org']);

    $mock->shouldReceive('create')
        ->twice()
        ->andReturnUsing(function (array $attributes) {
            $shortUrl = new ShortUrl;
            $shortUrl->slug = 'import'.fake()->lexify('??????');
            $shortUrl->link = $attributes['link'];
            $shortUrl->import_id = $attributes['import_id'] ?? null;
            $shortUrl->is_enabled = true;
            $shortUrl->save();

            return $shortUrl->refresh();
        });

    $this->app->instance(ShortUrlService::class, $mock);

    $response = $this->postJson("/api/importable-links/import/{$importableLink->uuid}", [
        'length' => 6,
    ]);

    $response->assertOk();

    $data = $response->json('data');
    expect($data)->toHaveCount(2);

    expect($importableLink->fresh()->imported)->toBeTrue();
});

it('prevents re-import of already imported links', function (): void {
    $importableLink = ImportableLink::factory()->create(['imported' => true]);

    $response = $this->postJson("/api/importable-links/import/{$importableLink->uuid}", [
        'length' => 6,
    ]);

    $response->assertStatus(500);

    expect(ShortUrl::count())->toBe(0);
});

it('returns 404 for unknown UUID on import', function (): void {
    $fakeUuid = fake()->uuid();

    $response = $this->postJson("/api/importable-links/import/{$fakeUuid}", [
        'length' => 6,
    ]);

    $response->assertNotFound();
});
