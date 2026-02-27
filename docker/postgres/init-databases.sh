#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE "platform-api-test";

    \c "platform-api"
    CREATE EXTENSION IF NOT EXISTS postgis;

    \c "platform-api-test"
    CREATE EXTENSION IF NOT EXISTS postgis;
EOSQL
