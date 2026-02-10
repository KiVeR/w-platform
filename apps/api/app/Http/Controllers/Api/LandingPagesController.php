<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LandingPage\AttachVariableSchemaRequest;
use App\Http\Requests\LandingPage\SaveDesignRequest;
use App\Http\Requests\LandingPage\StoreLandingPageRequest;
use App\Http\Requests\LandingPage\UpdateLandingPageRequest;
use App\Http\Resources\LandingPageResource;
use App\Models\LandingPage;
use App\Models\User;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\QueryBuilder;
use Wellpack\Sdk\Trigger\Services\VariableSchemaApiService;

class LandingPagesController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', LandingPage::class);

        /** @var User $user */
        $user = auth()->user();

        $landingPages = QueryBuilder::for(LandingPage::forUser($user))
            ->allowedFilters(['partner_id', 'status', 'is_active'])
            ->allowedSorts(['name', 'status', 'created_at'])
            ->allowedIncludes(['partner', 'creator'])
            ->paginate(15);

        return LandingPageResource::collection($landingPages);
    }

    public function store(StoreLandingPageRequest $request): LandingPageResource
    {
        /** @var User $user */
        $user = auth()->user();

        $this->authorize('create', LandingPage::class);

        $data = $request->validated();

        if (! $user->hasRole('admin')) {
            $data['partner_id'] = $user->partner_id;
        }

        $data['user_id'] = $user->id;

        $landingPage = LandingPage::create($data);

        return new LandingPageResource($landingPage->load('creator'));
    }

    public function show(LandingPage $landingPage): LandingPageResource
    {
        $this->authorize('view', $landingPage);

        $landingPage = QueryBuilder::for(LandingPage::where('id', $landingPage->id))
            ->allowedIncludes(['partner', 'creator'])
            ->firstOrFail();

        return new LandingPageResource($landingPage);
    }

    public function update(UpdateLandingPageRequest $request, LandingPage $landingPage): LandingPageResource
    {
        $this->authorize('update', $landingPage);

        $landingPage->update($request->validated());

        return new LandingPageResource($landingPage->fresh());
    }

    public function destroy(LandingPage $landingPage): JsonResponse
    {
        $this->authorize('delete', $landingPage);

        $landingPage->delete();

        return new JsonResponse(['message' => 'Landing page deleted.']);
    }

    public function design(LandingPage $landingPage): JsonResponse
    {
        $this->authorize('view', $landingPage);

        return $this->designResponse($landingPage);
    }

    public function saveDesign(SaveDesignRequest $request, LandingPage $landingPage): JsonResponse
    {
        $this->authorize('update', $landingPage);

        $landingPage->update(['design' => $request->validated('design')]);

        return $this->designResponse($landingPage);
    }

    public function variableSchema(LandingPage $landingPage): JsonResponse
    {
        $this->authorize('view', $landingPage);

        $uuid = $landingPage->variable_schema_uuid;

        if (! $uuid) {
            return $this->variableSchemaResponse($landingPage, null);
        }

        try {
            $schema = app(VariableSchemaApiService::class)->getOne($uuid);
        } catch (RequestException) {
            return $this->variableSchemaResponse($landingPage, null);
        }

        return $this->variableSchemaResponse($landingPage, $schema->toArray());
    }

    public function attachVariableSchema(AttachVariableSchemaRequest $request, LandingPage $landingPage): JsonResponse
    {
        $this->authorize('update', $landingPage);

        $uuid = $request->validated('variable_schema_uuid');
        $service = app(VariableSchemaApiService::class);

        try {
            $schema = $service->getOne($uuid);
        } catch (RequestException) {
            return new JsonResponse(['message' => 'Variable schema not found.'], 422);
        }

        $service->attach($uuid);
        $landingPage->update(['variable_schema_uuid' => $uuid]);

        return new JsonResponse([
            'data' => [
                'id' => $landingPage->id,
                'variable_schema_uuid' => $uuid,
                'schema' => $schema->toArray(),
            ],
        ]);
    }

    public function detachVariableSchema(LandingPage $landingPage): JsonResponse
    {
        $this->authorize('update', $landingPage);

        $uuid = $landingPage->variable_schema_uuid;

        if ($uuid) {
            try {
                app(VariableSchemaApiService::class)->detach($uuid);
            } catch (RequestException) {
                // Silently ignore — schema may have been deleted on trigger-api
            }
        }

        $landingPage->update(['variable_schema_uuid' => null]);

        return new JsonResponse(['message' => 'Variable schema detached.']);
    }

    private function designResponse(LandingPage $landingPage): JsonResponse
    {
        return new JsonResponse([
            'data' => [
                'id' => $landingPage->id,
                'design' => $landingPage->design,
            ],
        ]);
    }

    /** @param array<string, mixed>|null $schema */
    private function variableSchemaResponse(LandingPage $landingPage, ?array $schema): JsonResponse
    {
        return new JsonResponse([
            'data' => [
                'id' => $landingPage->id,
                'variable_schema' => $schema,
            ],
        ]);
    }
}
