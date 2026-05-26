import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.khachThue.deleteMany()

  await prisma.khachThue.createMany({
    data: [
      {
        tenXuong: 'XƯỞNG TÂN PHƯỚC KHÁNH',
        khuVuc: 'phường Tân Khánh, thành phố Hồ Chí Minh',
        dienTich: 6900,
        giaThue: 12000,
        donViThue: 'Công ty Quốc Bảo',
        ngayBatDau: new Date('2026-04-01'),
        ngayKetThuc: new Date('2026-12-31'),
      },
      {
        tenXuong: 'XƯỞNG TÂN VĨNH HIỆP',
        khuVuc: 'phường Tân Khánh, thành phố Hồ Chí Minh',
        dienTich: 3000,
        giaThue: 9600,
        donViThue: 'Công ty Hàng Việt Thông Minh',
        ngayBatDau: new Date('2025-05-01'),
        ngayKetThuc: new Date('2027-04-30'),
      },
      {
        tenXuong: 'XƯỞNG KHÁNH BÌNH',
        khuVuc: 'phường Tân Hiệp, thành phố Hồ Chí Minh',
        dienTich: 5074,
        giaThue: 15877,
        donViThue: 'Công ty Đức Thành',
        ngayBatDau: new Date('2025-11-18'),
        ngayKetThuc: new Date('2030-11-17'),
      },
      {
        tenXuong: 'XƯỞNG KHÁNH BÌNH',
        khuVuc: 'phường Tân Hiệp, thành phố Hồ Chí Minh',
        dienTich: 4640,
        giaThue: 14848,
        donViThue: 'Công ty Thâm Vinh',
        ngayBatDau: new Date('2025-05-07'),
        ngayKetThuc: new Date('2030-11-17'),
        ngayTangGia: new Date('2027-11-07'),
        giaSauTang: 16240,
      },
      {
        tenXuong: 'NHÀ VĂN PHÒNG XƯỞNG KHÁNH BÌNH',
        khuVuc: 'phường Tân Hiệp, thành phố Hồ Chí Minh',
        dienTich: 592,
        giaThue: 2367,
        donViThue: 'Công ty Thâm Vinh',
        ngayBatDau: new Date('2025-11-15'),
        ngayKetThuc: new Date('2030-11-14'),
        ngayTangGia: new Date('2028-05-15'),
        giaSauTang: 2604,
      },
      {
        tenXuong: 'XƯỞNG THUẬN AN 1',
        khuVuc: 'phường An Phú, thành phố Hồ Chí Minh',
        dienTich: 1600,
        giaThue: 4171,
        donViThue: 'Công ty Da LLM',
        ngayBatDau: new Date('2024-07-01'),
        ngayKetThuc: new Date('2029-06-30'),
        ngayTangGia: new Date('2026-07-01'),
        giaSauTang: 4590,
      },
      {
        tenXuong: 'XƯỞNG THUẬN AN 2',
        khuVuc: 'phường An Phú, thành phố Hồ Chí Minh',
        dienTich: 828,
        giaThue: 2600,
        donViThue: 'Công ty Gaofei',
        ngayBatDau: new Date('2026-04-20'),
        ngayKetThuc: new Date('2026-07-19'),
      },
      {
        tenXuong: 'XƯỞNG THUẬN AN 3',
        khuVuc: 'phường An Phú, thành phố Hồ Chí Minh',
        dienTich: 2073,
        giaThue: 4905,
        donViThue: 'Công ty Sơn Việt Mỹ',
        ngayBatDau: new Date('2024-05-10'),
        ngayKetThuc: new Date('2029-05-09'),
        ngayTangGia: new Date('2027-05-10'),
        giaSauTang: 5396,
      },
    ],
  })

  console.log('Seeded successfully')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
