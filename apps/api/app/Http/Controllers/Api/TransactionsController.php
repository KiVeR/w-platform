<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Models\Transaction;
use App\Services\BalanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class TransactionsController extends Controller
{
    public function index(Partner $partner): AnonymousResourceCollection
    {
        $user = $this->currentUser();

        if (! $user->hasRole('admin') && $user->partner_id !== $partner->id) {
            abort(403);
        }

        $transactions = QueryBuilder::for(Transaction::where('partner_id', $partner->id))
            ->allowedFilters([
                AllowedFilter::exact('type'),
            ])
            ->allowedSorts(['created_at', 'amount'])
            ->defaultSort('-created_at')
            ->paginate(25);

        return JsonResource::collection($transactions);
    }

    public function balance(Partner $partner, BalanceService $balanceService): JsonResponse
    {
        $user = $this->currentUser();

        if (! $user->hasRole('admin') && $user->partner_id !== $partner->id) {
            abort(403);
        }

        return response()->json([
            'data' => [
                'partner_id' => $partner->id,
                'euro_credits' => $balanceService->getBalance($partner),
            ],
        ]);
    }
}
