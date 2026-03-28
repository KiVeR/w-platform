<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Exceptions\InvalidTransitionException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOperationRequest;
use App\Http\Requests\TransitionOperationRequest;
use App\Http\Requests\UpdateOperationRequest;
use App\Http\Resources\OperationResource;
use App\Http\Resources\OperationTransitionResource;
use App\Models\Operation;
use App\Services\StateMachine\TransitionMap;
use App\Services\StateMachine\TransitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class OperationsController extends Controller
{
    public function __construct(
        private readonly TransitionService $transitionService,
    ) {}

    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Operation::class);

        $user = $this->currentUser();

        $operations = QueryBuilder::for(Operation::forUser($user))
            ->allowedFilters([
                AllowedFilter::exact('demande_id'),
                AllowedFilter::exact('type'),
                AllowedFilter::exact('lifecycle_status'),
                AllowedFilter::exact('creative_status'),
                AllowedFilter::exact('billing_status'),
                AllowedFilter::exact('routing_status'),
                AllowedFilter::exact('assigned_to'),
                AllowedFilter::partial('name'),
            ])
            ->allowedSorts(['name', 'created_at', 'scheduled_at', 'lifecycle_status', 'type'])
            ->allowedIncludes(['demande', 'campaign', 'assignedUser', 'parentOperation'])
            ->paginate(15);

        return OperationResource::collection($operations);
    }

    public function store(StoreOperationRequest $request): OperationResource
    {
        $this->authorize('create', Operation::class);

        $operation = Operation::create($request->validated());

        return new OperationResource($operation->load('demande'));
    }

    public function show(Operation $operation): OperationResource
    {
        $this->authorize('view', $operation);

        $operation = QueryBuilder::for(Operation::where('id', $operation->id))
            ->allowedIncludes([
                'demande',
                'demande.partner',
                'campaign',
                'assignedUser',
                'parentOperation',
                'childOperations',
            ])
            ->firstOrFail();

        return new OperationResource($operation);
    }

    public function update(UpdateOperationRequest $request, Operation $operation): OperationResource
    {
        $this->authorize('update', $operation);

        $operation->update($request->validated());

        return new OperationResource($operation->fresh());
    }

    public function destroy(Operation $operation): JsonResponse
    {
        $this->authorize('delete', $operation);

        $operation->delete();

        return new JsonResponse(['message' => 'Operation deleted.']);
    }

    public function transition(TransitionOperationRequest $request, Operation $operation): OperationResource|JsonResponse
    {
        $this->authorize('transition', $operation);

        $user = $this->currentUser();

        $track = $request->validated('track');
        $toStateValue = $request->validated('to_state');
        $reason = $request->validated('reason');
        $metadata = $request->validated('metadata');

        try {
            $toState = TransitionMap::resolveEnum($track, $toStateValue);

            $operation = $this->transitionService->applyTransition(
                $operation,
                $track,
                $toState,
                $user->id,
                $reason,
                $metadata,
            );
        } catch (InvalidTransitionException $e) {
            return new JsonResponse([
                'message' => $e->getMessage(),
                'errors' => ['to_state' => [$e->getMessage()]],
            ], 422);
        }

        return new OperationResource($operation->fresh());
    }

    public function transitions(Operation $operation): AnonymousResourceCollection
    {
        $this->authorize('view', $operation);

        $transitions = $operation->transitions()
            ->with('user')
            ->orderByDesc('created_at')
            ->paginate(50);

        return OperationTransitionResource::collection($transitions);
    }
}
