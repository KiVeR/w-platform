<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\OperationType;
use App\Enums\Priority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOperationRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'demande_id' => ['required', 'integer', 'exists:demandes,id'],
            'type' => ['required', 'string', Rule::enum(OperationType::class)],
            'name' => ['required', 'string', 'max:255'],
            'advertiser' => ['nullable', 'string', 'max:255'],
            'priority' => ['nullable', 'string', Rule::enum(Priority::class)],
            'targeting' => ['nullable', 'array'],
            'message' => ['nullable', 'string'],
            'sender' => ['nullable', 'string', 'max:11'],
            'parent_operation_id' => ['nullable', 'integer', 'exists:operations,id'],
        ];
    }
}
