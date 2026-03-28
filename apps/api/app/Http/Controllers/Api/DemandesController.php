<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDemandeRequest;
use App\Http\Requests\UpdateDemandeRequest;
use App\Http\Resources\DemandeResource;
use App\Models\Demande;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class DemandesController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Demande::class);

        $user = $this->currentUser();

        $demandes = QueryBuilder::for(Demande::forUser($user))
            ->withCount([
                'operations',
                'operations as operations_completed_count' => fn ($q) => $q->where('lifecycle_status', 'completed'),
                'operations as operations_blocked_count' => fn ($q) => $q->where('lifecycle_status', 'on_hold'),
            ])
            ->allowedFilters([
                AllowedFilter::exact('partner_id'),
                AllowedFilter::partial('ref_demande'),
                AllowedFilter::exact('is_exoneration'),
                AllowedFilter::callback('created_at_from', function (Builder $query, mixed $value): void {
                    if (! is_string($value) || $value === '') {
                        return;
                    }

                    $query->whereDate('created_at', '>=', $value);
                }),
                AllowedFilter::callback('created_at_to', function (Builder $query, mixed $value): void {
                    if (! is_string($value) || $value === '') {
                        return;
                    }

                    $query->whereDate('created_at', '<=', $value);
                }),
            ])
            ->allowedSorts(['created_at', 'ref_demande'])
            ->allowedIncludes(['partner', 'commercial', 'sdr', 'operations'])
            ->paginate(15);

        return DemandeResource::collection($demandes);
    }

    public function store(StoreDemandeRequest $request): DemandeResource
    {
        $this->authorize('create', Demande::class);

        $user = $this->currentUser();

        $data = $request->validated();

        if (! $user->hasRole('admin')) {
            $data['partner_id'] = $user->partner_id;
        }

        $demande = Demande::create($data);

        return new DemandeResource($demande->load(['partner']));
    }

    public function show(Demande $demande): DemandeResource
    {
        $this->authorize('view', $demande);

        $demande = QueryBuilder::for(Demande::where('id', $demande->id))
            ->withCount([
                'operations',
                'operations as operations_completed_count' => fn ($q) => $q->where('lifecycle_status', 'completed'),
                'operations as operations_blocked_count' => fn ($q) => $q->where('lifecycle_status', 'on_hold'),
            ])
            ->allowedIncludes(['partner', 'commercial', 'sdr', 'operations'])
            ->firstOrFail();

        return new DemandeResource($demande);
    }

    public function update(UpdateDemandeRequest $request, Demande $demande): DemandeResource
    {
        $this->authorize('update', $demande);

        $demande->update($request->validated());

        return new DemandeResource($demande->fresh());
    }

    public function destroy(Demande $demande): JsonResponse
    {
        $this->authorize('delete', $demande);

        if ($demande->operations()->active()->exists()) {
            return new JsonResponse([
                'message' => 'Cannot delete a demande with active operations.',
            ], 422);
        }

        $demande->delete();

        return new JsonResponse(['message' => 'Demande deleted.']);
    }
}
