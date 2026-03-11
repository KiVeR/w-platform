<?php

declare(strict_types=1);

use App\Models\Partner;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Laravel\Passport\Passport;

beforeEach(function (): void {
    $this->seed(RolesAndPermissionsSeeder::class);
});

// --- POST /api/ai/generate ---

it('dispatches a generation job and returns a job ID', function (): void {
    Queue::fake();

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/ai/generate', [
        'prompt' => 'Create a landing page for a bakery',
    ]);

    $response->assertStatus(202)
        ->assertJsonStructure(['job_id', 'status'])
        ->assertJson(['status' => 'pending']);

    expect($response->json('job_id'))->toBeString()->not->toBeEmpty();
});

it('requires authentication to generate', function (): void {
    $response = $this->postJson('/api/ai/generate', [
        'prompt' => 'Create a landing page',
    ]);

    $response->assertUnauthorized();
});

it('validates prompt is required', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/ai/generate', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['prompt']);
});

it('validates prompt max length', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/ai/generate', [
        'prompt' => str_repeat('a', 10001),
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['prompt']);
});

it('validates image mime type', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/ai/generate', [
        'prompt' => 'Create a page from this image',
        'image' => [
            'data' => base64_encode('fake-image-data'),
            'mime_type' => 'image/svg+xml',
        ],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['image.mime_type']);
});

it('validates conversation history structure', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/ai/generate', [
        'prompt' => 'Refine the previous design',
        'conversation_history' => [
            ['role' => 'invalid_role', 'content' => 'test'],
        ],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['conversation_history.0.role']);
});

it('accepts valid conversation history', function (): void {
    Queue::fake();

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/ai/generate', [
        'prompt' => 'Change the color to blue',
        'conversation_history' => [
            ['role' => 'user', 'content' => 'Create a bakery page'],
            ['role' => 'assistant', 'content' => 'Here is a design...'],
        ],
    ]);

    $response->assertStatus(202);
});

it('accepts valid image with supported mime type', function (): void {
    Queue::fake();

    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->postJson('/api/ai/generate', [
        'prompt' => 'Recreate this design',
        'image' => [
            'data' => base64_encode('fake-png-data'),
            'mime_type' => 'image/png',
        ],
    ]);

    $response->assertStatus(202);
});

// --- GET /api/ai/generate/{jobId}/status ---

it('returns pending status for a new job', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $jobId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    Cache::put("ai-job:{$jobId}", [
        'status' => 'pending',
    ], 3600);

    $response = $this->getJson("/api/ai/generate/{$jobId}/status");

    $response->assertOk()
        ->assertJson(['status' => 'pending']);
});

it('returns completed status with design', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $jobId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    Cache::put("ai-job:{$jobId}", [
        'status' => 'completed',
        'design' => [
            'version' => '1.0',
            'globalStyles' => ['backgroundColor' => '#ffffff'],
            'widgets' => [],
        ],
        'description' => 'A test design',
        'usage' => ['input_tokens' => 100, 'output_tokens' => 200],
    ], 3600);

    $response = $this->getJson("/api/ai/generate/{$jobId}/status");

    $response->assertOk()
        ->assertJson([
            'status' => 'completed',
            'design' => ['version' => '1.0'],
        ])
        ->assertJsonStructure(['status', 'design', 'description', 'usage']);
});

it('returns failed status with error', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $jobId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    Cache::put("ai-job:{$jobId}", [
        'status' => 'failed',
        'error' => 'AI rate limit exceeded.',
    ], 3600);

    $response = $this->getJson("/api/ai/generate/{$jobId}/status");

    $response->assertOk()
        ->assertJson([
            'status' => 'failed',
            'error' => 'AI rate limit exceeded.',
        ]);
});

it('returns 404 for unknown job ID', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->getJson('/api/ai/generate/f47ac10b-58cc-4372-a567-0e02b2c3d479/status');

    $response->assertNotFound();
});

it('returns 400 for invalid job ID format', function (): void {
    $partner = Partner::factory()->create();
    $user = User::factory()->forPartner($partner)->create();
    $user->assignRole('partner');
    Passport::actingAs($user);

    $response = $this->getJson('/api/ai/generate/not-a-uuid/status');

    $response->assertStatus(400);
});

it('requires authentication to check status', function (): void {
    $response = $this->getJson('/api/ai/generate/f47ac10b-58cc-4372-a567-0e02b2c3d479/status');

    $response->assertUnauthorized();
});
