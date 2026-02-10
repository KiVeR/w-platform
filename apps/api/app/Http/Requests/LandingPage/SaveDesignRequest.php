<?php

declare(strict_types=1);

namespace App\Http\Requests\LandingPage;

use Illuminate\Foundation\Http\FormRequest;

class SaveDesignRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'design' => ['required', 'array'],
            'design.version' => ['sometimes', 'string', 'max:20'],
            'design.globalStyles' => ['sometimes', 'array'],
            'design.widgets' => ['sometimes', 'array', 'max:200'],
        ];
    }
}
