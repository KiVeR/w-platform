<?php

declare(strict_types=1);

namespace App\Http\Requests\LandingPage;

use Illuminate\Foundation\Http\FormRequest;

class AttachVariableSchemaRequest extends FormRequest
{
    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'variable_schema_uuid' => ['required', 'uuid'],
        ];
    }
}
