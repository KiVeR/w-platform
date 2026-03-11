# =============================================================================
# Stage: base — PHP 8.4 FPM + extensions + Composer
# =============================================================================
FROM php:8.4-fpm-bookworm AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    git unzip curl \
    libpq-dev libpng-dev libjpeg-dev libfreetype6-dev \
    libzip-dev libicu-dev \
    nginx \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo_pgsql pgsql gd zip bcmath intl pcntl opcache exif \
    && pecl install redis && docker-php-ext-enable redis \
    && pecl install pcov && docker-php-ext-enable pcov \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# =============================================================================
# Stage: dev — default target for docker compose
# =============================================================================
FROM base AS dev

# Xdebug optionnel via build arg
ARG XDEBUG_ENABLED=0
RUN if [ "$XDEBUG_ENABLED" = "1" ]; then \
        pecl install xdebug && docker-php-ext-enable xdebug; \
    fi

COPY docker/api/php.ini /usr/local/etc/php/conf.d/99-custom.ini
COPY docker/api/nginx.conf /etc/nginx/sites-available/default
COPY docker/api/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

EXPOSE 80
CMD ["/usr/local/bin/start.sh"]

# =============================================================================
# Stage: prod — optimized, code baked in
# =============================================================================
FROM base AS prod

COPY docker/api/php-prod.ini /usr/local/etc/php/conf.d/99-custom.ini
COPY docker/api/opcache-prod.ini /usr/local/etc/php/conf.d/opcache.ini
COPY docker/api/nginx.conf /etc/nginx/sites-available/default
COPY docker/api/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

COPY apps/api /var/www/html

RUN composer install --no-dev --no-interaction --optimize-autoloader \
    && php artisan optimize \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 80
CMD ["/usr/local/bin/start.sh"]
