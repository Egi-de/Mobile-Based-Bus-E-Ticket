-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "arrivalTime" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "operator" TEXT NOT NULL,
    "busType" TEXT NOT NULL,
    "seatsAvailable" INTEGER NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION,
    "amenities" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);
