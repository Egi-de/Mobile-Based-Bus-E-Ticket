-- AlterTable: Add totalSeats column to buses table
-- This migration is safe to run multiple times
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buses' AND column_name = 'totalseats'
    ) THEN
        ALTER TABLE "buses" ADD COLUMN "totalSeats" INTEGER NOT NULL DEFAULT 40;
    END IF;
END $$;

-- Clean up old columns if they exist
ALTER TABLE "buses" DROP COLUMN IF EXISTS "capacity";
ALTER TABLE "buses" DROP COLUMN IF EXISTS "occupiedSeats";
ALTER TABLE "buses" DROP COLUMN IF EXISTS "createdAt";
