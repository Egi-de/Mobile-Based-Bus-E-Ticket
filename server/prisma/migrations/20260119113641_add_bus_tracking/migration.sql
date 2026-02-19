-- CreateEnum
CREATE TYPE "BusStatus" AS ENUM ('IDLE', 'ON_ROUTE', 'DELAYED', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "buses" (
    "id" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "routeId" TEXT,
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "status" "BusStatus" NOT NULL DEFAULT 'IDLE',
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "occupiedSeats" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "buses_plateNumber_key" ON "buses"("plateNumber");

-- AddForeignKey
ALTER TABLE "buses" ADD CONSTRAINT "buses_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
