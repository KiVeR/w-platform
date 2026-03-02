<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ShortUrl\StoreImportableLinkRequest;
use App\Http\Resources\ImportableLinkResource;
use App\Http\Resources\ShortUrlResource;
use App\Models\ImportableLink;
use App\Rules\NoUnderscoreSlug;
use App\Services\ShortUrl\ShortUrlService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;

class ImportableLinkController extends Controller
{
    public function __construct(private readonly ShortUrlService $shortUrlService) {}

    /**
     * @throws Exception
     */
    public function upload(StoreImportableLinkRequest $request): JsonResource
    {
        $importableLink = new ImportableLink;
        $importableLink->save();

        $importableLink
            ->addMedia($request->file('file'))
            ->toMediaCollection('importable_links');

        $media = $importableLink->getFirstMedia('importable_links');
        /** @var \Spatie\MediaLibrary\MediaCollections\Models\Media $media */
        $importableLink->count = count((array) $this->shortUrlService->getUrlsFromFile($media));
        $importableLink->save();

        return new ImportableLinkResource($importableLink);
    }

    /**
     * @throws Exception|\Throwable
     */
    public function import(string $importableLinkUuid, Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'length' => ['nullable', 'integer', 'min:1'],
            'prefix' => ['nullable', 'string', 'max:15', new NoUnderscoreSlug],
        ]);

        $importableLink = ImportableLink::where('uuid', $importableLinkUuid)->firstOrFail();

        if ($importableLink->imported) {
            throw new Exception(__('validation.links_already_imported'));
        }

        /** @var \Spatie\MediaLibrary\MediaCollections\Models\Media $media */
        $media = $importableLink->getFirstMedia('importable_links');
        $urls = (array) $this->shortUrlService->getUrlsFromFile($media);

        DB::beginTransaction();

        try {
            $shortUrls = [];

            foreach ($urls as $url) {
                $shortUrls[] = $this->shortUrlService->create([
                    'link' => $url,
                    'import_id' => $importableLink->uuid,
                    'length' => $request->get('length', 6),
                    'prefix' => $request->get('prefix'),
                ]);
            }

            $importableLink->imported = true;
            $importableLink->save();

            DB::commit();
        } catch (Exception $exception) {
            DB::rollBack();
            throw $exception;
        }

        return ShortUrlResource::collection($shortUrls);
    }
}
