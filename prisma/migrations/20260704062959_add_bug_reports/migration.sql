-- CreateTable
CREATE TABLE "BugReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "reporterEmail" TEXT NOT NULL DEFAULT '',
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
);
