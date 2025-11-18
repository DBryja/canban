-- CreateTable
CREATE TABLE "ProjectColumn" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectColumn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectColumn_projectId_idx" ON "ProjectColumn"("projectId");

-- CreateIndex
CREATE INDEX "ProjectColumn_tagId_idx" ON "ProjectColumn"("tagId");

-- CreateIndex
CREATE INDEX "ProjectColumn_projectId_order_idx" ON "ProjectColumn"("projectId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectColumn_projectId_tagId_key" ON "ProjectColumn"("projectId", "tagId");

-- AddForeignKey
ALTER TABLE "ProjectColumn" ADD CONSTRAINT "ProjectColumn_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectColumn" ADD CONSTRAINT "ProjectColumn_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "TaskTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
