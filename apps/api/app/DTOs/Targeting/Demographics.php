<?php

declare(strict_types=1);

namespace App\DTOs\Targeting;

readonly class Demographics
{
    public function __construct(
        public ?string $gender = null,
        public ?int $ageMin = null,
        public ?int $ageMax = null,
    ) {}

    /** @return array{gender: string|null, age_min: int|null, age_max: int|null} */
    public function toArray(): array
    {
        return [
            'gender' => $this->gender,
            'age_min' => $this->ageMin,
            'age_max' => $this->ageMax,
        ];
    }

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            gender: $data['gender'] ?? null,
            ageMin: isset($data['age_min']) ? (int) $data['age_min'] : null,
            ageMax: isset($data['age_max']) ? (int) $data['age_max'] : null,
        );
    }
}
