import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, type, required, options } = await req.json()
  if (!name?.trim()) return Response.json({ error: 'Tên cột không được trống' }, { status: 400 })
  const count = await prisma.workColumn.count({ where: { tableId: Number(id) } })
  const column = await prisma.workColumn.create({
    data: {
      tableId: Number(id),
      name: name.trim(),
      type: type ?? 'text',
      required: required ?? false,
      position: count,
      options: options?.length ? JSON.stringify(options) : null,
    },
  })
  return Response.json(column, { status: 201 })
}
