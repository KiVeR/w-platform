#!/bin/bash
set -e

# Composer install if vendor missing or outdated (dev only)
if [ "$APP_ENV" = "local" ] && { [ ! -d "vendor" ] || [ "composer.json" -nt "vendor/autoload.php" ]; }; then
    composer install --no-interaction
fi

# Auto-migrate in dev
if [ "$APP_ENV" = "local" ]; then
    php artisan migrate --force --no-interaction 2>/dev/null || true
fi

# Start php-fpm as daemon, nginx in foreground
php-fpm -D
exec nginx -g "daemon off;"
