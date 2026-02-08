<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var array{access_token: string, expires_in: int, refresh_token: string, user: \App\Models\User} $data */
        $data = $this->resource;

        return [
            'access_token' => $data['access_token'],
            'token_type' => 'Bearer',
            'expires_in' => $data['expires_in'],
            'refresh_token' => $data['refresh_token'],
            'user' => new UserResource($data['user']),
        ];
    }
}
