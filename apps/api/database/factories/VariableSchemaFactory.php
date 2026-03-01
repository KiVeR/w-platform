<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Partner;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<\App\Models\VariableSchema>
 */
class VariableSchemaFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'uuid' => Str::uuid()->toString(),
            'partner_id' => Partner::factory(),
            'name' => fake()->sentence(3),
            'global_data' => null,
            'recipient_preview_data' => null,
        ];
    }

    public function withGlobalData(): static
    {
        return $this->state(fn (array $attributes): array => [
            'global_data' => [
                ['key' => 'm1', 'data' => ['nom_magasin' => 'Carrefour Nantes']],
            ],
        ]);
    }

    public function withRecipientPreviewData(): static
    {
        return $this->state(fn (array $attributes): array => [
            'recipient_preview_data' => [
                'global_parameters_key' => 'm1',
                'prenom' => 'Marie',
            ],
        ]);
    }

    public function forPartner(?Partner $partner = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'partner_id' => $partner?->id ?? Partner::factory(),
        ]);
    }
}
