#!/bin/bash

# Run Prisma migrations to set up the database
echo "Setting up database..."
npx prisma migrate deploy

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "Database setup complete!" 