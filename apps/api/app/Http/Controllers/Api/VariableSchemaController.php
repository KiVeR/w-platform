<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\VariableSchema\StoreVariableSchemaRequest;
use App\Http\Requests\VariableSchema\UpdateVariableSchemaRequest;
use App\Http\Resources\VariableSchemaResource;
use App\Models\User;
use App\Models\VariableField;
use App\Models\VariableSchema;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class VariableSchemaController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', VariableSchema::class);

        /** @var User $user */
        $user = auth()->user();

        $schemas = QueryBuilder::for(VariableSchema::forUser($user))
            ->allowedFilters([AllowedFilter::exact('partner_id')])
            ->allowedSorts(['name', 'created_at'])
            ->allowedIncludes(['partner', 'variableFields'])
            ->paginate(15);

        return VariableSchemaResource::collection($schemas);
    }

    public function store(StoreVariableSchemaRequest $request): VariableSchemaResource
    {
        /** @var User $user */
        $user = auth()->user();

        $this->authorize('create', VariableSchema::class);

        $data = $request->validated();
        $fields = $data['fields'] ?? [];
        unset($data['fields']);

        if (! $user->hasRole('admin')) {
            $data['partner_id'] = $user->partner_id;
        }

        $schema = VariableSchema::create($data);

        foreach ($fields as $field) {
            $schema->variableFields()->create([
                'name' => $field['name'],
                'is_global' => $field['is_global'] ?? false,
            ]);
        }

        return new VariableSchemaResource($schema->load('variableFields'));
    }

    public function show(VariableSchema $variableSchema): VariableSchemaResource
    {
        $this->authorize('view', $variableSchema);

        $variableSchema = QueryBuilder::for(VariableSchema::where('id', $variableSchema->id))
            ->allowedIncludes(['partner', 'variableFields'])
            ->firstOrFail();

        return new VariableSchemaResource($variableSchema);
    }

    public function update(UpdateVariableSchemaRequest $request, VariableSchema $variableSchema): VariableSchemaResource
    {
        $this->authorize('update', $variableSchema);

        $data = $request->validated();
        $fields = $data['fields'] ?? null;
        unset($data['fields']);

        $variableSchema->update($data);

        if ($fields !== null) {
            $variableSchema->variableFields()->delete();

            foreach ($fields as $field) {
                $variableSchema->variableFields()->create([
                    'name' => $field['name'],
                    'is_global' => $field['is_global'] ?? false,
                ]);
            }
        }

        return new VariableSchemaResource($variableSchema->fresh()->load('variableFields'));
    }

    public function destroy(VariableSchema $variableSchema): JsonResponse
    {
        $this->authorize('delete', $variableSchema);

        $variableSchema->delete();

        return new JsonResponse(['message' => 'Variable schema deleted.']);
    }

    public function clone(VariableSchema $variableSchema): VariableSchemaResource
    {
        $this->authorize('view', $variableSchema);

        /** @var User $user */
        $user = auth()->user();

        $this->authorize('create', VariableSchema::class);

        $clone = $variableSchema->replicate(['uuid']);
        $clone->name = $variableSchema->name.' (copy)';

        if (! $user->hasRole('admin')) {
            $clone->partner_id = (int) $user->partner_id;
        }

        $clone->save();

        foreach ($variableSchema->variableFields as $field) {
            /** @var VariableField $field */
            $clone->variableFields()->create([
                'name' => $field->name,
                'is_used' => $field->is_used,
                'is_global' => $field->is_global,
            ]);
        }

        return new VariableSchemaResource($clone->load('variableFields'));
    }

    public function markUsed(VariableSchema $variableSchema): VariableSchemaResource
    {
        $this->authorize('update', $variableSchema);

        $variableSchema->variableFields()->update(['is_used' => true]);

        return new VariableSchemaResource($variableSchema->fresh()->load('variableFields'));
    }

    public function markUnused(VariableSchema $variableSchema): VariableSchemaResource
    {
        $this->authorize('update', $variableSchema);

        $variableSchema->variableFields()->update(['is_used' => false]);

        return new VariableSchemaResource($variableSchema->fresh()->load('variableFields'));
    }

    public function discover(): JsonResponse
    {
        return new JsonResponse(['message' => 'Not implemented.'], 501);
    }

    public function preview(): JsonResponse
    {
        return new JsonResponse(['message' => 'Not implemented.'], 501);
    }
}
