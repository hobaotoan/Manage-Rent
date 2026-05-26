import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const record = await prisma.khachThue.update({
    where: { id: Number(id) },
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
  return Response.json(record)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.khachThue.delete({ where: { id: Number(id) } })
  return Response.json({ success: true })
}
