<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class InvoicesController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = auth()->user();

        $invoices = QueryBuilder::for(Invoice::forUser($user))
            ->allowedFilters([
                AllowedFilter::exact('partner_id'),
                AllowedFilter::exact('status'),
            ])
            ->allowedSorts(['invoice_date', 'total_ttc', 'status', 'created_at'])
            ->allowedIncludes(['partner', 'lines'])
            ->paginate(15);

        return InvoiceResource::collection($invoices);
    }

    public function show(Invoice $invoice): InvoiceResource
    {
        /** @var User $user */
        $user = auth()->user();

        if (! $user->hasRole('admin') && $user->partner_id !== $invoice->partner_id) {
            abort(403);
        }

        $invoice = QueryBuilder::for(Invoice::where('id', $invoice->id))
            ->allowedIncludes(['partner', 'lines'])
            ->firstOrFail();

        return new InvoiceResource($invoice);
    }
}
