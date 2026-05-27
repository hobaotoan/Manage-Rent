-- CreateTable
CREATE TABLE "WorkTable" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkColumn" (
    "id" SERIAL NOT NULL,
    "tableId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "options" TEXT,
    CONSTRAINT "WorkColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkRow" (
    "id" SERIAL NOT NULL,
    "tableId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkCell" (
    "id" SERIAL NOT NULL,
    "rowId" INTEGER NOT NULL,
    "columnId" INTEGER NOT NULL,
    "value" TEXT,
    CONSTRAINT "WorkCell_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkCell_rowId_columnId_key" ON "WorkCell"("rowId", "columnId");

-- AddForeignKey
ALTER TABLE "WorkColumn" ADD CONSTRAINT "WorkColumn_tableId_fkey"
    FOREIGN KEY ("tableId") REFERENCES "WorkTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRow" ADD CONSTRAINT "WorkRow_tableId_fkey"
    FOREIGN KEY ("tableId") REFERENCES "WorkTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCell" ADD CONSTRAINT "WorkCell_rowId_fkey"
    FOREIGN KEY ("rowId") REFERENCES "WorkRow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCell" ADD CONSTRAINT "WorkCell_columnId_fkey"
    FOREIGN KEY ("columnId") REFERENCES "WorkColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
