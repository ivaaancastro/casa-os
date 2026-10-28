-- CreateTable
CREATE TABLE "Vault" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kdfSalt" TEXT NOT NULL,
    "kdfOpsLimit" INTEGER NOT NULL,
    "kdfMemLimit" INTEGER NOT NULL,
    "kdfAlgorithm" TEXT NOT NULL DEFAULT 'argon2id13',
    "authHash" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "wrappedKeyring" TEXT NOT NULL,
    "keyringNonce" TEXT NOT NULL,
    "keyringVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultAccount" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'FAMILY',
    "ciphertext" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaultAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultAccountKey" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wrappedDek" TEXT NOT NULL,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaultAccountKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultRecovery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kdfSalt" TEXT NOT NULL,
    "kdfOpsLimit" INTEGER NOT NULL,
    "kdfMemLimit" INTEGER NOT NULL,
    "wrappedKeyring" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaultRecovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultPasskey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "transports" TEXT,
    "prfSalt" TEXT NOT NULL,
    "wrappedKeyring" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "VaultPasskey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultRecoveryShare" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "wrappedRecoveryKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "VaultRecoveryShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "ipHash" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VaultEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vault_userId_key" ON "Vault"("userId");

-- CreateIndex
CREATE INDEX "VaultAccount_ownerId_idx" ON "VaultAccount"("ownerId");

-- CreateIndex
CREATE INDEX "VaultAccount_updatedAt_idx" ON "VaultAccount"("updatedAt");

-- CreateIndex
CREATE INDEX "VaultAccountKey_userId_idx" ON "VaultAccountKey"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VaultAccountKey_accountId_userId_key" ON "VaultAccountKey"("accountId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "VaultRecovery_userId_key" ON "VaultRecovery"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VaultPasskey_credentialId_key" ON "VaultPasskey"("credentialId");

-- CreateIndex
CREATE INDEX "VaultPasskey_userId_idx" ON "VaultPasskey"("userId");

-- CreateIndex
CREATE INDEX "VaultRecoveryShare_contactId_idx" ON "VaultRecoveryShare"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "VaultRecoveryShare_ownerId_contactId_key" ON "VaultRecoveryShare"("ownerId", "contactId");

-- CreateIndex
CREATE INDEX "VaultEvent_userId_createdAt_idx" ON "VaultEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "VaultEvent_userId_action_createdAt_idx" ON "VaultEvent"("userId", "action", "createdAt");

-- AddForeignKey
ALTER TABLE "Vault" ADD CONSTRAINT "Vault_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultAccount" ADD CONSTRAINT "VaultAccount_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultAccountKey" ADD CONSTRAINT "VaultAccountKey_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "VaultAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultAccountKey" ADD CONSTRAINT "VaultAccountKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultRecovery" ADD CONSTRAINT "VaultRecovery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultPasskey" ADD CONSTRAINT "VaultPasskey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultRecoveryShare" ADD CONSTRAINT "VaultRecoveryShare_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultRecoveryShare" ADD CONSTRAINT "VaultRecoveryShare_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultEvent" ADD CONSTRAINT "VaultEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultEvent" ADD CONSTRAINT "VaultEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

