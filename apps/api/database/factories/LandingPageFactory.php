<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\LandingPageStatus;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\LandingPage>
 */
class LandingPageFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'partner_id' => Partner::factory(),
            'user_id' => User::factory(),
            'name' => fake()->sentence(3),
            'title' => fake()->sentence(3),
            'status' => LandingPageStatus::DRAFT,
            'design' => null,
            'is_active' => true,
            'og_title' => null,
            'og_description' => null,
            'og_image_url' => null,
            'favicon_url' => null,
            'short_url_api_id' => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => LandingPageStatus::PUBLISHED,
        ]);
    }

    public function archived(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => LandingPageStatus::ARCHIVED,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_active' => false,
        ]);
    }

    public function withDesign(): static
    {
        return $this->state(fn (array $attributes): array => [
            'design' => [
                'version' => '1.0',
                'globalStyles' => ['backgroundColor' => '#ffffff'],
                'widgets' => [
                    ['type' => 'text', 'content' => 'Hello World'],
                ],
            ],
        ]);
    }

    public function forPartner(?Partner $partner = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'partner_id' => $partner?->id ?? Partner::factory(),
        ]);
    }

    public function forUser(?User $user = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'user_id' => $user?->id ?? User::factory(),
        ]);
    }
}
