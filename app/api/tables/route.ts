import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const tables = await prisma.workTable.findMany({
    orderBy: { position: 'asc' },
    include: { columns: { orderBy: { position: 'asc' } } },
  })
  return Response.json(tables)
}

export async function POST(req: NextRequest) {
  const { name } = await req.json()
  if (!name?.trim()) return Response.json({ error: 'Tên bảng không được trống' }, { status: 400 })
  const count = await prisma.workTable.count()
  const table = await prisma.workTable.create({
    data: { name: name.trim(), position: count },
    include: { columns: { orderBy: { position: 'asc' } } },
  })
  return Response.json(table, { status: 201 })
}
