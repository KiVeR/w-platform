<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AIContent\SaveDesignRequest;
use App\Http\Requests\AIContent\StoreAIContentRequest;
use App\Http\Requests\AIContent\UpdateAIContentRequest;
use App\Http\Resources\AIContentResource;
use App\Models\AIContent;
use App\Models\AIContentVersion;
use App\Models\User;
use App\Services\AI\ContentVersionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AIContentController extends Controller
{
    public function __construct(private readonly ContentVersionService $versionService) {}

    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', AIContent::class);

        /** @var User $user */
        $user = auth()->user();

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
            ->paginate(15);

        return AIContentResource::collection($contents);
    }

    public function recent(): JsonResponse
    {
        $this->authorize('viewAny', AIContent::class);

        /** @var User $user */
        $user = auth()->user();

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
        /** @var User $user */
        $user = auth()->user();

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

    public function design(AIContent $aiContent): JsonResponse
    {
        $this->authorize('view', $aiContent);

        return $this->designResponse($aiContent);
    }

    public function saveDesign(SaveDesignRequest $request, AIContent $aiContent): JsonResponse
    {
        $this->authorize('update', $aiContent);

        $aiContent->update(['design' => $request->validated('design')]);

        /** @var AIContent $freshContent */
        $freshContent = $aiContent->fresh();

        $version = $this->versionService->createVersion($freshContent);

        /** @var AIContent $freshContent2 */
        $freshContent2 = $aiContent->fresh();

        return $this->designResponse($freshContent2, $version->version);
    }

    // -------------------------------------------------------------------------
    // Version endpoints
    // -------------------------------------------------------------------------

    public function versions(AIContent $aiContent): JsonResponse
    {
        $this->authorize('view', $aiContent);

        $latestVersion = AIContentVersion::where('ai_content_id', $aiContent->id)
            ->orderByDesc('id')
            ->value('version');

        $versions = AIContentVersion::where('ai_content_id', $aiContent->id)
            ->orderByDesc('id')
            ->paginate(20);

        $items = $versions->getCollection()->map(fn (AIContentVersion $v) => [
            'id' => $v->id,
            'version' => $v->version,
            'widget_count' => $v->widget_count,
            'created_at' => $v->created_at->toISOString(),
            'is_current' => $v->version === $latestVersion,
        ]);

        return new JsonResponse([
            'data' => $items,
            'meta' => [
                'current_page' => $versions->currentPage(),
                'last_page' => $versions->lastPage(),
                'per_page' => $versions->perPage(),
                'total' => $versions->total(),
            ],
        ]);
    }

    public function showVersion(AIContent $aiContent, AIContentVersion $version): JsonResponse
    {
        $this->authorize('view', $aiContent);

        if ($version->ai_content_id !== $aiContent->id) {
            abort(404);
        }

        $latestVersion = AIContentVersion::where('ai_content_id', $aiContent->id)
            ->orderByDesc('id')
            ->value('version');

        return new JsonResponse([
            'data' => [
                'id' => $version->id,
                'version' => $version->version,
                'design' => $version->design,
                'widget_count' => $version->widget_count,
                'created_at' => $version->created_at->toISOString(),
                'is_current' => $version->version === $latestVersion,
            ],
        ]);
    }

    public function restoreVersion(Request $request, AIContent $aiContent): JsonResponse
    {
        $this->authorize('update', $aiContent);

        $validated = $request->validate([
            'version_id' => ['required', 'integer'],
        ]);

        $version = AIContentVersion::where('id', $validated['version_id'])
            ->where('ai_content_id', $aiContent->id)
            ->firstOrFail();

        $this->versionService->restoreVersion($aiContent, $version);

        /** @var AIContent $restoredContent */
        $restoredContent = $aiContent->fresh();

        return $this->designResponse($restoredContent);
    }

    // -------------------------------------------------------------------------

    private function designResponse(AIContent $aiContent, ?string $version = null): JsonResponse
    {
        $data = [
            'id' => $aiContent->id,
            'design' => $aiContent->design,
        ];

        if ($version !== null) {
            $data['version'] = $version;
        }

        return new JsonResponse(['data' => $data]);
    }
}
