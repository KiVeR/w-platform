<?php

declare(strict_types=1);

namespace App\DTOs\Targeting;

readonly class CanonicalTargeting
{
    /**
     * @param  ResolvedZone[]  $zones
     */
    public function __construct(
        public string $method,
        public TargetingInput $input,
        public array $zones = [],
        public ?TargetingOrigin $origin = null,
        public ?Demographics $demographics = null,
    ) {}

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'method' => $this->method,
            'input' => $this->input->toArray(),
            'zones' => array_map(fn (ResolvedZone $z) => $z->toArray(), $this->zones),
            'origin' => $this->origin?->toArray(),
            'demographics' => $this->demographics?->toArray(),
        ];
    }

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            method: (string) $data['method'],
            input: TargetingInput::fromArray($data['input'] ?? ['method' => $data['method']]),
            zones: array_map(
                fn (array $z) => ResolvedZone::fromArray($z),
                $data['zones'] ?? [],
            ),
            origin: isset($data['origin']) ? TargetingOrigin::fromArray($data['origin']) : null,
            demographics: isset($data['demographics']) ? Demographics::fromArray($data['demographics']) : null,
        );
    }
}
