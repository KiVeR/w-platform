<?php

declare(strict_types=1);

namespace App\Http\Requests\Campaign;

use App\Enums\CampaignChannel;
use App\Enums\CampaignRoutingStatus;
use App\Enums\CampaignStatus;
use App\Enums\CampaignType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexCampaignRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $filter = $this->input('filter', []);
        $status = $filter['status'] ?? null;

        if (is_string($status) && $status !== '') {
            $filter['status'] = [$status];
        }

        $this->merge([
            'filter' => $filter,
        ]);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'page' => ['sometimes', 'integer', 'min:1'],
            'sort' => [
                'sometimes',
                'string',
                Rule::in([
                    'name',
                    '-name',
                    'scheduled_at',
                    '-scheduled_at',
                    'sent_at',
                    '-sent_at',
                    'created_at',
                    '-created_at',
                    'routing_at',
                    '-routing_at',
                ]),
            ],
            'include' => ['sometimes', 'string'],
            'filter' => ['sometimes', 'array'],
            'filter.partner_id' => ['sometimes', 'integer', 'exists:partners,id'],
            'filter.type' => ['sometimes', Rule::enum(CampaignType::class)],
            'filter.channel' => ['sometimes', Rule::enum(CampaignChannel::class)],
            'filter.status' => ['sometimes', 'array'],
            'filter.status.*' => [Rule::enum(CampaignStatus::class)],
            'filter.name' => ['sometimes', 'string', 'max:255'],
            'filter.created_at_from' => ['sometimes', 'date'],
            'filter.created_at_to' => ['sometimes', 'date', 'after_or_equal:filter.created_at_from'],
            'filter.routing_status' => ['sometimes', Rule::enum(CampaignRoutingStatus::class)],
            'filter.router_id' => ['sometimes', 'integer', 'exists:routers,id'],
        ];
    }
}
