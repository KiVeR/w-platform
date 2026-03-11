<?php

declare(strict_types=1);

namespace App\Http\Requests\ShortUrl;

use App\Models\ShortUrl;
use App\Rules\NoUnderscoreSlug;
use App\Rules\UniqueShortUrlSlugEnabled;
use Illuminate\Foundation\Http\FormRequest;

class UpdateShortUrlRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var ShortUrl|null $shortUrl */
        $shortUrl = $this->route('short_url');

        return [
            'slug' => ['sometimes', 'string', 'max:255', new NoUnderscoreSlug, new UniqueShortUrlSlugEnabled($shortUrl?->id)],
            'link' => ['nullable', 'url', 'string'],
            'import_id' => ['nullable', 'string'],
            'is_enabled' => ['sometimes', 'boolean'],
            'is_draft' => ['sometimes', 'boolean'],
            'is_traceable_by_recipient' => ['sometimes', 'boolean'],
        ];
    }
}
