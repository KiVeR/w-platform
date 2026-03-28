<?php

declare(strict_types=1);

namespace App\Http\Requests\ShortUrl;

use Illuminate\Foundation\Http\FormRequest;

class StoreImportableLinkRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'extensions:csv,txt,xls,xlsx',
                'mimes:csv,txt,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'max:10240',
            ],
        ];
    }
}
