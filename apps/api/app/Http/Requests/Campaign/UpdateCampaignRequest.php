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
            'targeting.method' => ['required_with:targeting', 'string', 'in:department,postcode,address,commune,iris'],
            'targeting.departments' => ['exclude_unless:targeting.method,department', 'required', 'array', 'min:1'],
            'targeting.departments.*' => ['string', 'exists:departments,code'],
            'targeting.postcodes' => ['exclude_unless:targeting.method,postcode', 'required', 'array', 'min:1'],
            'targeting.postcodes.*' => ['string', 'regex:/^\d{5}$/'],
            'targeting.communes' => ['exclude_unless:targeting.method,commune', 'required', 'array', 'min:1'],
            'targeting.communes.*' => ['string', 'regex:/^\d{5}$/'],
            'targeting.iris_codes' => ['exclude_unless:targeting.method,iris', 'required', 'array', 'min:1'],
            'targeting.iris_codes.*' => ['string', 'regex:/^\d{9}$/'],
            'targeting.address' => ['nullable', 'string'],
            'targeting.lat' => ['exclude_unless:targeting.method,address', 'required', 'numeric', 'between:-90,90'],
            'targeting.lng' => ['exclude_unless:targeting.method,address', 'required', 'numeric', 'between:-180,180'],
            'targeting.radius' => ['exclude_unless:targeting.method,address', 'required', 'integer', 'min:100', 'max:50000'],
            'targeting.gender' => ['nullable', 'string', 'in:M,F'],
            'targeting.age_min' => ['nullable', 'integer', 'min:18', 'max:100'],
            'targeting.age_max' => ['nullable', 'integer', 'min:18', 'max:100', 'gte:targeting.age_min'],
            'scheduled_at' => ['nullable', 'date', 'after:now'],
            'is_demo' => ['sometimes', 'boolean'],
            'additional_phone' => ['nullable', 'string', 'max:20'],
            'landing_page_id' => ['nullable', 'integer', Rule::exists('landing_pages', 'id')->whereNull('deleted_at')],
        ];
    }
}
