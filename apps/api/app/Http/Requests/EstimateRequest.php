<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EstimateRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        /** @var \App\Models\User $user */
        $user = $this->user();

        $rules = [
            'targeting' => ['sometimes', 'array'],
            'targeting.method' => ['required_with:targeting', 'string', 'in:department,postcode,address'],
            'targeting.departments' => ['exclude_unless:targeting.method,department', 'array'],
            'targeting.departments.*' => ['string', 'exists:departments,code'],
            'targeting.postcodes' => ['exclude_unless:targeting.method,postcode', 'array'],
            'targeting.postcodes.*' => ['string', 'regex:/^\d{5}$/'],
            'targeting.address' => ['nullable', 'string'],
            'targeting.lat' => ['exclude_unless:targeting.method,address', 'nullable', 'numeric', 'between:-90,90'],
            'targeting.lng' => ['exclude_unless:targeting.method,address', 'nullable', 'numeric', 'between:-180,180'],
            'targeting.radius' => ['exclude_unless:targeting.method,address', 'nullable', 'integer', 'min:100', 'max:50000'],
            'targeting.gender' => ['nullable', 'string', 'in:M,F'],
            'targeting.age_min' => ['nullable', 'integer', 'min:18', 'max:100'],
            'targeting.age_max' => ['nullable', 'integer', 'min:18', 'max:100', 'gte:targeting.age_min'],
        ];

        if ($user->hasRole('admin')) {
            $rules['partner_id'] = ['nullable', 'integer', 'exists:partners,id'];
        } else {
            $rules['partner_id'] = ['prohibited'];
        }

        return $rules;
    }
}
