'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800">Quản Lý Thông Tin Khách Thuê</h1>
        <p className="text-sm text-gray-500 mt-0.5">Danh sách xưởng cho thuê</p>
      </div>

      <div className="px-6 py-5">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm tên xưởng, đơn vị thuê, khu vực..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm mới
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Tổng xưởng</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{records.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Tổng diện tích</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {records.reduce((s, r) => s + r.dienTich, 0).toLocaleString('vi-VN')} m²
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Tổng giá thuê/tháng</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              ${records.reduce((s, r) => s + r.giaThue, 0).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                  <Th label="Giá sau tăng (USD)" col="giaSauTang" align="right" />
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12 text-gray-400">Đang tải...</td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12 text-gray-400">
                      {search ? `Không tìm thấy kết quả cho "${search}"` : 'Không có dữ liệu'}
                    </td>
                  </tr>
                ) : (
                  sorted.map((r, idx) => (
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
                      <td className="px-4 py-3 text-right text-orange-700">
                        {r.giaSauTang != null ? `$${fmtNum(r.giaSauTang)}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(r)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => setDeleteId(r.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {editId ? 'Chỉnh sửa thông tin' : 'Thêm mới'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Tên xưởng" required placeholder="VD: XƯỞNG THUẬN AN 1" value={form.tenXuong} onChange={(v) => setField('tenXuong', v)} />
              </div>
              <div className="col-span-2">
                <Field label="Khu vực" required placeholder="VD: phường An Phú, TP.HCM" value={form.khuVuc} onChange={(v) => setField('khuVuc', v)} />
              </div>
              <Field label="Diện tích (m²)" type="number" required placeholder="VD: 1600" value={form.dienTich} onChange={(v) => setField('dienTich', v)} />
              <Field label="Giá thuê (USD/tháng)" type="number" required placeholder="VD: 4171" value={form.giaThue} onChange={(v) => setField('giaThue', v)} />
              <div className="col-span-2">
                <Field label="Đơn vị thuê" required placeholder="VD: Công ty ABC" value={form.donViThue} onChange={(v) => setField('donViThue', v)} />
              </div>
              <Field label="Ngày bắt đầu" type="date" required value={form.ngayBatDau} onChange={(v) => setField('ngayBatDau', v)} />
              <Field label="Ngày kết thúc" type="date" required value={form.ngayKetThuc} onChange={(v) => setField('ngayKetThuc', v)} />
              <Field label="Ngày tăng giá" type="date" value={form.ngayTangGia} onChange={(v) => setField('ngayTangGia', v)} />
              <Field label="Giá sau khi tăng (USD)" type="number" placeholder="VD: 4590" value={form.giaSauTang} onChange={(v) => setField('giaSauTang', v)} />
              <div className="col-span-2">
                <Field label="Thời gian thuê (ghi chú)" placeholder="VD: 5 năm" value={form.thoiGianThue} onChange={(v) => setField('thoiGianThue', v)} />
              </div>
            </div>
            {formError && (
              <div className="mx-6 mb-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {formError}
              </div>
            )}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : editId ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
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
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Hủy
              </button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
