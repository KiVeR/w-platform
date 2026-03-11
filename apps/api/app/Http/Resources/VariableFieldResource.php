<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\VariableField;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VariableField */
class VariableFieldResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'is_used' => $this->is_used,
            'is_global' => $this->is_global,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
