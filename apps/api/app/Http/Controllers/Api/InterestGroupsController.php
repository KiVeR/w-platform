<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InterestGroupResource;
use App\Models\InterestGroup;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InterestGroupsController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $user = $this->currentUser();

        $query = InterestGroup::query()
            ->whereNull('parent_id')
            ->with(['children.children.interests', 'children.interests', 'interests']);

        if (! $user->hasRole('admin')) {
            $query->whereDoesntHave('hiddenForPartners', function ($q) use ($user): void {
                $q->where('partner_id', $user->partner_id);
            });
        }

        return InterestGroupResource::collection($query->get());
    }
}
