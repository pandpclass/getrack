#!/bin/bash
# Setup script for Codex
set -e

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

echo "Setup complete."
