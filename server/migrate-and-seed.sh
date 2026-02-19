#!/bin/bash

# Database Migration and Seed Script for Render
# This script will run Prisma migrations and seed the database

echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "🌱 Seeding production database..."
npx prisma db seed

echo "✅ Database setup complete!"
