<?php

declare(strict_types=1);

namespace App\Services\CampaignSending;

use App\Contracts\TargetingAdapterInterface;
use App\DTOs\Targeting\CanonicalTargeting;
use App\Models\Campaign;

class WepakPayloadBuilder
{
    public function __construct(
        private readonly TargetingAdapterInterface $adapter,
    ) {}

    /**
     * Build payload for prospection campaign (/smsenvoi.php).
     *
     * @return array<string, mixed>
     */
    public function buildProspectionPayload(Campaign $campaign, bool $estimateOnly = false): array
    {
        $targeting = $this->resolveTargeting($campaign->targeting ?? []);

        $payload = [
            'query' => 'calcule_groupe_localite',
            'genre' => $this->mapGender($targeting['gender'] ?? null),
            'age_min' => $this->mapMinAge($targeting['age_min'] ?? null),
            'age_max' => $this->mapMaxAge($targeting['age_max'] ?? null),
            'liste_cp_dept' => $this->buildLocationList($targeting),
            'volume' => $campaign->volume_estimated ?? 0,
            'is_split_volume' => $this->hasSplitVolume($targeting),
        ];

        if (! $estimateOnly) {
            $payload['content'] = $campaign->message ?? '';
            $payload['expediteur'] = $campaign->sender ?? '';
            $payload['is_double'] = $this->isDoubleSms($campaign->message ?? '');
            $payload['idrouteur'] = $this->getRouterId($campaign);

            $payload = [...$payload, ...$this->buildBlacklist($targeting), ...$this->buildInterestGroups($campaign)];
        }

        return $payload;
    }

    /**
     * Build payload for demo mode (/smsenvoi.php with query=send_test).
     * Sends to additional_phone (or partner phone as fallback), no targeting.
     *
     * @return array<string, mixed>
     */
    public function buildDemoPayload(Campaign $campaign): array
    {
        return [
            'query' => 'send_test',
            'numero_commercant' => $campaign->additional_phone ?? $campaign->partner?->phone,
            'content' => $campaign->message ?? '',
            'senderlabel' => $campaign->sender ?? '',
            'idrouteur' => $this->getRouterId($campaign),
            'idcampagne' => $campaign->id,
        ];
    }

    /**
     * Build payload for fidelisation campaign (/sendsmsjson.php).
     *
     * @param  list<array{phone: string, prenom?: string}>  $recipients
     * @return array<string, mixed>
     */
    public function buildFidelisationPayload(Campaign $campaign, array $recipients): array
    {
        return [
            'expediteur' => $campaign->sender ?? '',
            'content' => $campaign->message ?? '',
            'idrouteur' => $this->getRouterId($campaign),
            'liste' => $recipients,
        ];
    }

    /**
     * Build payload for volume estimation only (/smsenvoi.php).
     *
     * @return array<string, mixed>
     */
    public function buildEstimatePayload(Campaign $campaign): array
    {
        return $this->buildProspectionPayload($campaign, estimateOnly: true);
    }

    /**
     * Transform canonical targeting to Wepak format, or pass through legacy format.
     *
     * @param  array<string, mixed>  $targeting
     * @return array<string, mixed>
     */
    private function resolveTargeting(array $targeting): array
    {
        if (isset($targeting['method'])) {
            return $this->adapter->transform(CanonicalTargeting::fromArray($targeting));
        }

        return $targeting;
    }

    protected function mapGender(?string $gender): string
    {
        return match ($gender) {
            'M', 'male' => 'homme',
            'F', 'female' => 'femme',
            default => 'mixte',
        };
    }

    protected function mapMinAge(?int $age): ?int
    {
        return ($age !== null && $age > 18) ? $age : null;
    }

    protected function mapMaxAge(?int $age): ?int
    {
        return ($age !== null && $age < 75) ? $age : null;
    }

    /**
     * @param  array<string, mixed>  $targeting
     * @return list<array{label: string, quantite: int, type: string, filtre?: array<string, mixed>|null}>
     */
    protected function buildLocationList(array $targeting): array
    {
        $locations = [];
        $postcodes = $targeting['geo']['postcodes'] ?? [];

        if (! is_array($postcodes)) {
            return [];
        }

        /** @var array{code: string, volume?: int, type?: string, filter?: array<string, mixed>|null} $entry */
        foreach ($postcodes as $entry) {
            $locations[] = [
                'label' => $entry['code'],
                'quantite' => (int) ($entry['volume'] ?? 0),
                'type' => (string) ($entry['type'] ?? $this->guessLocationType($entry['code'])),
                'filtre' => $entry['filter'] ?? null,
            ];
        }

        return $locations;
    }

    protected function guessLocationType(string $code): string
    {
        return match (mb_strlen($code)) {
            5 => 'cp',
            1, 2, 3 => 'dept',
            9 => 'iris',
            default => 'cp',
        };
    }

    /** @param array<string, mixed> $targeting */
    protected function hasSplitVolume(array $targeting): bool
    {
        $postcodes = $targeting['geo']['postcodes'] ?? [];

        if (! is_array($postcodes)) {
            return false;
        }

        /** @var array{volume?: int} $entry */
        foreach ($postcodes as $entry) {
            if (isset($entry['volume']) && $entry['volume'] > 0) {
                return true;
            }
        }

        return false;
    }

    protected function isDoubleSms(string $message): bool
    {
        return mb_strlen($message) > 160;
    }

    protected function getRouterId(Campaign $campaign): ?int
    {
        return $campaign->partner?->router?->external_id;
    }

    /**
     * @param  array<string, mixed>  $targeting
     * @return array<string, mixed>
     */
    protected function buildBlacklist(array $targeting): array
    {
        $result = [];

        $result['repoussoir'] = isset($targeting['blacklist_id']) ? 1 : 0;

        if (isset($targeting['blacklist_id'])) {
            $result['id_fichier_repoussoir_statique'] = $targeting['blacklist_id'];
        }

        if (isset($targeting['campaign_blacklist_id'])) {
            $result['liste_repoussoir_campagne'] = $targeting['campaign_blacklist_id'];
        }

        return $result;
    }

    /**
     * @return array<string, mixed>
     */
    protected function buildInterestGroups(Campaign $campaign): array
    {
        $groups = $campaign->interestGroups;

        if ($groups->isEmpty()) {
            return [];
        }

        $familleQualif = [];
        $groupQualif = [];

        foreach ($groups as $group) {
            $familleQualif[] = [
                'index' => $group->pivot->index ?? 0,
                'operator' => $group->pivot->operator ?? 'AND',
            ];

            $groupQualif[] = [
                'id' => $group->id,
                'name' => $group->label,
                'type' => 'ci',
            ];
        }

        return [
            'famille_qualif' => $familleQualif,
            'group_qualif' => $groupQualif,
        ];
    }
}
