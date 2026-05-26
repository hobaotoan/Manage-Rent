'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'

type KhachThue = {
  id: number
  tenXuong: string
  khuVuc: string
  dienTich: number
  giaThue: number
  donViThue: string
  ngayBatDau: string
  ngayKetThuc: string
  thoiGianThue: string | null
  ngayTangGia: string | null
  giaSauTang: number | null
  createdAt: string
}

type SortKey = keyof Pick<
  KhachThue,
  'tenXuong' | 'khuVuc' | 'dienTich' | 'giaThue' | 'donViThue' | 'ngayBatDau' | 'ngayKetThuc' | 'ngayTangGia' | 'giaSauTang' | 'createdAt'
>
type SortDir = 'asc' | 'desc'

type FormData = {
  tenXuong: string
  khuVuc: string
  dienTich: string
  giaThue: string
  donViThue: string
  ngayBatDau: string
  ngayKetThuc: string
  thoiGianThue: string
  ngayTangGia: string
  giaSauTang: string
}

const emptyForm: FormData = {
  tenXuong: '',
  khuVuc: '',
  dienTich: '',
  giaThue: '',
  donViThue: '',
  ngayBatDau: '',
  ngayKetThuc: '',
  thoiGianThue: '',
  ngayTangGia: '',
  giaSauTang: '',
}

function toFormData(r: KhachThue): FormData {
  return {
    tenXuong: r.tenXuong,
    khuVuc: r.khuVuc,
    dienTich: String(r.dienTich),
    giaThue: String(r.giaThue),
    donViThue: r.donViThue,
    ngayBatDau: r.ngayBatDau ? r.ngayBatDau.slice(0, 10) : '',
    ngayKetThuc: r.ngayKetThuc ? r.ngayKetThuc.slice(0, 10) : '',
    thoiGianThue: r.thoiGianThue ?? '',
    ngayTangGia: r.ngayTangGia ? r.ngayTangGia.slice(0, 10) : '',
    giaSauTang: r.giaSauTang != null ? String(r.giaSauTang) : '',
  }
}

function toPayload(form: FormData) {
  return {
    tenXuong: form.tenXuong.trim(),
    khuVuc: form.khuVuc.trim(),
    dienTich: Number(form.dienTich),
    giaThue: Number(form.giaThue),
    donViThue: form.donViThue.trim(),
    ngayBatDau: form.ngayBatDau,
    ngayKetThuc: form.ngayKetThuc,
    thoiGianThue: form.thoiGianThue.trim() || null,
    ngayTangGia: form.ngayTangGia || null,
    giaSauTang: form.giaSauTang !== '' ? Number(form.giaSauTang) : null,
  }
}

function validate(form: FormData): string | null {
  if (!form.tenXuong.trim()) return 'Vui lòng nhập tên xưởng'
  if (!form.khuVuc.trim()) return 'Vui lòng nhập khu vực'
  if (!form.dienTich || isNaN(Number(form.dienTich)) || Number(form.dienTich) <= 0)
    return 'Diện tích không hợp lệ'
  if (!form.giaThue || isNaN(Number(form.giaThue)) || Number(form.giaThue) <= 0)
    return 'Giá thuê không hợp lệ'
  if (!form.donViThue.trim()) return 'Vui lòng nhập đơn vị thuê'
  if (!form.ngayBatDau) return 'Vui lòng chọn ngày bắt đầu'
  if (!form.ngayKetThuc) return 'Vui lòng chọn ngày kết thúc'
  if (form.ngayBatDau >= form.ngayKetThuc) return 'Ngày kết thúc phải sau ngày bắt đầu'
  if (form.giaSauTang !== '' && isNaN(Number(form.giaSauTang)))
    return 'Giá sau tăng không hợp lệ'
  return null
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN')
}

function fmtNum(n: number | null) {
  if (n == null) return '—'
  return n.toLocaleString('vi-VN')
}

function sortRecords(records: KhachThue[], key: SortKey, dir: SortDir): KhachThue[] {
  return [...records].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    let cmp = 0
    if (typeof av === 'number' && typeof bv === 'number') {
      cmp = av - bv
    } else {
      cmp = String(av).localeCompare(String(bv), 'vi')
    }
    return dir === 'asc' ? cmp : -cmp
  })
}

