#!/bin/bash
set -e

# Composer install if vendor missing or outdated (dev only)
if [ "$APP_ENV" = "local" ] && { [ ! -d "vendor" ] || [ "composer.json" -nt "vendor/autoload.php" ] || [ "composer.lock" -nt "vendor/autoload.php" ]; }; then
    composer install --no-interaction
fi

# Ensure .env exists (required by artisan commands even when env is set via Docker)
if [ ! -f ".env" ]; then
    touch .env
fi

# Auto-setup in dev
if [ "$APP_ENV" = "local" ]; then
    # Generate APP_KEY if not set in .env
    if ! grep -q '^APP_KEY=base64:' .env 2>/dev/null; then
        php artisan key:generate --no-interaction 2>/dev/null || true
    fi

    # Generate Passport keys if missing
    if [ ! -f "storage/oauth-private.key" ]; then
        php artisan passport:keys --no-interaction 2>/dev/null || true
    fi

    php artisan migrate --force --no-interaction 2>/dev/null || true

    # Create Passport personal access client if none exists
    php -r "
        require 'vendor/autoload.php';
        \$app = require 'bootstrap/app.php';
        \$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
        exit(\Laravel\Passport\Client::where('personal_access_client', true)->exists() ? 0 : 1);
    " 2>/dev/null || php artisan passport:client --personal --name="Wellpack" --no-interaction 2>/dev/null || true
fi

# Start php-fpm as daemon, nginx in foreground
php-fpm -D
exec nginx -g "daemon off;"
