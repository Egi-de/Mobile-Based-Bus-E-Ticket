/*
  Warnings:

  - You are about to drop the column `capacity` on the `buses` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `buses` table. All the data in the column will be lost.
  - You are about to drop the column `occupiedSeats` on the `buses` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `buses` table. All the data in the column will be lost.
  - You are about to drop the column `busType` on the `routes` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `routes` table. All the data in the column will be lost.
  - Added the required column `lastUpdated` to the `buses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "buses" DROP COLUMN "capacity",
DROP COLUMN "createdAt",
DROP COLUMN "occupiedSeats",
DROP COLUMN "updatedAt",
ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "routes" DROP COLUMN "busType",
DROP COLUMN "rating";
