<?php

declare(strict_types=1);

namespace App\Services\AI;

use App\Models\AIUsage;
use App\Models\User;
use Illuminate\Support\Carbon;

class AIQuotaService
{
    public function canGenerate(User $user): bool
    {
        $limit = $this->getLimit($user);

        if ($limit <= 0) {
            return false;
        }

        $usage = $this->getCurrentUsage($user);

        return $usage < $limit;
    }

    /**
     * @return array{remaining: int, limit: int, resets_at: string, can_generate: bool}
     */
    public function getQuotaInfo(User $user): array
    {
        $limit = $this->getLimit($user);
        $usage = $this->getCurrentUsage($user);
        $remaining = max(0, $limit - $usage);
        $canGenerate = $limit > 0 && $usage < $limit;

        return [
            'remaining' => $remaining,
            'limit' => $limit,
            'resets_at' => $this->getResetsAt(),
            'can_generate' => $canGenerate,
        ];
    }

    public function incrementUsage(User $user): void
    {
        $periodKey = $this->getCurrentPeriodKey();

        $existing = AIUsage::where('user_id', $user->id)
            ->where('period_key', $periodKey)
            ->first();

        if ($existing !== null) {
            $existing->increment('count');
            $existing->update(['last_generated_at' => now()]);
        } else {
            AIUsage::create([
                'user_id' => $user->id,
                'period_key' => $periodKey,
                'count' => 1,
                'last_generated_at' => now(),
            ]);
        }
    }

    public function refundUsage(User $user): void
    {
        $periodKey = $this->getCurrentPeriodKey();

        $usage = AIUsage::where('user_id', $user->id)
            ->where('period_key', $periodKey)
            ->first();

        if ($usage !== null && $usage->count > 0) {
            $usage->decrement('count');
        }
    }

    public function getCurrentPeriodKey(): string
    {
        return now()->format('Y-m');
    }

    private function getCurrentUsage(User $user): int
    {
        $usage = AIUsage::where('user_id', $user->id)
            ->where('period_key', $this->getCurrentPeriodKey())
            ->first();

        return $usage?->count ?? 0;
    }

    private function getLimit(User $user): int
    {
        $roles = $user->getRoleNames()->toArray();
        $firstRole = $roles[0] ?? null;

        if ($firstRole === null) {
            return 0;
        }

        /** @var array<string, int> $quotaByRole */
        $quotaByRole = config('ai.quota_by_role', []);

        return $quotaByRole[$firstRole] ?? 0;
    }

    private function getResetsAt(): string
    {
        return Carbon::now()->endOfMonth()->toIso8601String();
    }
}
