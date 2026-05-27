import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await prisma.workRow.findMany({
    where: { tableId: Number(id) },
    include: { cells: true },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json(rows, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { cells } = await req.json()
  const count = await prisma.workRow.count({ where: { tableId: Number(id) } })
  const row = await prisma.workRow.create({
    data: {
      tableId: Number(id),
      position: count,
      cells: {
        create: (cells ?? [])
          .filter((c: { columnId: number; value: string | null }) => c.value !== null && c.value !== '')
          .map((c: { columnId: number; value: string }) => ({
            columnId: c.columnId,
            value: c.value,
          })),
      },
    },
    include: { cells: true },
  })
  return Response.json(row, { status: 201 })
}
