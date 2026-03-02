<?php

declare(strict_types=1);

namespace App\Http\Requests\AIContent;

use App\Enums\ContentStatus;
use App\Enums\ContentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAIContentRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        /** @var \App\Models\User $user */
        $user = $this->user();

        $rules = [
            'type' => ['required', Rule::enum(ContentType::class)],
            'title' => ['required', 'string', 'max:255'],
            'status' => ['sometimes', Rule::enum(ContentStatus::class)],
            'is_favorite' => ['sometimes', 'boolean'],
            'variable_schema_id' => ['nullable', 'integer', 'exists:variable_schemas,id'],
        ];

        if ($user->hasRole('admin')) {
            $rules['partner_id'] = ['required', 'integer', 'exists:partners,id'];
        }

        return $rules;
    }
}
