<?php

declare(strict_types=1);

namespace App\Http\Requests\Campaign;

use App\Enums\CampaignChannel;
use App\Enums\CampaignType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCampaignRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', Rule::enum(CampaignType::class)],
            'channel' => ['sometimes', Rule::enum(CampaignChannel::class)],
            'message' => ['nullable', 'string', 'max:612'],
            'sender' => ['nullable', 'string', 'regex:/^[a-zA-Z0-9]{3,11}$/'],
            'targeting' => ['nullable', 'array'],
            'targeting.age_min' => ['nullable', 'integer', 'min:0'],
            'targeting.age_max' => ['nullable', 'integer', 'min:0'],
            'targeting.geo' => ['nullable', 'array'],
            'scheduled_at' => ['nullable', 'date', 'after:now'],
            'is_demo' => ['sometimes', 'boolean'],
            'additional_phone' => ['nullable', 'string', 'max:20'],
        ];
    }
}
