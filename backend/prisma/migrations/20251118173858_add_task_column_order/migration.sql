-- CreateTable
CREATE TABLE "TaskColumnOrder" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskColumnOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskColumnOrder_taskId_idx" ON "TaskColumnOrder"("taskId");

-- CreateIndex
CREATE INDEX "TaskColumnOrder_columnId_idx" ON "TaskColumnOrder"("columnId");

-- CreateIndex
CREATE INDEX "TaskColumnOrder_columnId_order_idx" ON "TaskColumnOrder"("columnId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "TaskColumnOrder_taskId_columnId_key" ON "TaskColumnOrder"("taskId", "columnId");

-- AddForeignKey
ALTER TABLE "TaskColumnOrder" ADD CONSTRAINT "TaskColumnOrder_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskColumnOrder" ADD CONSTRAINT "TaskColumnOrder_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "ProjectColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