type FieldProps = {
  label: string
  type?: string
  required?: boolean
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

function Field({ label, type = 'text', required, value, onChange, placeholder }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
      />
    </div>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className="inline-flex flex-col ml-1 opacity-40" style={{ opacity: active ? 1 : 0.35 }}>
      <svg
        className={`w-2.5 h-2.5 -mb-0.5 ${active && dir === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
        viewBox="0 0 10 6" fill="currentColor"
      >
        <path d="M5 0L10 6H0z" />
      </svg>
      <svg
        className={`w-2.5 h-2.5 ${active && dir === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
        viewBox="0 0 10 6" fill="currentColor"
      >
        <path d="M5 6L0 0H10z" />
      </svg>
    </span>
  )
}

type Toast = { msg: string; type: 'success' | 'error' }

type PreviewRow = {
  tenXuong: string
  khuVuc: string
  dienTich: number
  giaThue: number
  donViThue: string
  ngayBatDau: string
  ngayKetThuc: string
  thoiGianThue: string | null
  ngayTangGia: string | null
  giaSauTang: number | null
}

export default function HomePage() {
  const [records, setRecords] = useState<KhachThue[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadDragging, setUploadDragging] = useState(false)
  const [uploadPreview, setUploadPreview] = useState<{ valid: PreviewRow[]; errors: string[] } | null>(null)
  const [uploadParsing, setUploadParsing] = useState(false)
  const [uploadImporting, setUploadImporting] = useState(false)

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/khach-thue?search=${encodeURIComponent(search)}`, {
        cache: 'no-store',
      })
      const data = await res.json()
      setRecords(data)
    } catch {
      showToast('Lỗi khi tải dữ liệu', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, showToast])

  useEffect(() => {
    const timer = setTimeout(fetchData, 300)
    return () => clearTimeout(timer)
  }, [fetchData])

  const sorted = useMemo(() => sortRecords(records, sortKey, sortDir), [records, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function Th({
    label,
    col,
    align = 'left',
  }: {
    label: string
    col: SortKey
    align?: 'left' | 'right' | 'center'
  }) {
    const active = sortKey === col
    return (
      <th
        className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:bg-gray-100 transition-colors text-${align}`}
        onClick={() => handleSort(col)}
      >
        <span className="inline-flex items-center gap-0.5">
          {label}
          <SortIcon active={active} dir={sortDir} />
        </span>
      </th>
    )
  }

  function setField(name: keyof FormData, val: string) {
    setForm((f) => ({ ...f, [name]: val }))
    setFormError(null)
  }

  function openAdd() {
    setEditId(null)
    setForm(emptyForm)
    setFormError(null)
    setShowModal(true)
  }

  function openEdit(r: KhachThue) {
    setEditId(r.id)
    setForm(toFormData(r))
    setFormError(null)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setFormError(null)
  }

  async function handleSave() {
    const err = validate(form)
    if (err) { setFormError(err); return }
    setSaving(true)
    try {
      const payload = toPayload(form)
      const res = editId
        ? await fetch(`/api/khach-thue/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/khach-thue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
      if (!res.ok) throw new Error()
      closeModal()
      await fetchData()
      showToast(editId ? 'Cập nhật thành công' : 'Thêm mới thành công', 'success')
    } catch {
      showToast('Lỗi khi lưu dữ liệu. Vui lòng thử lại.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/khach-thue/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setDeleteId(null)
      await fetchData()
      showToast('Xóa thành công', 'success')
    } catch {
      showToast('Lỗi khi xóa. Vui lòng thử lại.', 'error')
    }
  }

  function openUpload() {
    setUploadFile(null)
    setUploadPreview(null)
    setShowUpload(true)
  }

  function closeUpload() {
    setShowUpload(false)
    setUploadFile(null)
    setUploadPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function parseUploadFile(file: File) {
    setUploadFile(file)
    setUploadParsing(true)
    setUploadPreview(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('preview', 'true')
      const res = await fetch('/api/khach-thue/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Lỗi khi đọc file', 'error'); setUploadFile(null); return }
      setUploadPreview({ valid: data.valid, errors: data.errors })
    } catch {
      showToast('Không thể đọc file', 'error')
      setUploadFile(null)
    } finally {
      setUploadParsing(false)
    }
  }

  async function handleImport() {
    if (!uploadFile) return
    setUploadImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', uploadFile)
      const res = await fetch('/api/khach-thue/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Lỗi khi import', 'error'); return }
      closeUpload()
      await fetchData()
      showToast(`Import thành công ${data.imported} dòng${data.errors?.length ? `, bỏ qua ${data.errors.length} dòng lỗi` : ''}`, 'success')
    } catch {
      showToast('Lỗi khi import. Vui lòng thử lại.', 'error')
    } finally {
      setUploadImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast — full width on mobile */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[100] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {toast.type === 'success'
            ? <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            : <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          }
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <h1 className="text-lg sm:text-xl font-bold text-gray-800">Quản Lý Thông Tin Khách Thuê</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Danh sách xưởng cho thuê</p>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Buttons */}
          <div className="flex gap-2">
            <a href="/api/khach-thue/template"
              className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Tải template</span>
            </a>
            <button onClick={openUpload}
              className="flex items-center gap-1.5 border border-emerald-500 text-emerald-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="hidden sm:inline">Import Excel/CSV</span>
              <span className="sm:hidden">Import</span>
            </button>
            <button onClick={openAdd}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Thêm mới</span>
              <span className="sm:hidden">Thêm</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-5">
          <div className="bg-white rounded-xl border border-gray-200 px-3 sm:px-5 py-3 sm:py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium leading-tight">Tổng xưởng</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{records.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-3 sm:px-5 py-3 sm:py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium leading-tight">Diện tích</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">
              <span className="sm:hidden">{(records.reduce((s,r)=>s+r.dienTich,0)/1000).toFixed(1)}k</span>
              <span className="hidden sm:inline">{records.reduce((s,r)=>s+r.dienTich,0).toLocaleString('vi-VN')}</span>
              <span className="text-sm font-normal text-gray-500 ml-1">m²</span>
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-3 sm:px-5 py-3 sm:py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium leading-tight">Giá thuê/T</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">
              $<span className="sm:hidden">{(records.reduce((s,r)=>s+r.giaThue,0)/1000).toFixed(0)}k</span>
              <span className="hidden sm:inline">{records.reduce((s,r)=>s+r.giaThue,0).toLocaleString('vi-VN')}</span>
            </p>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-10">STT</th>
                  <Th label="Tên xưởng" col="tenXuong" />
                  <Th label="Khu vực" col="khuVuc" />
                  <Th label="Diện tích (m²)" col="dienTich" align="right" />
                  <Th label="Giá thuê (USD/T)" col="giaThue" align="right" />
                  <Th label="Đơn vị thuê" col="donViThue" />
                  <Th label="Ngày bắt đầu" col="ngayBatDau" align="center" />
                  <Th label="Ngày kết thúc" col="ngayKetThuc" align="center" />
                  <Th label="Ngày tăng giá" col="ngayTangGia" align="center" />
                  <Th label="Giá sau tăng" col="giaSauTang" align="right" />
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="text-center py-12 text-gray-400">Đang tải...</td></tr>
                ) : sorted.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-12 text-gray-400">
                    {search ? `Không tìm thấy kết quả cho "${search}"` : 'Không có dữ liệu'}
                  </td></tr>
                ) : sorted.map((r, idx) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-center">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.tenXuong}</td>
                    <td className="px-4 py-3 text-gray-600">{r.khuVuc}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmtNum(r.dienTich)}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-700">${fmtNum(r.giaThue)}</td>
                    <td className="px-4 py-3 text-gray-700">{r.donViThue}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{fmtDate(r.ngayBatDau)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{fmtDate(r.ngayKetThuc)}</td>
                    <td className="px-4 py-3 text-center text-orange-600">{fmtDate(r.ngayTangGia)}</td>
                    <td className="px-4 py-3 text-right text-orange-700">{r.giaSauTang != null ? `$${fmtNum(r.giaSauTang)}` : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(r)} className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">Sửa</button>
                        <button onClick={() => setDeleteId(r.id)} className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card List */}
        <div className="sm:hidden space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">Đang tải...</div>
          ) : sorted.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
              {search ? `Không tìm thấy kết quả cho "${search}"` : 'Không có dữ liệu'}
            </div>
          ) : sorted.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm leading-tight">{r.tenXuong}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{r.donViThue}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(r)} className="text-blue-600 text-xs font-medium px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">Sửa</button>
                  <button onClick={() => setDeleteId(r.id)} className="text-red-500 text-xs font-medium px-2.5 py-1 rounded-lg border border-red-200 hover:bg-red-50 transition-colors">Xóa</button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{r.khuVuc}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-400">Diện tích</p>
                  <p className="text-sm font-medium text-gray-700">{fmtNum(r.dienTich)} m²</p>
                </div>
                <div className="bg-emerald-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-emerald-600">Giá thuê/tháng</p>
                  <p className="text-sm font-semibold text-emerald-700">${fmtNum(r.giaThue)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-400">Bắt đầu</p>
                  <p className="text-sm font-medium text-gray-700">{fmtDate(r.ngayBatDau)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-400">Kết thúc</p>
                  <p className="text-sm font-medium text-gray-700">{fmtDate(r.ngayKetThuc)}</p>
                </div>
                {r.ngayTangGia && (
                  <div className="col-span-2 bg-orange-50 rounded-lg px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-orange-500">Tăng giá vào</p>
                      <p className="text-sm font-medium text-orange-700">{fmtDate(r.ngayTangGia)}</p>
                    </div>
                    {r.giaSauTang != null && (
                      <p className="text-sm font-semibold text-orange-700">${fmtNum(r.giaSauTang)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal — full screen on mobile */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                {editId ? 'Chỉnh sửa thông tin' : 'Thêm mới'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 sm:px-6 py-4 sm:py-5 grid grid-cols-2 gap-3 sm:gap-4 overflow-y-auto flex-1">
              <div className="col-span-2">
                <Field label="Tên xưởng" required placeholder="VD: XƯỞNG THUẬN AN 1" value={form.tenXuong} onChange={(v) => setField('tenXuong', v)} />
              </div>
              <div className="col-span-2">
                <Field label="Khu vực" required placeholder="VD: phường An Phú, TP.HCM" value={form.khuVuc} onChange={(v) => setField('khuVuc', v)} />
              </div>
              <Field label="Diện tích (m²)" type="number" required placeholder="1600" value={form.dienTich} onChange={(v) => setField('dienTich', v)} />
              <Field label="Giá thuê (USD/T)" type="number" required placeholder="4171" value={form.giaThue} onChange={(v) => setField('giaThue', v)} />
              <div className="col-span-2">
                <Field label="Đơn vị thuê" required placeholder="VD: Công ty ABC" value={form.donViThue} onChange={(v) => setField('donViThue', v)} />
              </div>
              <Field label="Ngày bắt đầu" type="date" required value={form.ngayBatDau} onChange={(v) => setField('ngayBatDau', v)} />
              <Field label="Ngày kết thúc" type="date" required value={form.ngayKetThuc} onChange={(v) => setField('ngayKetThuc', v)} />
              <Field label="Ngày tăng giá" type="date" value={form.ngayTangGia} onChange={(v) => setField('ngayTangGia', v)} />
              <Field label="Giá sau tăng (USD)" type="number" placeholder="4590" value={form.giaSauTang} onChange={(v) => setField('giaSauTang', v)} />
              <div className="col-span-2">
                <Field label="Ghi chú thời gian" placeholder="VD: 5 năm" value={form.thoiGianThue} onChange={(v) => setField('thoiGianThue', v)} />
              </div>
            </div>
            {formError && (
              <div className="mx-4 sm:mx-6 mb-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {formError}
              </div>
            )}
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0">
              <button onClick={closeModal} className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Hủy
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 sm:flex-none px-5 py-2.5 sm:py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : editId ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal — full screen on mobile */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:max-w-3xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">Import Excel / CSV</h2>
              <button onClick={closeUpload} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {!uploadPreview && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setUploadDragging(true) }}
                  onDragLeave={() => setUploadDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setUploadDragging(false); const f = e.dataTransfer.files[0]; if (f) parseUploadFile(f) }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-colors ${
                    uploadDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                >
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) parseUploadFile(f) }}
                  />
                  {uploadParsing ? (
                    <p className="text-gray-500 text-sm">Đang đọc file...</p>
                  ) : (
                    <>
                      <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-700">Kéo thả hoặc tap để chọn file</p>
                      <p className="text-xs text-gray-400 mt-1">Hỗ trợ .xlsx, .xls, .csv</p>
                    </>
                  )}
                </div>
              )}
              {uploadPreview && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[180px]">{uploadFile?.name}</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">{uploadPreview.valid.length} hợp lệ</span>
                      {uploadPreview.errors.length > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">{uploadPreview.errors.length} lỗi</span>
                      )}
                    </div>
                    <button onClick={() => { setUploadPreview(null); setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >Chọn file khác</button>
                  </div>
                  {uploadPreview.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                      {uploadPreview.errors.map((e, i) => <p key={i} className="text-xs text-red-700">{e}</p>)}
                    </div>
                  )}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-56">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            {['Tên xưởng','Khu vực','Diện tích','Giá thuê','Đơn vị thuê','Bắt đầu','Kết thúc'].map(h => (
                              <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {uploadPreview.valid.map((row, i) => (
                            <tr key={i} className="border-t border-gray-100">
                              <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{row.tenXuong}</td>
                              <td className="px-3 py-2 text-gray-600 max-w-[120px] truncate">{row.khuVuc}</td>
                              <td className="px-3 py-2 text-gray-700">{row.dienTich?.toLocaleString('vi-VN')}</td>
                              <td className="px-3 py-2 text-emerald-700">${row.giaThue?.toLocaleString('vi-VN')}</td>
                              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{row.donViThue}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.ngayBatDau ? new Date(row.ngayBatDau).toLocaleDateString('vi-VN') : '—'}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.ngayKetThuc ? new Date(row.ngayKetThuc).toLocaleDateString('vi-VN') : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0">
              <button onClick={closeUpload} className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
              {uploadPreview && uploadPreview.valid.length > 0 && (
                <button onClick={handleImport} disabled={uploadImporting}
                  className="flex-1 sm:flex-none px-5 py-2.5 sm:py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {uploadImporting ? 'Đang import...' : `Import ${uploadPreview.valid.length} dòng`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Xác nhận xóa</h3>
                <p className="text-sm text-gray-500 mt-0.5">Hành động này không thể hoàn tác.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 sm:py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2.5 sm:py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
