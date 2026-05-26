-- CreateTable
CREATE TABLE "KhachThue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tenXuong" TEXT NOT NULL,
    "khuVuc" TEXT NOT NULL,
    "dienTich" REAL NOT NULL,
    "giaThue" REAL NOT NULL,
    "donViThue" TEXT NOT NULL,
    "ngayBatDau" DATETIME NOT NULL,
    "ngayKetThuc" DATETIME NOT NULL,
    "thoiGianThue" TEXT,
    "ngayTangGia" DATETIME,
    "giaSauTang" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
