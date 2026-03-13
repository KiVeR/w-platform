<?php

declare(strict_types=1);

namespace App\Http\Requests\Router;

use App\Models\Router;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRouterRequest extends FormRequest
{
    /** @return array<string, array<int, string|\Illuminate\Validation\Rules\Unique>> */
    public function rules(): array
    {
        /** @var Router $router */
        $router = $this->route('router');

        return [
            'name' => ['sometimes', 'string', 'max:255', Rule::unique('routers', 'name')->ignore($router->id)],
            'external_id' => ['nullable', 'integer'],
            'num_stop' => ['nullable', 'string', 'max:10'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
