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
        /** @var array<string, mixed> */
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

        /** @var array<string, mixed> $data */
        $data = $response->json() ?? [];

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
}
