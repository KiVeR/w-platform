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
            'targeting.method' => ['required_with:targeting', 'string', 'in:department,postcode,address'],
            'targeting.departments' => ['required_if:targeting.method,department', 'array', 'min:1'],
            'targeting.departments.*' => ['string', 'exists:departments,code'],
            'targeting.postcodes' => ['required_if:targeting.method,postcode', 'array', 'min:1'],
            'targeting.postcodes.*' => ['string', 'regex:/^\d{5}$/'],
            'targeting.address' => ['nullable', 'string'],
            'targeting.lat' => ['required_if:targeting.method,address', 'numeric', 'between:-90,90'],
            'targeting.lng' => ['required_if:targeting.method,address', 'numeric', 'between:-180,180'],
            'targeting.radius' => ['required_if:targeting.method,address', 'integer', 'min:100', 'max:50000'],
            'targeting.gender' => ['nullable', 'string', 'in:M,F'],
            'targeting.age_min' => ['nullable', 'integer', 'min:18', 'max:100'],
            'targeting.age_max' => ['nullable', 'integer', 'min:18', 'max:100', 'gte:targeting.age_min'],
            'scheduled_at' => ['nullable', 'date', 'after:now'],
            'is_demo' => ['sometimes', 'boolean'],
            'additional_phone' => ['nullable', 'string', 'max:20'],
            'landing_page_id' => ['nullable', 'integer', Rule::exists('landing_pages', 'id')->whereNull('deleted_at')],
        ];

        if ($user->hasRole('admin')) {
            $rules['partner_id'] = ['required', 'integer', 'exists:partners,id'];
        }

        return $rules;
    }
}
