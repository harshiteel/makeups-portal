#!/bin/bash
# This script will be run automatically by the mongo container on its first startup.
# It restores the database from the backup we mounted at /mongo-seed.

echo "🌱 Seeding database with initial data..."
mongorestore --db ID-makeups /mongo-seed/ID-makeups
echo "✅ Database seeded."

