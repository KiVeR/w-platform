<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ShortUrl */
class ShortUrlResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'link' => $this->link,
            'click_count' => $this->click_count,
            'click_count_bots' => $this->click_count_bots,
            'is_draft' => $this->is_draft,
            'import_id' => $this->import_id,
            'is_traceable_by_recipient' => $this->is_traceable_by_recipient,
            'is_enabled' => $this->is_enabled,
        ];
    }
}
