<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ShortUrl\StoreShortUrlRequest;
use App\Http\Requests\ShortUrl\UpdateShortUrlRequest;
use App\Http\Resources\ShortUrlResource;
use App\Models\ShortUrl;
use App\Services\ShortUrl\ShortUrlService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Response;

class ShortUrlController extends Controller
{
    public function __construct(private readonly ShortUrlService $shortUrlService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'search' => ['nullable', 'string'],
            'is_enabled' => ['boolean'],
        ]);

        $query = ShortUrl::query()->orderBy('id', 'desc');

        if ($request->search) {
            $terms = $this->shortUrlService->convertStringToArray($request->search);

            foreach ($terms as $term) {
                $query->orWhere('slug', 'LIKE', '%'.$term.'%')
                    ->orWhere('link', 'LIKE', '%'.$term.'%');
            }
        }

        if ($request->slug) {
            $query->where('slug', 'LIKE', '%'.$request->slug.'%');
        }

        if ($request->is_enabled !== null) {
            $query->where('is_enabled', $request->boolean('is_enabled'));
        }

        if ($request->has('ids')) {
            $query->whereIn('id', $request->get('ids', []));
        }

        if ($request->import_id) {
            $query->where('import_id', $request->get('import_id'));
        }

        if ($request->has('no-link')) {
            $query->whereNull('link');
        }

        $noPagination = (bool) $request->get('no_pagination', false);

        return ShortUrlResource::collection(
            $noPagination ? $query->get() : $query->paginate($request->get('perPage', 15))
        );
    }

    /**
     * @throws Exception
     */
    public function store(StoreShortUrlRequest $request): JsonResource
    {
        if ($request->boolean('fake')) {
            return $this->shortUrlService->getFakeShortUrl($request);
        }

        $shortUrl = $this->shortUrlService->create($request->validated());

        return new ShortUrlResource($shortUrl);
    }

    public function show(string $shortUrlIdOrSlug, Request $request): JsonResource|\Illuminate\Http\JsonResponse
    {
        $request->validate([
            'is_enabled' => ['boolean'],
        ]);

        $query = ShortUrl::findByIdOrSlug($shortUrlIdOrSlug);

        if ($request->has('type')) {
            /** @var ShortUrl $shortUrl */
            $shortUrl = $query->firstOrFail();

            return response()->json([
                'external' => (bool) $shortUrl->link,
            ]);
        }

        if ($request->is_enabled !== null) {
            $query->where('is_enabled', $request->boolean('is_enabled'));
        }

        return new ShortUrlResource($query->firstOrFail());
    }

    public function update(UpdateShortUrlRequest $request, ShortUrl $shortUrl): JsonResource
    {
        $validatedData = $request->validated();

        $fields = ['slug', 'link', 'import_id', 'is_draft', 'is_enabled', 'is_traceable_by_recipient'];

        foreach ($fields as $field) {
            if (array_key_exists($field, $validatedData)) {
                $shortUrl->$field = $validatedData[$field];
            }
        }

        $shortUrl->save();

        return new ShortUrlResource($shortUrl->fresh());
    }

    public function destroy(ShortUrl $shortUrl): Response
    {
        $shortUrl->delete();

        return response()->noContent();
    }
}
