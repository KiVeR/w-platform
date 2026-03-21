<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDemandeRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'partner_id'    => ['sometimes', 'required', 'integer', 'exists:partners,id'],
            'commercial_id' => ['nullable', 'integer', 'exists:users,id'],
            'sdr_id'        => ['nullable', 'integer', 'exists:users,id'],
            'ref_client'    => ['nullable', 'string', 'max:100'],
            'information'   => ['nullable', 'string'],
            'is_exoneration' => ['nullable', 'boolean'],
            'pays_id'       => ['nullable', 'string', 'size:2'],
        ];
    }
}
