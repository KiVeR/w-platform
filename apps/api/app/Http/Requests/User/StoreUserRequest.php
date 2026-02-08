<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'firstname' => ['required', 'string', 'max:255'],
            'lastname' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'is_active' => ['nullable', 'boolean'],
            'role' => ['required', 'string', 'in:admin,partner,merchant,employee'],
        ];
    }
}
