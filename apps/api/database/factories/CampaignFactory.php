<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\CampaignChannel;
use App\Enums\CampaignStatus;
use App\Enums\CampaignType;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Campaign>
 */
class CampaignFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'partner_id' => Partner::factory(),
            'user_id' => User::factory(),
            'type' => CampaignType::PROSPECTION,
            'channel' => CampaignChannel::SMS,
            'status' => CampaignStatus::DRAFT,
            'is_demo' => false,
            'name' => fake()->sentence(3),
            'targeting' => null,
            'volume_estimated' => 0,
            'volume_sent' => 0,
            'sms_count' => 0,
            'unit_price' => null,
            'total_price' => null,
        ];
    }

    public function prospection(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => CampaignType::PROSPECTION,
            'channel' => CampaignChannel::SMS,
        ]);
    }

    public function fidelisation(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => CampaignType::FIDELISATION,
            'channel' => CampaignChannel::SMS,
        ]);
    }

    public function comptage(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => CampaignType::COMPTAGE,
            'channel' => CampaignChannel::SMS,
        ]);
    }

    public function scheduled(?\DateTimeInterface $at = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => CampaignStatus::SCHEDULED,
            'scheduled_at' => $at ?? now()->addDay(),
        ]);
    }

    public function sent(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => CampaignStatus::SENT,
            'sent_at' => now(),
        ]);
    }

    public function demo(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_demo' => true,
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

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => CampaignStatus::CANCELLED,
        ]);
    }

    public function failed(?string $error = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => CampaignStatus::FAILED,
            'error_message' => $error ?? 'Erreur lors de l\'envoi via le routeur SMS.',
        ]);
    }

    public function sending(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => CampaignStatus::SENDING,
            'scheduled_at' => now(),
        ]);
    }

    public function withMessage(string $message): static
    {
        return $this->state(fn (array $attributes): array => [
            'message' => $message,
        ]);
    }

    public function withTargeting(array $targeting): static
    {
        return $this->state(fn (array $attributes): array => [
            'targeting' => $targeting,
        ]);
    }

    public function withPricing(float $unitPrice, float $totalPrice): static
    {
        return $this->state(fn (array $attributes): array => [
            'unit_price' => $unitPrice,
            'total_price' => $totalPrice,
        ]);
    }

    public function withVolume(int $estimated, int $sent = 0): static
    {
        return $this->state(fn (array $attributes): array => [
            'volume_estimated' => $estimated,
            'volume_sent' => $sent,
        ]);
    }
}
