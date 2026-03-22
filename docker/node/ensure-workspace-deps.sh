#!/bin/sh
set -eu

LOCK_DIR="${PNPM_INSTALL_LOCK_DIR:-/app/node_modules/.pnpm-install-lock}"

has_required_paths() {
  if [ ! -f /app/node_modules/.modules.yaml ]; then
    return 1
  fi

  for path in "$@"; do
    if [ ! -e "$path" ]; then
      return 1
    fi
  done

  return 0
}

if has_required_paths "$@"; then
  exit 0
fi

while ! mkdir "$LOCK_DIR" 2>/dev/null; do
  if has_required_paths "$@"; then
    exit 0
  fi

  sleep 1
done

cleanup() {
  rmdir "$LOCK_DIR" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

if ! has_required_paths "$@"; then
  pnpm install --frozen-lockfile
fi
