<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ShortUrlSuffixRequest */
class ShortUrlSuffixResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quantity' => $this->quantity,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'short_url_id' => $this->short_url_id,
        ];
    }
}
