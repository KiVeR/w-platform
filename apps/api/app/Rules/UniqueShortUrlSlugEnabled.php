<?php

declare(strict_types=1);

namespace App\Rules;

use App\Models\ShortUrl;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Translation\PotentiallyTranslatedString;

class UniqueShortUrlSlugEnabled implements ValidationRule
{
    public function __construct(private readonly ?int $currentId = null) {}

    /**
     * Run the validation rule.
     *
     * @param  Closure(string): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $shortUrl = ShortUrl::query()
            ->where('slug', $value)
            ->where('is_enabled', true)
            ->when($this->currentId, function (Builder $query): void {
                $query->where('id', '!=', $this->currentId);
            })
            ->first();

        if ($shortUrl) {
            $fail('The short URL slug already exists.');
        }
    }
}
