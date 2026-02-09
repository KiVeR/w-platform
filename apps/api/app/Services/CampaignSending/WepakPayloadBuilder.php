<?php

declare(strict_types=1);

namespace App\Services\CampaignSending;

use App\Models\Campaign;

class WepakPayloadBuilder
{
    /**
     * Build payload for prospection campaign (/smsenvoi.php).
     *
     * @return array<string, mixed>
     */
    public function buildProspectionPayload(Campaign $campaign, bool $estimateOnly = false): array
    {
        $targeting = $campaign->targeting ?? [];

        $payload = [
            'query' => 'calcule_groupe_localite',
            'genre' => $this->mapGender($targeting['gender'] ?? null),
            'age_min' => $this->mapAge($targeting['age_min'] ?? null, 18),
            'age_max' => $this->mapAge($targeting['age_max'] ?? null, 75),
            'liste_cp_dept' => $this->buildLocationList($targeting),
            'volume' => $campaign->volume_estimated ?? 0,
            'is_split_volume' => $this->hasSplitVolume($targeting),
        ];

        if (! $estimateOnly) {
            $payload['content'] = $campaign->message ?? '';
            $payload['expediteur'] = $campaign->sender ?? '';
            $payload['is_double'] = $this->isDoubleSms($campaign->message ?? '');
            $payload['idrouteur'] = $this->getRouterId($campaign);

            $payload = array_merge($payload, $this->buildBlacklist($targeting));
            $payload = array_merge($payload, $this->buildInterestGroups($campaign));
        }

        return $payload;
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

    protected function mapGender(?string $gender): string
    {
        return match ($gender) {
            'M', 'male' => 'homme',
            'F', 'female' => 'femme',
            default => 'mixte',
        };
    }

    protected function mapAge(?int $age, int $boundary): ?int
    {
        if ($age === null) {
            return null;
        }

        if ($boundary === 18 && $age <= 18) {
            return null;
        }

        if ($boundary === 75 && $age >= 75) {
            return null;
        }

        return $age;
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
        $length = mb_strlen($code);

        if ($length === 5) {
            return 'cp';
        }
        if ($length <= 3) {
            return 'dept';
        }
        if ($length === 9) {
            return 'iris';
        }

        return 'cp';
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
        $partner = $campaign->partner;

        if (! $partner) {
            return null;
        }

        /** @var \App\Models\Router|null $router */
        $router = $partner->router;

        return $router?->external_id;
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
