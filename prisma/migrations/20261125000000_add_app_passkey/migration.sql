-- CreateTable
CREATE TABLE "AppPasskey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "transports" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "AppPasskey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppPasskey_credentialId_key" ON "AppPasskey"("credentialId");

-- CreateIndex
CREATE INDEX "AppPasskey_userId_idx" ON "AppPasskey"("userId");

-- AddForeignKey
ALTER TABLE "AppPasskey" ADD CONSTRAINT "AppPasskey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
