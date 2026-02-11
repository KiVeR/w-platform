<?php

declare(strict_types=1);

namespace App\DTOs\Targeting;

readonly class TargetingOrigin
{
    public function __construct(
        public string $address,
        public float $lat,
        public float $lng,
        public int $radius,
    ) {}

    /** @return array{address: string, lat: float, lng: float, radius: int} */
    public function toArray(): array
    {
        return [
            'address' => $this->address,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'radius' => $this->radius,
        ];
    }

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            address: (string) $data['address'],
            lat: (float) $data['lat'],
            lng: (float) $data['lng'],
            radius: (int) $data['radius'],
        );
    }
}
