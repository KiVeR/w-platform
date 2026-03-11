<?php

declare(strict_types=1);

namespace App\Http\Requests\AIContent;

use App\Enums\ContentStatus;
use App\Enums\ContentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAIContentRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'type' => ['sometimes', Rule::enum(ContentType::class)],
            'title' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', Rule::enum(ContentStatus::class)],
            'is_favorite' => ['sometimes', 'boolean'],
            'variable_schema_id' => ['nullable', 'integer', 'exists:variable_schemas,id'],
        ];
    }
}
