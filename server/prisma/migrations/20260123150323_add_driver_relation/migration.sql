-- AddForeignKey
ALTER TABLE "buses" ADD CONSTRAINT "buses_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
