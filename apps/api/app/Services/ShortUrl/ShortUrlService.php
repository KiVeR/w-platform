<?php

declare(strict_types=1);

namespace App\Services\ShortUrl;

use App\Http\Resources\ShortUrlResource;
use App\Imports\DefaultImport;
use App\Models\ShortUrl;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class ShortUrlService
{
    /**
     * @throws Exception
     */
    public function create(array $data): ShortUrl
    {
        $shortUrl = new ShortUrl;
        $shortUrl->slug = $data['slug'] ?? $this->generateRandomSlug(
            $data['prefix'] ?? null,
            $data['length'] ?? config('app.default_slug_length', 6)
        );
        $shortUrl->link = $data['link'] ?? null;
        $shortUrl->import_id = $data['import_id'] ?? null;
        $shortUrl->is_enabled = true;
        $shortUrl->is_traceable_by_recipient = $data['is_traceable_by_recipient'] ?? false;
        $shortUrl->save();

        return $shortUrl->refresh();
    }

    /**
     * @throws Exception
     */
    public function getFakeShortUrl(Request $request): ShortUrlResource
    {
        $shortUrl = new ShortUrl;
        $shortUrl->slug = $this->generateRandomSlug(
            $request->get('prefix'),
            $request->get('length', config('app.default_slug_length', 6))
        );

        return new ShortUrlResource($shortUrl);
    }

    /**
     * @throws Exception
     */
    public function generateRandomSlug(?string $prefix = null, int $length = 6, int $tryNumbers = 1): string
    {
        if ($tryNumbers === 10) {
            throw new Exception(__('validation.no_available_short_url_slug', ['length' => $length]));
        }

        $slug = Str::random($length);

        if ($prefix) {
            $slug = $prefix.$slug;
        }

        $shortUrl = ShortUrl::where('slug', $slug)->first();

        if (isset($shortUrl)) {
            $tryNumbers++;

            return $this->generateRandomSlug($prefix, $length, $tryNumbers);
        }

        return $slug;
    }

    public function getUrlsFromFile(Media $media): array|false
    {
        $path = $media->getPath();

        if (in_array($media->mime_type, [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
        ])) {
            return Excel::toCollection(new DefaultImport, $path)
                ->flatten()
                ->toArray();
        }

        return preg_split('/\r\n|\r|\n/', (string) file_get_contents($path));
    }

    public function convertStringToArray(?string $input = null): array
    {
        if (! $input) {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode(',', $input))));
    }
}
