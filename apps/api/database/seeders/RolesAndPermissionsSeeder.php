<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'view partners',
            'manage partners',
            'view users',
            'manage users',
            'view campaigns',
            'manage campaigns',
            'view shops',
            'manage shops',
            'view landing-pages',
            'manage landing-pages',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'api');
        }

        Role::findOrCreate('admin', 'api')
            ->givePermissionTo(Permission::where('guard_name', 'api')->get());

        Role::findOrCreate('partner', 'api')
            ->givePermissionTo([
                'view partners',
                'view users',
                'view campaigns',
                'manage campaigns',
                'view shops',
                'manage shops',
                'view landing-pages',
                'manage landing-pages',
            ]);

        Role::findOrCreate('merchant', 'api')
            ->givePermissionTo([
                'view campaigns',
                'manage campaigns',
                'view shops',
                'view landing-pages',
                'manage landing-pages',
            ]);

        Role::findOrCreate('employee', 'api');
    }
}
