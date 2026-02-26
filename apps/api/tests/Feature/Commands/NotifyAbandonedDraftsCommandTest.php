<?php

declare(strict_types=1);

use App\Models\Campaign;
use App\Models\Partner;
use App\Models\User;
use App\Notifications\AbandonedDraftNotification;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Notification;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->partner = Partner::factory()->create();
    $this->user = User::factory()->forPartner($this->partner)->create();

    Notification::fake();
});

it('finds drafts older than 48h and notifies creator with correct campaign', function (): void {
    $campaign = Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'status' => 'draft',
        'name' => 'Ma campagne test',
        'updated_at' => now()->subHours(49),
    ]);

    $this->artisan('app:notify-abandoned-drafts')
        ->assertSuccessful()
        ->expectsOutputToContain('Notified 1 abandoned draft(s)');

    Notification::assertSentTo(
        $this->user,
        AbandonedDraftNotification::class,
        fn (AbandonedDraftNotification $notification): bool => $notification->campaign->id === $campaign->id,
    );
});

it('ignores drafts younger than 48h', function (): void {
    Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'status' => 'draft',
        'name' => 'Recent draft',
        'updated_at' => now()->subHours(47),
    ]);

    $this->artisan('app:notify-abandoned-drafts')
        ->assertSuccessful()
        ->expectsOutputToContain('No abandoned drafts to notify');

    Notification::assertNothingSent();
});

it('ignores drafts without a name', function (): void {
    Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'status' => 'draft',
        'name' => '',
        'updated_at' => now()->subHours(49),
    ]);

    $this->artisan('app:notify-abandoned-drafts')
        ->assertSuccessful()
        ->expectsOutputToContain('No abandoned drafts to notify');

    Notification::assertNothingSent();
});

it('ignores drafts already notified', function (): void {
    Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'status' => 'draft',
        'name' => 'Already notified',
        'updated_at' => now()->subHours(49),
        'draft_notified_at' => now()->subDay(),
    ]);

    $this->artisan('app:notify-abandoned-drafts')
        ->assertSuccessful()
        ->expectsOutputToContain('No abandoned drafts to notify');

    Notification::assertNothingSent();
});

it('ignores non-draft campaigns', function (): void {
    Campaign::factory()->forPartner($this->partner)->forUser($this->user)->sent()->create([
        'name' => 'Sent campaign',
        'updated_at' => now()->subHours(49),
    ]);

    Campaign::factory()->forPartner($this->partner)->forUser($this->user)->scheduled()->create([
        'name' => 'Scheduled campaign',
        'updated_at' => now()->subHours(49),
    ]);

    Campaign::factory()->forPartner($this->partner)->forUser($this->user)->cancelled()->create([
        'name' => 'Cancelled campaign',
        'updated_at' => now()->subHours(49),
    ]);

    $this->artisan('app:notify-abandoned-drafts')
        ->assertSuccessful()
        ->expectsOutputToContain('No abandoned drafts to notify');

    Notification::assertNothingSent();
});

it('updates draft_notified_at after notification', function (): void {
    $campaign = Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'status' => 'draft',
        'name' => 'Will be marked',
        'updated_at' => now()->subHours(49),
    ]);

    $this->artisan('app:notify-abandoned-drafts')->assertSuccessful();

    $campaign->refresh();
    expect($campaign->draft_notified_at)->not->toBeNull();
});

it('mail contains campaign name and deep link', function (): void {
    $campaign = Campaign::factory()->forPartner($this->partner)->forUser($this->user)->create([
        'status' => 'draft',
        'name' => 'Test Deep Link',
        'updated_at' => now()->subHours(49),
    ]);

    $notification = new AbandonedDraftNotification($campaign);
    $mail = $notification->toMail($this->user);

    expect($mail->subject)->toContain('Test Deep Link')
        ->and($mail->actionUrl)->toContain("/campaigns/new?draft={$campaign->id}");
});
