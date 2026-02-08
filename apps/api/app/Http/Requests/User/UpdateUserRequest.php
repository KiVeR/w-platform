<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        /** @var User $user */
        $user = $this->route('user');

        return [
            'firstname' => ['sometimes', 'string', 'max:255'],
            'lastname' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', "unique:users,email,{$user->id}"],
            'password' => ['sometimes', 'string', 'min:8'],
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'is_active' => ['nullable', 'boolean'],
            'role' => ['sometimes', 'string', 'in:admin,partner,merchant,employee'],
        ];
    }
}
