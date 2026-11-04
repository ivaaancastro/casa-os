-- Drop column encryptedPasswords from User table
ALTER TABLE "User" DROP COLUMN IF EXISTS "encryptedPasswords";
