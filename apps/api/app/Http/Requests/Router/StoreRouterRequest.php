<?php

declare(strict_types=1);

namespace App\Http\Requests\Router;

use Illuminate\Foundation\Http\FormRequest;

class StoreRouterRequest extends FormRequest
{
    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:routers,name'],
            'external_id' => ['nullable', 'integer'],
            'num_stop' => ['nullable', 'string', 'max:10'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
