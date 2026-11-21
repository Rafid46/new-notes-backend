ALTER TABLE "Note" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Note_userId_isArchived_deletedAt_idx" ON "Note"("userId", "isArchived", "deletedAt");
