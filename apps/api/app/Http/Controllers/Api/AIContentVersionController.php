<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AIContent;
use App\Models\AIContentVersion;
use App\Services\AI\ContentVersionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIContentVersionController extends Controller
{
    public function __construct(private readonly ContentVersionService $versionService) {}

    public function index(AIContent $aiContent): JsonResponse
    {
        $this->authorize('view', $aiContent);

        $latestVersion = AIContentVersion::where('ai_content_id', $aiContent->id)
            ->orderByDesc('id')
            ->value('version');

        $versions = AIContentVersion::where('ai_content_id', $aiContent->id)
            ->orderByDesc('id')
            ->paginate(config('api.pagination.default'));

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

    public function show(AIContent $aiContent, AIContentVersion $version): JsonResponse
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

    public function restore(Request $request, AIContent $aiContent): JsonResponse
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
