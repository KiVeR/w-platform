<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CampaignRecipientResource;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CampaignRecipientsController extends Controller
{
    public function index(Campaign $campaign, Request $request): AnonymousResourceCollection
    {
        $this->authorize('view', $campaign);

        $recipients = QueryBuilder::for(
            CampaignRecipient::query()->with('campaign.variableSchema')->whereBelongsTo($campaign)
        )
            ->allowedFilters([
                AllowedFilter::callback('status', function (Builder $query, mixed $value): void {
                    $statuses = collect(is_array($value) ? $value : explode(',', (string) $value))
                        ->filter(fn (mixed $status): bool => is_string($status) && $status !== '')
                        ->values()
                        ->all();

                    if ($statuses === []) {
                        return;
                    }

                    $query->whereIn('status', $statuses);
                }),
                AllowedFilter::partial('phone_number'),
            ])
            ->allowedSorts(['delivered_at', 'phone_number', 'short_url_click', 'status'])
            ->defaultSort('-id')
            ->paginate((int) $request->query('per_page', 15))
            ->appends($request->query());

        return CampaignRecipientResource::collection($recipients);
    }
}
