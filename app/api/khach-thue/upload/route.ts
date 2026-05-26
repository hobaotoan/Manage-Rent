import { NextRequest } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'

// Normalize header: bỏ dấu (kể cả đ→d), lowercase, chỉ giữ a-z0-9
function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .replace(/[đĐ]/g, 'd')          // đ không decompose trong NFD
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ combining diacritics
    .replace(/[^a-z0-9]/g, '')       // bỏ space, \r\n, ký tự đặc biệt
}

const HEADER_MAP: Record<string, string> = {
  // Tên xưởng
  tenxuong: 'tenXuong',
  // Khu vực
  khuvuc: 'khuVuc',
  diachi: 'khuVuc',
  // Diện tích
  dientich: 'dienTich',
  dientichm2: 'dienTich',
  // Giá thuê
  giathue: 'giaThue',
  // Đơn vị thuê
  donvithue: 'donViThue',
  donvi: 'donViThue',
  // Ngày bắt đầu
  ngaybatdau: 'ngayBatDau',
  batdau: 'ngayBatDau',
  // Ngày kết thúc
  ngayketthuc: 'ngayKetThuc',
  ketthuc: 'ngayKetThuc',
  // Thời gian thuê
  thoigianthue: 'thoiGianThue',
  thoigian: 'thoiGianThue',
  // Ngày tăng giá
  ngaytanggia: 'ngayTangGia',
  tanggia: 'ngayTangGia',
  // Giá sau tăng
  giasaukhitang: 'giaSauTang',
  giasautang: 'giaSauTang',
  giasau: 'giaSauTang',
}

function mapHeader(raw: string): string | null {
  const n = normalizeHeader(raw)
  // Exact match
  if (HEADER_MAP[n]) return HEADER_MAP[n]
  // Substring match (xử lý header dài như "GIÁ SAU KHI TĂNG \r\n( USD/ THÁNG)")
  for (const [key, val] of Object.entries(HEADER_MAP)) {
    if (n.includes(key)) return val
  }
  return null
}

function parseDate(v: unknown): Date | null {
  if (!v) return null
  // Excel serial number
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v)
    if (d) return new Date(Date.UTC(d.y, d.m - 1, d.d))
  }
  const s = String(v).trim()
  if (!s) return null
  // dd/mm/yyyy
  const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/)
  if (dmy) return new Date(Date.UTC(+dmy[3], +dmy[2] - 1, +dmy[1]))
  // yyyy-mm-dd
  const ymd = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/)
  if (ymd) return new Date(Date.UTC(+ymd[1], +ymd[2] - 1, +ymd[3]))
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

type RowResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string }

function parseRow(row: Record<string, unknown>, colMap: Record<string, string>, idx: number): RowResult {
  const rec: Record<string, unknown> = {}
  for (const [col, field] of Object.entries(colMap)) {
    rec[field] = row[col] ?? null
  }

  const tenXuong = String(rec.tenXuong ?? '').trim()
  const khuVuc = String(rec.khuVuc ?? '').trim()
  const donViThue = String(rec.donViThue ?? '').trim()
  const dienTich = Number(rec.dienTich)
  const giaThue = Number(rec.giaThue)
  const ngayBatDau = parseDate(rec.ngayBatDau)
  const ngayKetThuc = parseDate(rec.ngayKetThuc)

  if (!tenXuong) return { ok: false, error: `Dòng ${idx}: Thiếu tên xưởng` }
  if (!khuVuc) return { ok: false, error: `Dòng ${idx}: Thiếu khu vực` }
  if (!donViThue) return { ok: false, error: `Dòng ${idx}: Thiếu đơn vị thuê` }
  if (!dienTich || isNaN(dienTich)) return { ok: false, error: `Dòng ${idx}: Diện tích không hợp lệ` }
  if (!giaThue || isNaN(giaThue)) return { ok: false, error: `Dòng ${idx}: Giá thuê không hợp lệ` }
  if (!ngayBatDau) return { ok: false, error: `Dòng ${idx}: Ngày bắt đầu không hợp lệ` }
  if (!ngayKetThuc) return { ok: false, error: `Dòng ${idx}: Ngày kết thúc không hợp lệ` }

  const ngayTangGia = parseDate(rec.ngayTangGia)
  const giaSauTang = rec.giaSauTang ? Number(rec.giaSauTang) : null
  const thoiGianThue = rec.thoiGianThue ? String(rec.thoiGianThue).trim() : null

  return {
    ok: true,
    data: { tenXuong, khuVuc, dienTich, giaThue, donViThue, ngayBatDau, ngayKetThuc, thoiGianThue, ngayTangGia, giaSauTang },
  }
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'Không tìm thấy file' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls', 'csv'].includes(ext ?? ''))
    return Response.json({ error: 'Chỉ hỗ trợ file .xlsx, .xls, .csv' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true })

  if (!rows.length) return Response.json({ error: 'File không có dữ liệu' }, { status: 400 })

  // Map headers from first row
  const rawHeaders = Object.keys(rows[0])
  const colMap: Record<string, string> = {}
  for (const h of rawHeaders) {
    const mapped = mapHeader(h)
    if (mapped) colMap[h] = mapped
  }

  const required = ['tenXuong', 'khuVuc', 'dienTich', 'giaThue', 'donViThue', 'ngayBatDau', 'ngayKetThuc']
  const missing = required.filter((f) => !Object.values(colMap).includes(f))
  if (missing.length) {
    return Response.json({
      error: `File thiếu các cột: ${missing.join(', ')}. Hãy tải template mẫu.`,
    }, { status: 400 })
  }

  const errors: string[] = []
  const valid: Record<string, unknown>[] = []

  rows.forEach((row, i) => {
    // Bỏ qua dòng trống hoàn toàn
    const vals = Object.values(row).filter((v) => v != null && String(v).trim() !== '')
    if (!vals.length) return

    const result = parseRow(row, colMap, i + 2)
    if (result.ok) valid.push(result.data)
    else errors.push(result.error)
  })

  if (!valid.length) {
    return Response.json({ error: 'Không có dòng hợp lệ nào', errors }, { status: 400 })
  }

  // Preview mode: chỉ trả về dữ liệu, không insert
  const preview = formData.get('preview') === 'true'
  if (preview) {
    return Response.json({ valid, errors, total: valid.length })
  }

  // Insert tất cả valid rows
  await prisma.khachThue.createMany({ data: valid as never })

  return Response.json({ imported: valid.length, errors })
}
