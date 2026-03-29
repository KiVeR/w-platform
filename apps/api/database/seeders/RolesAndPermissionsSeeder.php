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
            'view routers',
            'manage routers',
            'view users',
            'manage users',
            'view campaigns',
            'manage campaigns',
            'view shops',
            'manage shops',
            'view landing-pages',
            'manage landing-pages',
            'view targeting-templates',
            'manage targeting-templates',
            'view variable-schemas',
            'manage variable-schemas',
            'view ai-contents',
            'manage ai-contents',
            'view short-urls',
            'manage short-urls',
            'view demandes',
            'manage demandes',
            'view operations',
            'manage operations',
            'transition operations',
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
                'view targeting-templates',
                'manage targeting-templates',
                'view variable-schemas',
                'manage variable-schemas',
                'view ai-contents',
                'manage ai-contents',
                'view short-urls',
                'manage short-urls',
                'view demandes',
                'view operations',
            ]);

        Role::findOrCreate('merchant', 'api')
            ->givePermissionTo([
                'view campaigns',
                'manage campaigns',
                'view shops',
                'view landing-pages',
                'manage landing-pages',
                'view targeting-templates',
                'manage targeting-templates',
                'view variable-schemas',
                'manage variable-schemas',
                'view ai-contents',
                'manage ai-contents',
                'view short-urls',
                'manage short-urls',
                'view demandes',
                'view operations',
            ]);

        Role::findOrCreate('employee', 'api');

        // ADV-specific roles
        Role::findOrCreate('adv', 'api')
            ->givePermissionTo([
                'view partners',
                'view users',
                'view demandes',
                'manage demandes',
                'view operations',
                'manage operations',
                'transition operations',
            ]);

        Role::findOrCreate('programmer', 'api')
            ->givePermissionTo([
                'view demandes',
                'view operations',
                'transition operations',
            ]);

        Role::findOrCreate('commercial', 'api')
            ->givePermissionTo([
                'view demandes',
                'manage demandes',
                'view operations',
            ]);

        Role::findOrCreate('graphiste', 'api')
            ->givePermissionTo([
                'view operations',
            ]);

        Role::findOrCreate('marketing_manager', 'api')
            ->givePermissionTo([
                'view operations',
            ]);

        Role::findOrCreate('direction', 'api')
            ->givePermissionTo([
                'view demandes',
                'view operations',
            ]);
    }
}
