-- Prisma migration for PasswordEntry table
-- Applies only to the current migration chain

-- Create the PasswordEntry table
CREATE TABLE "PasswordEntry" (
  id          TEXT  NOT NULL PRIMARY KEY,
  userId      TEXT  NOT NULL,
  title       TEXT  NOT NULL,
  url         TEXT,
  username    TEXT,
  passwordHash TEXT NOT NULL,
  notes       TEXT,
  category    TEXT,
  createdAt   TIMESTAMP(6) NOT NULL DEFAULT now(),
  updatedAt   TIMESTAMP(6) NOT NULL DEFAULT now(),
  FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE CASCADE
);

-- Create index for userId
CREATE INDEX "PasswordEntry_userId_idx" ON "PasswordEntry"("userId");
