-- AlterTable
ALTER TABLE "AuthEvent" ADD COLUMN     "actorId" TEXT;

-- CreateIndex
CREATE INDEX "AuthEvent_actorId_createdAt_idx" ON "AuthEvent"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "AuthEvent" ADD CONSTRAINT "AuthEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
