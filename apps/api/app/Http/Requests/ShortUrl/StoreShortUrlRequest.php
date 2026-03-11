<?php

declare(strict_types=1);

namespace App\Http\Requests\ShortUrl;

use App\Rules\NoUnderscoreSlug;
use App\Rules\UniqueShortUrlSlugEnabled;
use Illuminate\Foundation\Http\FormRequest;

class StoreShortUrlRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        if ($this->boolean('fake')) {
            return [
                'fake' => ['boolean'],
                'prefix' => ['nullable', 'string', new NoUnderscoreSlug],
                'length' => ['nullable', 'integer', 'min:1'],
            ];
        }

        return [
            'slug' => ['nullable', 'string', 'max:255', new NoUnderscoreSlug, new UniqueShortUrlSlugEnabled],
            'link' => ['required', 'url', 'string'],
            'import_id' => ['nullable', 'string'],
            'prefix' => ['nullable', 'string', new NoUnderscoreSlug],
            'length' => ['nullable', 'integer', 'min:1'],
            'is_traceable_by_recipient' => ['nullable', 'boolean'],
            'fake' => ['nullable', 'boolean'],
        ];
    }
}
