<?php

declare(strict_types=1);

namespace App\Http\Requests\Geo;

use Illuminate\Foundation\Http\FormRequest;

class BatchIrisRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'codes' => ['required', 'array', 'min:1', 'max:100'],
            'codes.*' => ['required', 'string', 'size:9'],
        ];
    }
}
