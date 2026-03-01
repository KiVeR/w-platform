<?php

declare(strict_types=1);

namespace App\Http\Requests\VariableSchema;

use Illuminate\Foundation\Http\FormRequest;

class StoreVariableSchemaRequest extends FormRequest
{
    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        /** @var \App\Models\User $user */
        $user = $this->user();

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'global_data' => ['nullable', 'array'],
            'recipient_preview_data' => ['nullable', 'array'],
            'fields' => ['nullable', 'array'],
            'fields.*.name' => ['required_with:fields', 'string', 'max:255'],
            'fields.*.is_global' => ['nullable', 'boolean'],
        ];

        if ($user->hasRole('admin')) {
            $rules['partner_id'] = ['required', 'integer', 'exists:partners,id'];
        }

        return $rules;
    }
}
