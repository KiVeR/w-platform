<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreditPartnerRequest;
use App\Models\Partner;
use App\Services\BalanceService;
use Illuminate\Http\Resources\Json\JsonResource;

class PartnerCreditsController extends Controller
{
    public function store(CreditPartnerRequest $request, Partner $partner, BalanceService $balanceService): JsonResource
    {
        $this->authorize('update', $partner);

        $transaction = $balanceService->credit(
            $partner,
            (float) $request->validated('amount'),
            $request->validated('description'),
        );

        return new JsonResource($transaction);
    }
}
