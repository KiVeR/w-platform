<?php

declare(strict_types=1);

namespace App\Services\Geo;

/**
 * Value object representing parsed IRIS data.
 *
 * IRIS (Ilots Regroupés pour l'Information Statistique) is a French statistical unit.
 * An IRIS code is 9 digits: 5 for INSEE commune code + 4 for the IRIS identifier.
 */
final readonly class IrisData
{
    public function __construct(
        /**
         * Full IRIS code (9 digits).
         */
        public string $iris,

        /**
         * INSEE commune code (first 5 digits).
         */
        public string $cityCode,

        /**
         * IRIS identifier within the commune (last 4 digits).
         */
        public string $irisCode,

        /**
         * IRIS type:
         * - H: Habitat (residential area)
         * - A: Activité (business/industrial area)
         * - D: Divers (miscellaneous)
         * - Z: Zone (special zone, e.g., airport, forest)
         */
        public ?string $type = null,
    ) {}

    /**
     * Create from a full IRIS code string.
     */
    public static function fromString(string $iris): self
    {
        $iris = str_pad($iris, 9, '0', STR_PAD_LEFT);

        return new self(
            iris: $iris,
            cityCode: substr($iris, 0, 5),
            irisCode: substr($iris, 5, 4),
        );
    }

    /**
     * Get the department code from the IRIS.
     */
    public function getDepartment(): string
    {
        // Handle Corsica (2A, 2B) and DOM-TOM (97x)
        $prefix = substr($this->cityCode, 0, 2);

        if ($prefix === '97') {
            return substr($this->cityCode, 0, 3);
        }

        // Corsica: 2A (201-2A) and 2B (202-2B)
        if ($prefix === '20') {
            $third = (int) substr($this->cityCode, 2, 1);

            return $third <= 1 ? '2A' : '2B';
        }

        return $prefix;
    }

    /**
     * Check if this IRIS is in Paris, Lyon, or Marseille.
     */
    public function isInPlmCity(): bool
    {
        $cityPrefix = substr($this->cityCode, 0, 3);

        return in_array($cityPrefix, ['751', '693', '132'], true);
    }

    /**
     * Convert to array representation.
     *
     * @return array{iris: string, city_code: string, iris_code: string, type: ?string, department: string}
     */
    public function toArray(): array
    {
        return [
            'iris' => $this->iris,
            'city_code' => $this->cityCode,
            'iris_code' => $this->irisCode,
            'type' => $this->type,
            'department' => $this->getDepartment(),
        ];
    }
}
