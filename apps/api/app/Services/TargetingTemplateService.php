<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Campaign;
use App\Models\TargetingTemplate;

final class TargetingTemplateService
{
    /**
     * Compute a deterministic hash for a targeting array.
     *
     * @param  array<string, mixed>  $targeting
     */
    public static function computeHash(array $targeting): string
    {
        $sorted = $targeting;
        ksort($sorted);

        return md5((string) json_encode($sorted));
    }

    /**
     * Auto-save a targeting template from a campaign.
     *
     * If an identical targeting already exists for the partner, increments usage_count.
     * Otherwise, creates a new template.
     *
     * Returns the existing or newly created template, or null if skipped.
     */
    public function autoSaveFromCampaign(Campaign $campaign): ?TargetingTemplate
    {
        if (! $campaign->partner_id || ! $campaign->targeting || $campaign->is_demo) {
            return null;
        }

        $targeting = $campaign->targeting;
        $hash = self::computeHash($targeting);

        // Optimised: query by indexed hash column instead of loading all templates in memory
        $existing = TargetingTemplate::where('partner_id', $campaign->partner_id)
            ->where('targeting_hash', $hash)
            ->first();

        if ($existing) {
            $existing->increment('usage_count');
            $existing->update(['last_used_at' => now()]);

            return $existing;
        }

        return TargetingTemplate::create([
            'partner_id' => $campaign->partner_id,
            'name' => $this->generateName($targeting),
            'targeting_json' => $targeting,
            'targeting_hash' => $hash,
            'usage_count' => 1,
            'last_used_at' => now(),
        ]);
    }

    /**
     * Generate a human-readable name from a targeting array.
     *
     * @param  array<string, mixed>  $targeting
     */
    public function generateName(array $targeting): string
    {
        $method = $targeting['method'] ?? 'unknown';
        $gender = match ($targeting['gender'] ?? null) {
            'M' => 'Hommes',
            'F' => 'Femmes',
            default => 'Mixte',
        };

        $ageMin = $targeting['age_min'] ?? null;
        $ageMax = $targeting['age_max'] ?? null;
        $agePart = '';
        if ($ageMin && $ageMax) {
            $agePart = " {$ageMin}-{$ageMax}";
        } elseif ($ageMin) {
            $agePart = " {$ageMin}+";
        }

        return match ($method) {
            'department' => 'Zone Dept '.implode(', ', array_slice($targeting['departments'] ?? [], 0, 3))
                .(count($targeting['departments'] ?? []) > 3 ? '...' : '')
                ." — {$gender}{$agePart}",
            'postcode' => 'CP '.implode(', ', array_slice($targeting['postcodes'] ?? [], 0, 3))
                .(count($targeting['postcodes'] ?? []) > 3 ? '...' : '')
                ." — {$gender}{$agePart}",
            'address' => 'Rayon '.round(($targeting['radius'] ?? 0) / 1000).' km'
                .($targeting['address'] ? ' — '.mb_substr($targeting['address'], 0, 20) : '')
                ." — {$gender}{$agePart}",
            default => "Zone {$gender}{$agePart}",
        };
    }
}
