-- CreateTable
CREATE TABLE "deleted_files" (
    "id" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deleted_files_pkey" PRIMARY KEY ("id")
);
