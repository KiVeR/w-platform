<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AIContent\StoreAIContentRequest;
use App\Http\Requests\AIContent\UpdateAIContentRequest;
use App\Http\Resources\AIContentResource;
use App\Models\AIContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AIContentController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', AIContent::class);

        $user = $this->currentUser();

        $contents = QueryBuilder::for(AIContent::forUser($user))
            ->allowedFilters([
                AllowedFilter::exact('partner_id'),
                AllowedFilter::exact('type'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('is_favorite'),
                AllowedFilter::partial('title'),
            ])
            ->allowedSorts(['title', 'type', 'status', 'created_at', 'updated_at'])
            ->allowedIncludes(['partner', 'creator'])
            ->paginate(config('api.pagination.default'));

        return AIContentResource::collection($contents);
    }

    public function recent(): JsonResponse
    {
        $this->authorize('viewAny', AIContent::class);

        $user = $this->currentUser();

        $baseQuery = AIContent::forUser($user);

        $recent = (clone $baseQuery)
            ->where('is_favorite', false)
            ->orderByDesc('updated_at')
            ->limit(8)
            ->get();

        $favorites = (clone $baseQuery)
            ->where('is_favorite', true)
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get();

        return new JsonResponse([
            'data' => [
                'recent' => AIContentResource::collection($recent),
                'favorites' => AIContentResource::collection($favorites),
            ],
        ]);
    }

    public function store(StoreAIContentRequest $request): AIContentResource
    {
        $user = $this->currentUser();

        $this->authorize('create', AIContent::class);

        $data = $request->validated();

        if (! $user->hasRole('admin')) {
            $data['partner_id'] = $user->partner_id;
        }

        $data['user_id'] = $user->id;

        $content = AIContent::create($data);

        return new AIContentResource($content->load('creator'));
    }

    public function show(AIContent $aiContent): AIContentResource
    {
        $this->authorize('view', $aiContent);

        $aiContent = QueryBuilder::for(AIContent::where('id', $aiContent->id))
            ->allowedIncludes(['partner', 'creator'])
            ->firstOrFail();

        return new AIContentResource($aiContent);
    }

    public function update(UpdateAIContentRequest $request, AIContent $aiContent): AIContentResource
    {
        $this->authorize('update', $aiContent);

        $aiContent->update($request->validated());

        return new AIContentResource($aiContent->fresh());
    }

    public function destroy(AIContent $aiContent): JsonResponse
    {
        $this->authorize('delete', $aiContent);

        $aiContent->delete();

        return new JsonResponse(['message' => 'AI content deleted.']);
    }

    public function favorite(AIContent $aiContent): JsonResponse
    {
        $this->authorize('update', $aiContent);

        $aiContent->update(['is_favorite' => ! $aiContent->is_favorite]);

        /** @var AIContent $freshContent */
        $freshContent = $aiContent->fresh();

        return new JsonResponse([
            'data' => [
                'id' => $aiContent->id,
                'is_favorite' => $freshContent->is_favorite,
            ],
        ]);
    }

}
