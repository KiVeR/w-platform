<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\PartnerFeatureKey;
use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Models\PartnerFeature;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PartnerFeaturesController extends Controller
{
    public function index(Partner $partner): JsonResource
    {
        $user = $this->currentUser();

        if (! $user->hasRole('admin') && $user->partner_id !== $partner->id) {
            abort(403);
        }

        // Return all feature keys with their status — create missing ones as disabled
        $existing = $partner->features()->get()->keyBy(fn (PartnerFeature $f) => $f->key->value);

        $features = collect(PartnerFeatureKey::cases())->map(function (PartnerFeatureKey $key) use ($existing) {
            $feature = $existing->get($key->value);

            return [
                'key' => $key->value,
                'is_enabled' => $feature?->is_enabled ?? false,
            ];
        });

        return new JsonResource($features);
    }

    public function update(Request $request, Partner $partner, string $feature): JsonResponse
    {
        $user = $this->currentUser();

        if (! $user->hasRole('admin')) {
            abort(403);
        }

        $featureKey = PartnerFeatureKey::tryFrom($feature);
        if (! $featureKey) {
            abort(404);
        }

        $validated = $request->validate([
            'is_enabled' => ['required', 'boolean'],
        ]);

        $partnerFeature = PartnerFeature::updateOrCreate(
            ['partner_id' => $partner->id, 'key' => $featureKey->value],
            ['is_enabled' => $validated['is_enabled']],
        );

        return response()->json([
            'data' => [
                'key' => $partnerFeature->key->value,
                'is_enabled' => $partnerFeature->is_enabled,
            ],
        ]);
    }
}
