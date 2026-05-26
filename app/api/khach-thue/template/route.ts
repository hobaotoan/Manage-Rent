import * as XLSX from 'xlsx'

export async function GET() {
  const headers = [
    'Ten Xuong', 'Khu Vuc', 'Dien Tich (m2)', 'Gia Thue (USD)',
    'Don Vi Thue', 'Ngay Bat Dau (YYYY-MM-DD)', 'Ngay Ket Thuc (YYYY-MM-DD)',
    'Thoi Gian Thue', 'Ngay Tang Gia (YYYY-MM-DD)', 'Gia Sau Tang (USD)',
  ]

  const sample = [
    ['XƯỞNG MẪU A', 'phường An Phú, TP.HCM', 1500, 4000, 'Công ty ABC', '2026-01-01', '2031-01-01', '5 năm', '2028-01-01', 4400],
    ['XƯỞNG MẪU B', 'phường Tân Khánh, TP.HCM', 800, 2500, 'Công ty XYZ', '2026-03-01', '2028-02-28', '', '', ''],
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sample])

  // Column widths
  ws['!cols'] = [
    { wch: 25 }, { wch: 35 }, { wch: 15 }, { wch: 15 },
    { wch: 25 }, { wch: 22 }, { wch: 22 },
    { wch: 15 }, { wch: 22 }, { wch: 18 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template-khach-thue.xlsx"',
    },
  })
}
