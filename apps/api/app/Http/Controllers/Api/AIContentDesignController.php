<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AIContent\SaveDesignRequest;
use App\Models\AIContent;
use App\Services\AI\ContentVersionService;
use Illuminate\Http\JsonResponse;

class AIContentDesignController extends Controller
{
    public function __construct(private readonly ContentVersionService $versionService) {}

    public function show(AIContent $aiContent): JsonResponse
    {
        $this->authorize('view', $aiContent);

        return $this->designResponse($aiContent);
    }

    public function update(SaveDesignRequest $request, AIContent $aiContent): JsonResponse
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
