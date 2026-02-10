<?php

declare(strict_types=1);

namespace App\Http\Requests\LandingPage;

use App\Enums\LandingPageStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLandingPageRequest extends FormRequest
{
    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        /** @var \App\Models\User $user */
        $user = $this->user();

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', Rule::enum(LandingPageStatus::class)],
            'is_active' => ['sometimes', 'boolean'],
            'og_title' => ['nullable', 'string', 'max:255'],
            'og_description' => ['nullable', 'string', 'max:1000'],
            'og_image_url' => ['nullable', 'url', 'max:2048'],
            'favicon_url' => ['nullable', 'url', 'max:2048'],
        ];

        if ($user->hasRole('admin')) {
            $rules['partner_id'] = ['required', 'integer', 'exists:partners,id'];
        }

        return $rules;
    }
}
