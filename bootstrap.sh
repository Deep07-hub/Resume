#!/bin/bash

# Display environment info (for debugging)
echo "===== Application Startup at $(date +'%Y-%m-%d %H:%M:%S') ====="
echo ""
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "PNPM version: $(pnpm -v)"

# Run database migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "Database URL is set, running migrations..."
  npx prisma migrate deploy
else
  echo "WARNING: DATABASE_URL is not set! The application may not function correctly."
fi

# Try to generate Prisma client but continue if it fails
echo "Attempting to generate Prisma client..."
npx prisma generate || echo "Could not generate Prisma client, continuing with pre-generated client"

# Start the application in standalone mode
echo "Starting the application in standalone mode..."
export HOSTNAME=0.0.0.0
export HOST=0.0.0.0
export PORT=3000

# Start using our custom server wrapper
exec node .next/standalone/custom-server.js 