import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; colId: string }> }) {
  const { colId } = await params
  const { name, type, required, options } = await req.json()
  const column = await prisma.workColumn.update({
    where: { id: Number(colId) },
    data: {
      name: name?.trim(),
      type,
      required,
      options: options?.length ? JSON.stringify(options) : null,
    },
  })
  return Response.json(column)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; colId: string }> }) {
  const { colId } = await params
  await prisma.workColumn.delete({ where: { id: Number(colId) } })
  return Response.json({ ok: true })
}
