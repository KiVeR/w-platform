<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@wellpack.com'],
            [
                'firstname' => 'Admin',
                'lastname' => 'Wellpack',
                'password' => 'password',
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );

        $admin->assignRole('admin');
    }
}
