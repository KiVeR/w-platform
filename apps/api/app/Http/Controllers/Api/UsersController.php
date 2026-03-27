<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class UsersController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', User::class);

        /** @var User $currentUser */
        $currentUser = auth()->user();

        $users = QueryBuilder::for(User::forUser($currentUser))
            ->allowedFilters([
                AllowedFilter::exact('partner_id'),
                'email',
                AllowedFilter::exact('is_active'),
                AllowedFilter::callback('role', fn ($query, $value) => $query->whereHas('roles', fn ($q) => $q->where('name', $value))),
                AllowedFilter::callback('search', fn ($query, $value) => $query->where(fn ($q) => $q->where('firstname', 'ilike', "%{$value}%")->orWhere('lastname', 'ilike', "%{$value}%")->orWhere('email', 'ilike', "%{$value}%"))),
            ])
            ->allowedSorts(['firstname', 'email', 'created_at'])
            ->allowedIncludes(['partner'])
            ->paginate(min($request->integer('per_page', 15), 100));

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
