<?php

declare(strict_types=1);

namespace App\DTOs\Targeting;

readonly class TargetingInput
{
    /**
     * @param  string[]  $departments
     * @param  string[]  $postcodes
     * @param  string[]  $communes
     * @param  string[]  $iris_codes
     */
    public function __construct(
        public string $method,
        public array $departments = [],
        public array $postcodes = [],
        public array $communes = [],
        public array $iris_codes = [],
        public ?string $address = null,
        public ?float $lat = null,
        public ?float $lng = null,
        public ?int $radius = null,
        public ?string $gender = null,
        public ?int $ageMin = null,
        public ?int $ageMax = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromRequest(array $data): self
    {
        return new self(
            method: (string) $data['method'],
            departments: (array) ($data['departments'] ?? []),
            postcodes: (array) ($data['postcodes'] ?? []),
            communes: (array) ($data['communes'] ?? []),
            iris_codes: (array) ($data['iris_codes'] ?? []),
            address: $data['address'] ?? null,
            lat: isset($data['lat']) ? (float) $data['lat'] : null,
            lng: isset($data['lng']) ? (float) $data['lng'] : null,
            radius: isset($data['radius']) ? (int) $data['radius'] : null,
            gender: $data['gender'] ?? null,
            ageMin: isset($data['age_min']) ? (int) $data['age_min'] : null,
            ageMax: isset($data['age_max']) ? (int) $data['age_max'] : null,
        );
    }

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return self::fromRequest($data);
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'method' => $this->method,
            'departments' => $this->departments,
            'postcodes' => $this->postcodes,
            'communes' => $this->communes,
            'iris_codes' => $this->iris_codes,
            'address' => $this->address,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'radius' => $this->radius,
            'gender' => $this->gender,
            'age_min' => $this->ageMin,
            'age_max' => $this->ageMax,
        ];
    }
}
