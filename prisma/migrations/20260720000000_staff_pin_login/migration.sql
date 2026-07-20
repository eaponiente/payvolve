-- Staff PIN login: a user can authenticate with email+password OR loginCode+PIN.
-- Additive & non-destructive: relaxes two NOT NULL constraints and adds two
-- nullable columns plus a unique index (multiple NULLs are allowed in Postgres).

-- Email and password become optional (PIN-only staff have neither).
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- PIN-login credentials.
ALTER TABLE "User" ADD COLUMN "loginCode" TEXT;
ALTER TABLE "User" ADD COLUMN "pinHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_loginCode_key" ON "User"("loginCode");
