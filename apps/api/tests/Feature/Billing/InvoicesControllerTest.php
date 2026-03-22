<?php

declare(strict_types=1);

use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('lists invoices for authenticated admin', function (): void {
    Invoice::factory()->count(3)->create();

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $response = $this->getJson('/api/invoices');

    $response->assertOk()
        ->assertJsonCount(3, 'data');
});

it('partner user only sees own invoices', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();

    Invoice::factory()->count(2)->forPartner($partner1)->create();
    Invoice::factory()->count(3)->forPartner($partner2)->create();

    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->getJson('/api/invoices');

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('shows invoice detail with lines', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $invoice = Invoice::factory()->create();
    InvoiceLine::factory()->count(2)->forInvoice($invoice)->create();

    $response = $this->getJson("/api/invoices/{$invoice->id}?include=lines");

    $response->assertOk()
        ->assertJsonPath('data.id', $invoice->id)
        ->assertJsonCount(2, 'data.lines');
});

it('returns 403 for other partner invoice', function (): void {
    $partner1 = Partner::factory()->create();
    $partner2 = Partner::factory()->create();

    $invoice = Invoice::factory()->forPartner($partner2)->create();

    $user = User::factory()->forPartner($partner1)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->getJson("/api/invoices/{$invoice->id}");

    $response->assertForbidden();
});

it('filters invoices by status', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Invoice::factory()->draft()->count(2)->create();
    Invoice::factory()->sent()->count(1)->create();
    Invoice::factory()->paid()->count(1)->create();

    $response = $this->getJson('/api/invoices?filter[status]=draft');

    $response->assertOk()
        ->assertJsonCount(2, 'data');
});

it('sorts invoices by invoice_date', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    Invoice::factory()->create(['invoice_date' => '2026-03-01']);
    Invoice::factory()->create(['invoice_date' => '2026-01-15']);
    Invoice::factory()->create(['invoice_date' => '2026-02-20']);

    $response = $this->getJson('/api/invoices?sort=invoice_date');

    $response->assertOk();
    $dates = collect($response->json('data'))->pluck('invoice_date')->toArray();
    expect($dates)->toBe(['2026-01-15', '2026-02-20', '2026-03-01']);
});

it('returns 401 for unauthenticated request', function (): void {
    $response = $this->getJson('/api/invoices');

    $response->assertUnauthorized();
});

it('includes partner relationship', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Passport::actingAs($admin);

    $partner = Partner::factory()->create(['name' => 'Test Partner']);
    $invoice = Invoice::factory()->forPartner($partner)->create();

    $response = $this->getJson("/api/invoices/{$invoice->id}?include=partner");

    $response->assertOk()
        ->assertJsonPath('data.partner.name', 'Test Partner');
});
