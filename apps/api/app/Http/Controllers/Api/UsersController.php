<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\QueryBuilder;

class UsersController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', User::class);

        /** @var User $currentUser */
        $currentUser = auth()->user();

        $query = User::query();

        if (! $currentUser->hasRole('admin')) {
            $query->where('partner_id', $currentUser->partner_id);
        }

        $users = QueryBuilder::for($query)
            ->allowedFilters(['partner_id', 'email', 'is_active'])
            ->allowedSorts(['firstname', 'email', 'created_at'])
            ->allowedIncludes(['partner'])
            ->paginate(15);

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request): UserResource
    {
        $this->authorize('create', User::class);

        /** @var User $user */
        $user = User::create($request->safe()->except(['role']));
        $user->assignRole($request->validated('role'));

        return new UserResource($user);
    }

    public function show(User $user): UserResource
    {
        $this->authorize('view', $user);

        $user = QueryBuilder::for(User::where('id', $user->id))
            ->allowedIncludes(['partner'])
            ->firstOrFail();

        return new UserResource($user);
    }

    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $this->authorize('update', $user);

        if ($request->has('role')) {
            $user->syncRoles([$request->validated('role')]);
        }

        $user->update($request->safe()->except(['role']));

        return new UserResource($user->fresh());
    }

    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $user->delete();

        return new JsonResponse(['message' => 'User deleted.']);
    }
}
