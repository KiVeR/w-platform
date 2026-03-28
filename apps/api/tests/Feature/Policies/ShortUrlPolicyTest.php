<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\ShortUrl;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// --- viewAny ---

it('allows admin to view any short urls', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($admin->can('viewAny', ShortUrl::class))->toBeTrue();
});

it('allows partner role to view any short urls', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($user->can('viewAny', ShortUrl::class))->toBeTrue();
});

it('allows merchant role to view any short urls', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('merchant');

    expect($user->can('viewAny', ShortUrl::class))->toBeTrue();
});

it('denies employee to view any short urls', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');

    expect($user->can('viewAny', ShortUrl::class))->toBeFalse();
});

// --- view ---

it('allows admin to view a short url', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $shortUrl = ShortUrl::factory()->create();

    expect($admin->can('view', $shortUrl))->toBeTrue();
});

it('allows partner role to view a short url', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    $shortUrl = ShortUrl::factory()->create();

    expect($user->can('view', $shortUrl))->toBeTrue();
});

it('denies employee to view a short url', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    $shortUrl = ShortUrl::factory()->create();

    expect($user->can('view', $shortUrl))->toBeFalse();
});

// --- create ---

it('allows admin to create short urls', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    expect($admin->can('create', ShortUrl::class))->toBeTrue();
});

it('allows partner role to create short urls', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');

    expect($user->can('create', ShortUrl::class))->toBeTrue();
});

it('allows merchant role to create short urls', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('merchant');

    expect($user->can('create', ShortUrl::class))->toBeTrue();
});

it('denies employee to create short urls', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');

    expect($user->can('create', ShortUrl::class))->toBeFalse();
});

// --- update ---

it('allows admin to update a short url', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $shortUrl = ShortUrl::factory()->create();

    expect($admin->can('update', $shortUrl))->toBeTrue();
});

it('allows partner role to update a short url', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    $shortUrl = ShortUrl::factory()->create();

    expect($user->can('update', $shortUrl))->toBeTrue();
});

it('denies employee to update a short url', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    $shortUrl = ShortUrl::factory()->create();

    expect($user->can('update', $shortUrl))->toBeFalse();
});

// --- delete ---

it('allows admin to delete a short url', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $shortUrl = ShortUrl::factory()->create();

    expect($admin->can('delete', $shortUrl))->toBeTrue();
});

it('allows partner role to delete a short url', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    $shortUrl = ShortUrl::factory()->create();

    expect($user->can('delete', $shortUrl))->toBeTrue();
});

it('denies employee to delete a short url', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    $shortUrl = ShortUrl::factory()->create();

    expect($user->can('delete', $shortUrl))->toBeFalse();
});

// --- HTTP integration: user without permission gets 403 ---

it('returns 403 on index for user without view short-urls permission', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $this->getJson('/api/short-urls')->assertForbidden();
});

it('returns 403 on store for user without manage short-urls permission', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $this->postJson('/api/short-urls', [
        'link' => 'https://example.com',
    ])->assertForbidden();
});

it('returns 403 on show for user without view short-urls permission', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $shortUrl = ShortUrl::factory()->create();

    $this->getJson("/api/short-urls/{$shortUrl->id}")->assertForbidden();
});

it('returns 403 on update for user without manage short-urls permission', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $shortUrl = ShortUrl::factory()->create();

    $this->putJson("/api/short-urls/{$shortUrl->id}", [
        'slug' => 'new-slug',
    ])->assertForbidden();
});

it('returns 403 on destroy for user without manage short-urls permission', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $shortUrl = ShortUrl::factory()->create();

    $this->deleteJson("/api/short-urls/{$shortUrl->id}")->assertForbidden();
});

it('returns 403 on importable-links upload for user without manage short-urls permission', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $file = \Illuminate\Http\UploadedFile::fake()->createWithContent('test.csv', "https://example.com\n");

    $this->postJson('/api/importable-links/upload', [
        'file' => $file,
    ])->assertForbidden();
});

it('returns 403 on suffix request store for user without manage short-urls permission', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $this->postJson('/api/short-url-requests', [])->assertForbidden();
});

it('returns 403 on suffix request destroy for user without manage short-urls permission', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    Passport::actingAs($user);

    $this->deleteJson('/api/short-url-requests', [])->assertForbidden();
});

// --- view-only permission cannot mutate ---

it('allows view-only user to list but not create short urls', function (): void {
    $user = User::factory()->create();
    $user->assignRole('employee');
    $user->givePermissionTo('view short-urls');
    Passport::actingAs($user);

    $this->getJson('/api/short-urls')->assertOk();

    $this->postJson('/api/short-urls', [
        'link' => 'https://example.com',
    ])->assertForbidden();
});
