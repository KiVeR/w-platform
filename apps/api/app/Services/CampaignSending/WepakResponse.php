<?php

declare(strict_types=1);

namespace App\Services\CampaignSending;

use Illuminate\Http\Client\Response;

readonly class WepakResponse
{
    public function __construct(
        public bool $success,
        public ?int $campaignId = null,
        public ?int $volume = null,
        public ?string $error = null,
        /** @var array<mixed> */
        public array $raw = [],
    ) {}

    public static function fromHttpResponse(Response $response): self
    {
        if ($response->failed()) {
            return new self(
                success: false,
                error: 'HTTP '.$response->status().': '.$response->body(),
            );
        }

        /** @var array<mixed> $data */
        $data = $response->json() ?? [];

        // Estimate responses return an array of zone volumes: [{Type, Localite, Volume}, ...]
        if (array_is_list($data)) {
            $totalVolume = self::extractTotalVolume($data);

            return new self(
                success: true,
                volume: $totalVolume,
                raw: $data,
            );
        }

        $idMessage = (int) ($data['id_message'] ?? 0);

        if ($idMessage !== 0) {
            return new self(
                success: false,
                error: 'Wepak error (id_message='.$idMessage.')',
                raw: $data,
            );
        }

        return new self(
            success: true,
            campaignId: isset($data['id_campagne_api']) ? (int) $data['id_campagne_api'] : null,
            volume: isset($data['volume']) ? (int) $data['volume'] : null,
            raw: $data,
        );
    }

    /**
     * Extract total volume from Wepak estimate response array.
     * Format: [{"Type":"dept","Localite":"77","Volume":670366}, {"Type":"total","Localite":"total","Volume":670366}]
     *
     * @param  list<array<string, mixed>>  $rows
     */
    private static function extractTotalVolume(array $rows): int
    {
        foreach ($rows as $row) {
            if (($row['Type'] ?? null) === 'total') {
                return (int) ($row['Volume'] ?? 0);
            }
        }

        // Fallback: sum all Volume values
        return (int) array_sum(array_column($rows, 'Volume'));
    }
}
