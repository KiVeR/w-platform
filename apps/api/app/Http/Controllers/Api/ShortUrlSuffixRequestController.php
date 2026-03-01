<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ShortUrlSuffixResource;
use App\Models\ShortUrlSuffix;
use App\Models\ShortUrlSuffixRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class ShortUrlSuffixRequestController extends Controller
{
    public function store(Request $request): JsonResource
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer'],
            'short_url_id' => [
                'required',
                'integer',
                Rule::exists('short_urls', 'id')->where('is_enabled', true),
            ],
            'batch_uuid' => ['required', 'uuid'],
        ]);

        return new ShortUrlSuffixResource(ShortUrlSuffixRequest::create($data));
    }

    public function destroy(Request $request): Response
    {
        $data = $request->validate([
            'batch_uuid' => ['required', 'uuid'],
        ]);

        ShortUrlSuffix::query()
            ->where('batch_uuid', $data['batch_uuid'])
            ->delete();

        return response()->noContent();
    }
}
