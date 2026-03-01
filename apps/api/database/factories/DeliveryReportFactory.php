<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\DeliveryReport;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DeliveryReport>
 */
class DeliveryReportFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'provider' => fake()->randomElement(['sinch', 'infobip', 'highconnexion']),
            'report' => [
                'type' => 'recipient_delivery_report_sms',
                'status' => 'delivered',
                'recipient' => fake()->e164PhoneNumber(),
            ],
            'digested' => false,
        ];
    }

    public function sinch(): static
    {
        return $this->state(fn (array $attributes): array => [
            'provider' => 'sinch',
        ]);
    }

    public function infobip(): static
    {
        return $this->state(fn (array $attributes): array => [
            'provider' => 'infobip',
        ]);
    }

    public function highconnexion(): static
    {
        return $this->state(fn (array $attributes): array => [
            'provider' => 'highconnexion',
        ]);
    }

    public function digested(): static
    {
        return $this->state(fn (array $attributes): array => [
            'digested' => true,
        ]);
    }
}
