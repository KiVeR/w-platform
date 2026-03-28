<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TargetingTemplate\StoreRequest;
use App\Http\Requests\TargetingTemplate\UpdateRequest;
use App\Http\Resources\TargetingTemplateResource;
use App\Models\TargetingTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class TargetingTemplatesController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', TargetingTemplate::class);

        $user = $this->currentUser();

        $query = QueryBuilder::for(TargetingTemplate::class)
            ->allowedFilters([
                AllowedFilter::exact('partner_id'),
                AllowedFilter::exact('is_preset'),
                AllowedFilter::exact('category'),
            ])
            ->allowedSorts(['name', 'usage_count', 'last_used_at', 'created_at'])
            ->allowedIncludes(['partner']);

        if (! $user->hasRole('admin')) {
            $query->where(function ($q) use ($user): void {
                $q->where('partner_id', $user->partner_id)
                    ->orWhere('is_preset', true);
            });
        }

        return TargetingTemplateResource::collection($query->paginate(config('api.pagination.default')));
    }

    public function store(StoreRequest $request): TargetingTemplateResource
    {
        $user = $this->currentUser();

        $this->authorize('create', TargetingTemplate::class);

        $data = $request->validated();

        if (! $user->hasRole('admin')) {
            $data['partner_id'] = $user->partner_id;
            unset($data['is_preset']);
        }

        $template = TargetingTemplate::create($data);

        return new TargetingTemplateResource($template);
    }

    public function show(TargetingTemplate $targetingTemplate): TargetingTemplateResource
    {
        $this->authorize('view', $targetingTemplate);

        $targetingTemplate = QueryBuilder::for(TargetingTemplate::where('id', $targetingTemplate->id))
            ->allowedIncludes(['partner'])
            ->firstOrFail();

        return new TargetingTemplateResource($targetingTemplate);
    }

    public function update(UpdateRequest $request, TargetingTemplate $targetingTemplate): TargetingTemplateResource
    {
        $this->authorize('update', $targetingTemplate);

        $targetingTemplate->update($request->validated());

        return new TargetingTemplateResource($targetingTemplate->fresh());
    }

    public function destroy(TargetingTemplate $targetingTemplate): JsonResponse
    {
        $this->authorize('delete', $targetingTemplate);

        $targetingTemplate->delete();

        return new JsonResponse(['message' => 'Targeting template deleted.']);
    }

    public function useTemplate(TargetingTemplate $targetingTemplate): TargetingTemplateResource
    {
        $this->authorize('view', $targetingTemplate);

        $targetingTemplate->increment('usage_count', 1, ['last_used_at' => now()]);

        return new TargetingTemplateResource($targetingTemplate->fresh());
    }
}
