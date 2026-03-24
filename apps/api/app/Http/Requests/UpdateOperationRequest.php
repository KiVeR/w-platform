<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\OperationType;
use App\Enums\Priority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOperationRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'type' => ['nullable', 'string', Rule::enum(OperationType::class)],
            'name' => ['nullable', 'string', 'max:255'],
            'advertiser' => ['nullable', 'string', 'max:255'],
            'priority' => ['nullable', 'string', Rule::enum(Priority::class)],
            'targeting' => ['nullable', 'array'],
            'message' => ['nullable', 'string'],
            'sender' => ['nullable', 'string', 'max:11'],
            'parent_operation_id' => ['nullable', 'integer', 'exists:operations,id'],
            'volume_estimated' => ['nullable', 'integer', 'min:0'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'total_price' => ['nullable', 'numeric', 'min:0'],
            'scheduled_at' => ['nullable', 'date'],
            'delivered_at' => ['nullable', 'date'],
            'external_ref' => ['nullable', 'string', 'max:255'],
        ];
    }
}
