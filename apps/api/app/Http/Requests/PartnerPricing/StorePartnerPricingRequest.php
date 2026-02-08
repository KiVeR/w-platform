<?php

declare(strict_types=1);

namespace App\Http\Requests\PartnerPricing;

use Illuminate\Foundation\Http\FormRequest;

class StorePartnerPricingRequest extends FormRequest
{
    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'partner_id' => ['required', 'integer', 'exists:partners,id'],
            'name' => ['required', 'string', 'max:255'],
            'volume_min' => ['nullable', 'integer', 'min:0'],
            'volume_max' => ['nullable', 'integer', 'min:0'],
            'router_price' => ['required', 'numeric', 'min:0'],
            'data_price' => ['required', 'numeric', 'min:0'],
            'ci_price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }
}
