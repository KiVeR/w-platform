<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\AI\GenerateDesignJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class AIGenerationController extends Controller
{
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prompt' => ['required', 'string', 'max:10000'],
            'image' => ['nullable', 'array'],
            'image.data' => ['required_with:image', 'string'],
            'image.mime_type' => ['required_with:image', 'string', 'in:image/png,image/jpeg,image/gif,image/webp'],
            'conversation_history' => ['nullable', 'array', 'max:20'],
            'conversation_history.*.role' => ['required', 'string', 'in:user,assistant'],
            'conversation_history.*.content' => ['required', 'string'],
        ]);

        // Validate image size (base64 ~ 33% larger than binary, max 4MB binary = ~5.33MB base64)
        if (isset($validated['image']['data'])) {
            $approximateSize = (int) ceil(strlen($validated['image']['data']) * 3 / 4);
            if ($approximateSize > 4 * 1024 * 1024) {
                return response()->json([
                    'message' => 'Image too large. Maximum size is 4MB.',
                ], 422);
            }
        }

        $jobId = Str::uuid()->toString();

        /** @var int $ttl */
        $ttl = config('ai.job.cache_ttl', 3600);

        Cache::put("ai-job:{$jobId}", [
            'status' => 'pending',
        ], $ttl);

        GenerateDesignJob::dispatch(
            jobId: $jobId,
            prompt: $validated['prompt'],
            userId: (int) $request->user()?->getAuthIdentifier(),
            image: $validated['image'] ?? null,
            conversationHistory: $validated['conversation_history'] ?? [],
        );

        return response()->json([
            'job_id' => $jobId,
            'status' => 'pending',
        ], 202);
    }

    public function status(string $jobId): JsonResponse
    {
        if (! Str::isUuid($jobId)) {
            return response()->json([
                'message' => 'Invalid job ID.',
            ], 400);
        }

        /** @var array{status: string, design?: array<string, mixed>, description?: string, usage?: array{input_tokens: int, output_tokens: int}, error?: string}|null $result */
        $result = Cache::get("ai-job:{$jobId}");

        if ($result === null) {
            return response()->json([
                'message' => 'Job not found or expired.',
            ], 404);
        }

        return response()->json($result);
    }
}
