#!/bin/bash

echo "===== Starting Application $(date) ====="
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Set environment variables for binding to all interfaces
export HOST=0.0.0.0
export HOSTNAME=0.0.0.0
export PORT=3000
export NODE_ENV=production

# Start the health check server first
echo "Starting health check server..."
node healthcheck.js &
HEALTH_PID=$!

# Make sure we have the test file for pdf-parse
mkdir -p node_modules/pdf-parse/test/data
mkdir -p test/data

if [ ! -f "node_modules/pdf-parse/test/data/05-versions-space.pdf" ]; then
  echo "Creating dummy PDF file..."
  echo "%PDF-1.4
1 0 obj
<</Type /Catalog /Pages 2 0 R>>
endobj
2 0 obj
<</Type /Pages /Kids [] /Count 0>>
endobj
xref
0 3
0000000000 65535 f
0000000010 00000 n
0000000056 00000 n
trailer
<</Size 3 /Root 1 0 R>>
startxref
110
%%EOF" > node_modules/pdf-parse/test/data/05-versions-space.pdf
  cp node_modules/pdf-parse/test/data/05-versions-space.pdf test/data/
fi

# Run database migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "Database URL is set, running migrations..."
  npx prisma migrate deploy
else
  echo "WARNING: DATABASE_URL is not set! The application may not function correctly."
fi

# Generate Prisma client (with error handling)
echo "Generating Prisma client..."
npx prisma generate || echo "Warning: Could not generate Prisma client, continuing anyway"

# Start the main application
if [ -d ".next/standalone" ]; then
  echo "Starting Next.js in standalone mode..."
  cd .next/standalone
  NODE_ENV=production exec node server.js
else
  echo "Starting Next.js application..."
  exec npm start
fi 