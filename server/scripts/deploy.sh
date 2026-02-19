#!/bin/bash

# Render Deployment Script
# This script runs migrations and seeds the database if empty

echo "🚀 Starting deployment..."

# Run migrations
echo "📦 Running database migrations..."
npm run migrate:deploy

# Seed production database (only if empty)
echo "🌱 Seeding production database (if empty)..."
npm run db:seed:production || echo "⚠️  Seed failed or skipped, continuing..."

# Start the server
echo "✅ Starting server..."
npm start
