<?php

declare(strict_types=1);

namespace App\Http\Requests\Partner;

use App\Models\Partner;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePartnerRequest extends FormRequest
{
    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        /** @var Partner $partner */
        $partner = $this->route('partner');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'code' => ['sometimes', 'string', 'max:50', "unique:partners,code,{$partner->id}"],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'zip_code' => ['nullable', 'string', 'max:10'],
            'logo_url' => ['nullable', 'url', 'max:255'],
            'euro_credits' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
