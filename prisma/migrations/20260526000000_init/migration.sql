-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KhachThue" (
    "id" SERIAL NOT NULL,
    "tenXuong" TEXT NOT NULL,
    "khuVuc" TEXT NOT NULL,
    "dienTich" DOUBLE PRECISION NOT NULL,
    "giaThue" DOUBLE PRECISION NOT NULL,
    "donViThue" TEXT NOT NULL,
    "ngayBatDau" TIMESTAMP(3) NOT NULL,
    "ngayKetThuc" TIMESTAMP(3) NOT NULL,
    "thoiGianThue" TEXT,
    "ngayTangGia" TIMESTAMP(3),
    "giaSauTang" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KhachThue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
