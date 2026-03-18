<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InternalVariableSchemaResource;
use App\Models\VariableSchema;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class InternalVariableSchemaController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min(max((int) $request->input('page.size', 15), 1), 100);
        $page = max((int) $request->input('page.number', 1), 1);

        $schemas = QueryBuilder::for(
            VariableSchema::query()->with('variableFields')->withCount('campaigns'),
        )
            ->allowedFilters([
                AllowedFilter::exact('partner_id'),
                AllowedFilter::partial('name'),
            ])
            ->allowedSorts(['name', 'created_at', 'campaigns_count'])
            ->paginate($perPage, ['*'], 'page[number]', $page)
            ->appends($request->query());

        return InternalVariableSchemaResource::collection($schemas);
    }

    public function show(VariableSchema $variableSchema): InternalVariableSchemaResource
    {
        return new InternalVariableSchemaResource(
            $variableSchema->load('variableFields')->loadCount('campaigns'),
        );
    }

    public function markUsed(Request $request, VariableSchema $variableSchema): InternalVariableSchemaResource
    {
        /** @var array{variables?: list<string>} $payload */
        $payload = $request->validate([
            'variables' => ['sometimes', 'array', 'min:1'],
            'variables.*' => ['string', 'max:255'],
        ]);

        $variableSchema->syncUsage($payload['variables'] ?? null, true);

        return new InternalVariableSchemaResource(
            $variableSchema->refresh()->load('variableFields')->loadCount('campaigns'),
        );
    }

    public function markUnused(Request $request, VariableSchema $variableSchema): InternalVariableSchemaResource
    {
        /** @var array{variables?: list<string>} $payload */
        $payload = $request->validate([
            'variables' => ['sometimes', 'array', 'min:1'],
            'variables.*' => ['string', 'max:255'],
        ]);

        $variableSchema->syncUsage($payload['variables'] ?? null, false);

        return new InternalVariableSchemaResource(
            $variableSchema->refresh()->load('variableFields')->loadCount('campaigns'),
        );
    }
}
