import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name } = await req.json()
  if (!name?.trim()) return Response.json({ error: 'Tên bảng không được trống' }, { status: 400 })
  const table = await prisma.workTable.update({
    where: { id: Number(id) },
    data: { name: name.trim() },
    include: { columns: { orderBy: { position: 'asc' } } },
  })
  return Response.json(table)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.workTable.delete({ where: { id: Number(id) } })
  return Response.json({ ok: true })
}
