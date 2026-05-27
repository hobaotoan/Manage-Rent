import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; rowId: string }> }) {
  const { rowId } = await params
  const { cells } = await req.json()

  await Promise.all(
    (cells ?? []).map((c: { columnId: number; value: string | null }) =>
      c.value !== null && c.value !== ''
        ? prisma.workCell.upsert({
            where: { rowId_columnId: { rowId: Number(rowId), columnId: c.columnId } },
            create: { rowId: Number(rowId), columnId: c.columnId, value: c.value },
            update: { value: c.value },
          })
        : prisma.workCell.deleteMany({
            where: { rowId: Number(rowId), columnId: c.columnId },
          })
    )
  )

  const row = await prisma.workRow.findUnique({
    where: { id: Number(rowId) },
    include: { cells: true },
  })
  return Response.json(row)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; rowId: string }> }) {
  const { rowId } = await params
  await prisma.workRow.delete({ where: { id: Number(rowId) } })
  return Response.json({ ok: true })
}
