<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\CampaignRecipientStatus;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CampaignRecipient>
 */
class CampaignRecipientFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'campaign_id' => Campaign::factory(),
            'status' => CampaignRecipientStatus::Queued,
            'phone_number' => fake()->e164PhoneNumber(),
        ];
    }

    public function dispatched(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => CampaignRecipientStatus::Dispatched,
        ]);
    }

    public function delivered(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => CampaignRecipientStatus::Delivered,
            'delivered_at' => now(),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => CampaignRecipientStatus::Failed,
        ]);
    }

    public function withBatch(string $batchUuid): static
    {
        return $this->state(fn (array $attributes): array => [
            'routing_batch_uuid' => $batchUuid,
        ]);
    }
}
