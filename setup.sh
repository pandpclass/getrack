#!/bin/bash
# Setup script for Codex
set -e

# Create a local .env file if it doesn't exist
if [ ! -f .env ] && [ -f .env.example ]; then
  echo "Creating default .env from .env.example..."
  cp .env.example .env
fi

# install dependencies if node_modules missing
if [ ! -d node_modules ]; then
  echo "Installing npm dependencies..."
  npm install
fi

# ensure prisma client is generated
if command -v npx >/dev/null 2>&1; then
  echo "Generating Prisma client..."
  npx prisma generate
  echo "Applying database schema..."
  npx prisma db push
fi

# keep Browserslist data up to date to avoid warnings
npx update-browserslist-db@latest >/dev/null 2>&1 || true

echo "Setup complete."
