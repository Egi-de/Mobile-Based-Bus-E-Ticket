-- This migration marks the failed migration as rolled back
-- This allows Prisma to continue with new migrations

UPDATE "_prisma_migrations"
SET "rolled_back_at" = NOW()
WHERE "migration_name" = '20260217_sync_bus_schema'
  AND "rolled_back_at" IS NULL;
