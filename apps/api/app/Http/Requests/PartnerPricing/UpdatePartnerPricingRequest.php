<?php

declare(strict_types=1);

namespace App\Http\Requests\PartnerPricing;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePartnerPricingRequest extends FormRequest
{
    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'volume_min' => ['sometimes', 'integer', 'min:0'],
            'volume_max' => ['nullable', 'integer', 'min:0'],
            'router_price' => ['sometimes', 'numeric', 'min:0'],
            'data_price' => ['sometimes', 'numeric', 'min:0'],
            'ci_price' => ['sometimes', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }
}
