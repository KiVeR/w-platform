<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreditPartnerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage partners') === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'gt:0'],
            'description' => ['required', 'string', 'max:500'],
        ];
    }
}
