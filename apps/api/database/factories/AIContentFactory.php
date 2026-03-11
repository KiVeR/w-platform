<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ContentStatus;
use App\Enums\ContentType;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\AIContent>
 */
class AIContentFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'partner_id' => Partner::factory(),
            'user_id' => User::factory(),
            'type' => fake()->randomElement(ContentType::cases())->value,
            'title' => fake()->sentence(4),
            'status' => ContentStatus::DRAFT,
            'is_favorite' => false,
            'design' => null,
            'variable_schema_id' => null,
        ];
    }

    public function landingPage(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => ContentType::LANDING_PAGE,
        ]);
    }

    public function rcs(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => ContentType::RCS,
        ]);
    }

    public function sms(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => ContentType::SMS,
        ]);
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => ContentStatus::PUBLISHED,
        ]);
    }

    public function archived(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => ContentStatus::ARCHIVED,
        ]);
    }

    public function favorite(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_favorite' => true,
        ]);
    }

    public function withDesign(): static
    {
        return $this->state(fn (array $attributes): array => [
            'design' => [
                'version' => '1.0',
                'globalStyles' => ['backgroundColor' => '#ffffff'],
                'widgets' => [
                    ['id' => 'widget-1', 'type' => 'text', 'content' => 'Hello World'],
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
