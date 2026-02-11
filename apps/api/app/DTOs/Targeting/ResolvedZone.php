<?php

declare(strict_types=1);

namespace App\DTOs\Targeting;

readonly class ResolvedZone
{
    public function __construct(
        public string $code,
        public string $type,
        public string $label,
        public int $volume = 0,
    ) {}

    /** @return array{code: string, type: string, label: string, volume: int} */
    public function toArray(): array
    {
        return [
            'code' => $this->code,
            'type' => $this->type,
            'label' => $this->label,
            'volume' => $this->volume,
        ];
    }

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            code: (string) $data['code'],
            type: (string) $data['type'],
            label: (string) $data['label'],
            volume: (int) ($data['volume'] ?? 0),
        );
    }
}
