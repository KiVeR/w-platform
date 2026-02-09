<?php

declare(strict_types=1);

namespace App\Http\Requests\Campaign;

use App\Enums\CampaignChannel;
use App\Enums\CampaignType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCampaignRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        /** @var \App\Models\User $user */
        $user = $this->user();

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(CampaignType::class)],
            'channel' => ['required', Rule::enum(CampaignChannel::class)],
            'message' => ['nullable', 'string', 'max:612'],
            'sender' => ['nullable', 'string', 'regex:/^[a-zA-Z0-9]{3,11}$/'],
            'targeting' => ['nullable', 'array'],
            'targeting.age_min' => ['nullable', 'integer', 'min:0'],
            'targeting.age_max' => ['nullable', 'integer', 'min:0'],
            'targeting.geo' => ['nullable', 'array'],
            'targeting.geo.type' => ['nullable', 'string'],
            'targeting.geo.postcodes' => ['nullable', 'array'],
            'targeting.geo.postcodes.*.code' => ['required_with:targeting.geo.postcodes', 'string'],
            'targeting.geo.postcodes.*.volume' => ['nullable', 'integer', 'min:0'],
            'scheduled_at' => ['nullable', 'date', 'after:now'],
            'is_demo' => ['sometimes', 'boolean'],
            'additional_phone' => ['nullable', 'string', 'max:20'],
        ];

        if ($user->hasRole('admin')) {
            $rules['partner_id'] = ['required', 'integer', 'exists:partners,id'];
        }

        return $rules;
    }
}
