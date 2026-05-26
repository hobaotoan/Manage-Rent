import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search') ?? ''
  const all = await prisma.khachThue.findMany({ orderBy: { id: 'asc' } })

  const records = search.trim()
    ? (() => {
        const q = search.trim().toLowerCase()
        return all.filter(
          (r) =>
            r.tenXuong.toLowerCase().includes(q) ||
            r.donViThue.toLowerCase().includes(q) ||
            r.khuVuc.toLowerCase().includes(q)
        )
      })()
    : all

  return Response.json(records, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const record = await prisma.khachThue.create({
    data: {
      tenXuong: body.tenXuong,
      khuVuc: body.khuVuc,
      dienTich: Number(body.dienTich),
      giaThue: Number(body.giaThue),
      donViThue: body.donViThue,
      ngayBatDau: new Date(body.ngayBatDau),
      ngayKetThuc: new Date(body.ngayKetThuc),
      thoiGianThue: body.thoiGianThue || null,
      ngayTangGia: body.ngayTangGia ? new Date(body.ngayTangGia) : null,
      giaSauTang: body.giaSauTang ? Number(body.giaSauTang) : null,
    },
  })
  return Response.json(record, { status: 201 })
}
