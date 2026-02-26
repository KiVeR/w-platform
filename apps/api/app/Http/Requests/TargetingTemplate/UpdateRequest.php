<?php

declare(strict_types=1);

namespace App\Http\Requests\TargetingTemplate;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:100'],
            'targeting_json' => ['sometimes', 'array'],
            'targeting_json.method' => ['required_with:targeting_json', 'string', 'in:department,postcode,address'],
            'targeting_json.departments' => ['exclude_unless:targeting_json.method,department', 'required', 'array', 'min:1'],
            'targeting_json.departments.*' => ['string'],
            'targeting_json.postcodes' => ['exclude_unless:targeting_json.method,postcode', 'required', 'array', 'min:1'],
            'targeting_json.postcodes.*' => ['string', 'regex:/^\d{5}$/'],
            'targeting_json.address' => ['nullable', 'string'],
            'targeting_json.lat' => ['exclude_unless:targeting_json.method,address', 'required', 'numeric', 'between:-90,90'],
            'targeting_json.lng' => ['exclude_unless:targeting_json.method,address', 'required', 'numeric', 'between:-180,180'],
            'targeting_json.radius' => ['exclude_unless:targeting_json.method,address', 'required', 'integer', 'min:100', 'max:50000'],
            'targeting_json.gender' => ['nullable', 'string', 'in:M,F'],
            'targeting_json.age_min' => ['nullable', 'integer', 'min:18', 'max:100'],
            'targeting_json.age_max' => ['nullable', 'integer', 'min:18', 'max:100', 'gte:targeting_json.age_min'],
            'category' => ['nullable', 'string', 'max:50'],
        ];
    }
}
