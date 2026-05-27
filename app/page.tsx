'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ColType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'url' | 'checkbox'

type WorkColumn = {
  id: number
  tableId: number
  name: string
  type: ColType
  required: boolean
  position: number
  options: string | null
}

type WorkCell = {
  id: number
  rowId: number
  columnId: number
  value: string | null
}

type WorkRow = {
  id: number
  tableId: number
  position: number
  createdAt: string
  cells: WorkCell[]
}

type WorkTable = {
  id: number
  name: string
  position: number
  columns: WorkColumn[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COL_TYPES: { value: ColType; label: string; icon: string }[] = [
  { value: 'text',     label: 'Văn bản',   icon: 'T'  },
  { value: 'number',   label: 'Số',         icon: '#'  },
  { value: 'date',     label: 'Ngày',       icon: '⊡'  },
  { value: 'select',   label: 'Lựa chọn',  icon: '▾'  },
  { value: 'textarea', label: 'Đoạn văn',  icon: '¶'  },
  { value: 'url',      label: 'Liên kết',  icon: '↗'  },
  { value: 'checkbox', label: 'Checkbox',  icon: '☑'  },
]

const BADGE_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-yellow-100 text-yellow-700 border-yellow-200',
  'bg-red-100 text-red-700 border-red-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseOptions(raw: string | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

function fmtDate(val: string | null) {
  if (!val) return ''
  const d = new Date(val)
  return isNaN(d.getTime()) ? val : d.toLocaleDateString('vi-VN')
}

function fmtNum(val: string | null) {
  if (!val) return ''
  const n = Number(val)
  return isNaN(n) ? val : n.toLocaleString('vi-VN')
}

// ─── Sub-components (outside main to avoid remount on re-render) ──────────────

function CellValue({ value, col }: { value: string | null; col: WorkColumn }) {
  if (value === null || value === '')
    return <span className="text-gray-300 select-none">—</span>

  switch (col.type) {
    case 'number':
      return <span className="font-mono tabular-nums">{fmtNum(value)}</span>
    case 'date':
      return <span>{fmtDate(value)}</span>
    case 'checkbox':
      return value === 'true'
        ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs">✓</span>
        : <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-400 text-xs">✗</span>
    case 'url':
      return (
        <a href={value} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="text-blue-600 hover:underline truncate max-w-[180px] block text-sm"
        >{value}</a>
      )
    case 'select': {
      const opts = parseOptions(col.options)
      const idx = opts.indexOf(value)
      const color = BADGE_COLORS[idx >= 0 ? idx % BADGE_COLORS.length : 0]
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
          {value}
        </span>
      )
    }
    case 'textarea':
      return <span className="line-clamp-2 text-sm whitespace-pre-line">{value}</span>
    default:
      return <span className="text-sm">{value}</span>
  }
}

type FieldInputProps = { col: WorkColumn; value: string; onChange: (v: string) => void }

function FieldInput({ col, value, onChange }: FieldInputProps) {
  const base = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
  const opts = parseOptions(col.options)

  switch (col.type) {
    case 'number':
      return <input type="number" value={value} onChange={e => onChange(e.target.value)} className={base} />
    case 'date':
      return <input type="date" value={value} onChange={e => onChange(e.target.value)} className={base} />
    case 'checkbox':
      return (
        <label className="flex items-center gap-3 cursor-pointer mt-1">
          <input type="checkbox" checked={value === 'true'}
            onChange={e => onChange(e.target.checked ? 'true' : 'false')}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">{value === 'true' ? 'Có' : 'Không'}</span>
        </label>
      )
    case 'url':
      return <input type="url" value={value} onChange={e => onChange(e.target.value)} placeholder="https://..." className={base} />
    case 'textarea':
      return <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className={base + ' resize-none'} />
    case 'select':
      return (
        <select value={value} onChange={e => onChange(e.target.value)} className={base}>
          <option value="">— Chọn —</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )
    default:
      return <input type="text" value={value} onChange={e => onChange(e.target.value)} className={base} />
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Toast = { msg: string; type: 'success' | 'error' }

type TableModal  = { open: boolean; editId: number | null; name: string }
type ColModal    = {
  open: boolean; editCol: WorkColumn | null
  name: string; type: ColType; required: boolean
  options: string[]; newOption: string
}
type RowModal    = { open: boolean; editRow: WorkRow | null; values: Record<number, string> }
type DelConfirm  = { kind: 'table' | 'column' | 'row'; id: number; label: string }

// ─── Card View ────────────────────────────────────────────────────────────────

type CardViewProps = {
  rows: WorkRow[]
  cols: WorkColumn[]
  onEdit: (row: WorkRow) => void
  onDelete: (id: number) => void
}

function CardView({ rows, cols, onEdit, onDelete }: CardViewProps) {
  if (rows.length === 0) return null
  const primaryCol = cols[0]
  const restCols   = cols.slice(1)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {rows.map((row, idx) => {
        const primaryCell = row.cells.find(c => c.columnId === primaryCol?.id)
        return (
          <div key={row.id}
            className="bg-white rounded-xl border border-gray-200 flex flex-col hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onEdit(row)}
          >
            {/* Card header */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {primaryCol && (
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">
                      {primaryCol.name}
                    </p>
                  )}
                  <p className="font-semibold text-gray-800 text-sm leading-snug break-words">
                    {primaryCell?.value || <span className="text-gray-300 font-normal">—</span>}
                  </p>
                </div>
                <span className="flex-shrink-0 text-[10px] text-gray-300 bg-gray-50 rounded-full px-2 py-0.5 font-mono">
                  #{idx + 1}
                </span>
              </div>
            </div>

            {/* Card body */}
            <div className="px-4 py-3 flex-1 grid grid-cols-2 gap-x-4 gap-y-2.5">
              {restCols.map(col => {
                const cell = row.cells.find(c => c.columnId === col.id)
                return (
                  <div key={col.id} className={col.type === 'textarea' || col.type === 'url' ? 'col-span-2' : ''}>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{col.name}</p>
                    <div className="text-sm text-gray-700">
                      <CellValue value={cell?.value ?? null} col={col} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Card footer */}
            <div className="px-4 py-2.5 border-t border-gray-100 flex gap-2" onClick={e => e.stopPropagation()}>
              <button onClick={() => onEdit(row)}
                className="flex-1 text-xs font-medium text-blue-600 hover:text-blue-700 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                ✏️ Sửa
              </button>
              <div className="w-px bg-gray-100" />
              <button onClick={() => onDelete(row.id)}
                className="flex-1 text-xs font-medium text-red-500 hover:text-red-600 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                🗑 Xóa
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [tables,      setTables]      = useState<WorkTable[]>([])
  const [activeId,    setActiveId]    = useState<number | null>(null)
  const [rows,        setRows]        = useState<WorkRow[]>([])
  const [loading,     setLoading]     = useState(true)
  const [rowsLoading, setRowsLoading] = useState(false)
  const [search,      setSearch]      = useState('')
  const [toast,       setToast]       = useState<Toast | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [viewMode,    setViewMode]    = useState<'table' | 'card'>('card')

  const [tabMenu,     setTabMenu]     = useState<number | null>(null)
  const [colMenu,     setColMenu]     = useState<number | null>(null)
  const tabMenuRef = useRef<HTMLDivElement>(null)
  const colMenuRef = useRef<HTMLDivElement>(null)

  const [tableModal,  setTableModal]  = useState<TableModal>({ open: false, editId: null, name: '' })
  const [colModal,    setColModal]    = useState<ColModal>({
    open: false, editCol: null, name: '', type: 'text', required: false, options: [], newOption: ''
  })
  const [rowModal,    setRowModal]    = useState<RowModal>({ open: false, editRow: null, values: {} })
  const [delConfirm,  setDelConfirm]  = useState<DelConfirm | null>(null)

  const activeTable = tables.find(t => t.id === activeId) ?? null
  const cols        = activeTable?.columns ?? []

  // ── Toast ──────────────────────────────────────────────────────────────────

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchTables = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/tables', { cache: 'no-store' })
      const data: WorkTable[] = await res.json()
      setTables(data)
      if (data.length > 0)
        setActiveId(prev => prev ?? data[0].id)
    } catch { showToast('Lỗi khi tải dữ liệu', 'error') }
    finally  { setLoading(false) }
  }, [showToast])

  const fetchRows = useCallback(async (tableId: number) => {
    setRowsLoading(true)
    try {
      const res  = await fetch(`/api/tables/${tableId}/rows`, { cache: 'no-store' })
      const data: WorkRow[] = await res.json()
      setRows(data)
    } catch { showToast('Lỗi khi tải dữ liệu', 'error') }
    finally  { setRowsLoading(false) }
  }, [showToast])

  useEffect(() => { fetchTables() }, [fetchTables])
  useEffect(() => { if (activeId) fetchRows(activeId); else setRows([]) }, [activeId, fetchRows])

  // ── Close menus on outside click ───────────────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tabMenuRef.current && !tabMenuRef.current.contains(e.target as Node)) setTabMenu(null)
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setColMenu(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter(r => r.cells.some(c => c.value?.toLowerCase().includes(q)))
  }, [rows, search])

  // ── Table CRUD ─────────────────────────────────────────────────────────────

  async function handleSaveTable() {
    if (!tableModal.name.trim()) return
    setSaving(true)
    try {
      if (tableModal.editId) {
        await fetch(`/api/tables/${tableModal.editId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tableModal.name }),
        })
        setTables(prev => prev.map(t => t.id === tableModal.editId ? { ...t, name: tableModal.name.trim() } : t))
        showToast('Đổi tên thành công', 'success')
      } else {
        const res  = await fetch('/api/tables', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tableModal.name }),
        })
        const created: WorkTable = await res.json()
        setTables(prev => [...prev, created])
        setActiveId(created.id)
        setRows([])
        showToast('Tạo bảng thành công', 'success')
      }
      setTableModal({ open: false, editId: null, name: '' })
    } catch { showToast('Lỗi khi lưu', 'error') }
    finally { setSaving(false) }
  }

  async function handleDeleteTable(id: number) {
    try {
      await fetch(`/api/tables/${id}`, { method: 'DELETE' })
      const rest = tables.filter(t => t.id !== id)
      setTables(rest)
      if (activeId === id) { setActiveId(rest[0]?.id ?? null); setRows([]) }
      setDelConfirm(null)
      showToast('Đã xóa bảng', 'success')
    } catch { showToast('Lỗi khi xóa', 'error') }
  }

  // ── Column CRUD ────────────────────────────────────────────────────────────

  function openAddCol() {
    setColModal({ open: true, editCol: null, name: '', type: 'text', required: false, options: [], newOption: '' })
  }

  function openEditCol(col: WorkColumn) {
    setColModal({
      open: true, editCol: col, name: col.name, type: col.type,
      required: col.required, options: parseOptions(col.options), newOption: '',
    })
    setColMenu(null)
  }

  async function handleSaveCol() {
    if (!colModal.name.trim() || !activeId) return
    setSaving(true)
    try {
      if (colModal.editCol) {
        const res  = await fetch(`/api/tables/${activeId}/columns/${colModal.editCol.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: colModal.name, type: colModal.type, required: colModal.required, options: colModal.options }),
        })
        const updated: WorkColumn = await res.json()
        setTables(prev => prev.map(t => t.id === activeId
          ? { ...t, columns: t.columns.map(c => c.id === updated.id ? updated : c) }
          : t
        ))
        showToast('Đã cập nhật cột', 'success')
      } else {
        const res  = await fetch(`/api/tables/${activeId}/columns`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: colModal.name, type: colModal.type, required: colModal.required, options: colModal.options }),
        })
        const created: WorkColumn = await res.json()
        setTables(prev => prev.map(t => t.id === activeId
          ? { ...t, columns: [...t.columns, created] }
          : t
        ))
        showToast('Đã thêm cột', 'success')
      }
      setColModal({ open: false, editCol: null, name: '', type: 'text', required: false, options: [], newOption: '' })
    } catch { showToast('Lỗi khi lưu cột', 'error') }
    finally { setSaving(false) }
  }

  async function handleDeleteCol(colId: number) {
    if (!activeId) return
    try {
      await fetch(`/api/tables/${activeId}/columns/${colId}`, { method: 'DELETE' })
      setTables(prev => prev.map(t => t.id === activeId
        ? { ...t, columns: t.columns.filter(c => c.id !== colId) }
        : t
      ))
      setDelConfirm(null)
      setColModal(m => ({ ...m, open: false }))
      showToast('Đã xóa cột', 'success')
    } catch { showToast('Lỗi khi xóa', 'error') }
  }

  // ── Row CRUD ───────────────────────────────────────────────────────────────

  function openAddRow() {
    if (!activeTable) return
    const values: Record<number, string> = {}
    activeTable.columns.forEach(c => { values[c.id] = '' })
    setRowModal({ open: true, editRow: null, values })
  }

  function openEditRow(row: WorkRow) {
    if (!activeTable) return
    const values: Record<number, string> = {}
    activeTable.columns.forEach(c => {
      values[c.id] = row.cells.find(cell => cell.columnId === c.id)?.value ?? ''
    })
    setRowModal({ open: true, editRow: row, values })
  }

  async function handleSaveRow() {
    if (!activeId) return
    setSaving(true)
    try {
      const cells = Object.entries(rowModal.values).map(([colId, value]) => ({
        columnId: Number(colId), value: value || null,
      }))
      if (rowModal.editRow) {
        const res  = await fetch(`/api/tables/${activeId}/rows/${rowModal.editRow.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cells }),
        })
        const updated: WorkRow = await res.json()
        setRows(prev => prev.map(r => r.id === updated.id ? updated : r))
        showToast('Đã cập nhật', 'success')
      } else {
        const res  = await fetch(`/api/tables/${activeId}/rows`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cells }),
        })
        const created: WorkRow = await res.json()
        setRows(prev => [created, ...prev])
        showToast('Đã thêm mới', 'success')
      }
      setRowModal({ open: false, editRow: null, values: {} })
    } catch { showToast('Lỗi khi lưu', 'error') }
    finally { setSaving(false) }
  }

  async function handleDeleteRow(rowId: number) {
    if (!activeId) return
    try {
      await fetch(`/api/tables/${activeId}/rows/${rowId}`, { method: 'DELETE' })
      setRows(prev => prev.filter(r => r.id !== rowId))
      setDelConfirm(null)
      showToast('Đã xóa', 'success')
    } catch { showToast('Lỗi khi xóa', 'error') }
  }

  async function handleConfirmDelete() {
    if (!delConfirm) return
    if (delConfirm.kind === 'table')  await handleDeleteTable(delConfirm.id)
    if (delConfirm.kind === 'column') await handleDeleteCol(delConfirm.id)
    if (delConfirm.kind === 'row')    await handleDeleteRow(delConfirm.id)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[100] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {toast.type === 'success'
            ? <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            : <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          }
          {toast.msg}
        </div>
      )}

      {/* ── Table Tabs ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-2 sm:px-4 flex items-center overflow-x-auto scrollbar-hide">
          {loading ? (
            <div className="py-3 px-2 text-sm text-gray-400">Đang tải...</div>
          ) : (
            <>
              {tables.map(t => (
                <div key={t.id} className="relative flex-shrink-0 group">
                  <button
                    onClick={() => { setActiveId(t.id); setSearch('') }}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeId === t.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t.name}
                  </button>
                  {/* Tab ⋯ menu */}
                  <div className="absolute top-2 right-1 opacity-0 group-hover:opacity-100 transition-opacity" ref={tabMenu === t.id ? tabMenuRef : undefined}>
                    <button
                      onClick={e => { e.stopPropagation(); setTabMenu(prev => prev === t.id ? null : t.id) }}
                      className="p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                        <circle cx="8" cy="2" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="14" r="1.5"/>
                      </svg>
                    </button>
                    {tabMenu === t.id && (
                      <div className="absolute top-7 left-0 w-36 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1">
                        <button
                          onClick={() => { setTableModal({ open: true, editId: t.id, name: t.name }); setTabMenu(null) }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >✏️ Đổi tên</button>
                        <button
                          onClick={() => { setDelConfirm({ kind: 'table', id: t.id, label: `bảng "${t.name}"` }); setTabMenu(null) }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >🗑 Xóa bảng</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add table */}
              <button
                onClick={() => setTableModal({ open: true, editId: null, name: '' })}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-3 text-sm text-gray-400 hover:text-blue-600 transition-colors ml-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                </svg>
                <span className="hidden sm:inline">Thêm bảng</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="flex-1 p-3 sm:p-5">

        {/* Empty state — no tables */}
        {!loading && tables.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18M10 3v18M14 3v18"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-700 mb-1">Chưa có bảng nào</h2>
            <p className="text-sm text-gray-400 mb-6">Tạo bảng đầu tiên để bắt đầu quản lý dữ liệu</p>
            <button
              onClick={() => setTableModal({ open: true, editId: null, name: '' })}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              Tạo bảng mới
            </button>
          </div>
        )}

        {activeTable && (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-xs">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input type="text" placeholder="Tìm kiếm..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 ml-auto">
                {/* View toggle */}
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => setViewMode('card')}
                    title="Xem dạng card"
                    className={`px-2.5 py-2 transition-colors ${viewMode === 'card' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    title="Xem dạng bảng"
                    className={`px-2.5 py-2 transition-colors border-l border-gray-300 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18"/>
                    </svg>
                  </button>
                </div>

                <button onClick={openAddCol}
                  className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                  <span className="hidden sm:inline">Thêm cột</span>
                </button>
                <button onClick={openAddRow}
                  className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                  <span className="hidden sm:inline">Thêm dòng</span>
                  <span className="sm:hidden">Thêm</span>
                </button>
              </div>
            </div>

            {/* Card view */}
            {viewMode === 'card' && cols.length > 0 && (
              <>
                {rowsLoading ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">Đang tải...</div>
                ) : filtered.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">
                    {search ? `Không tìm thấy kết quả cho "${search}"` : 'Chưa có dữ liệu. Nhấn "Thêm dòng" để bắt đầu.'}
                  </div>
                ) : (
                  <CardView
                    rows={filtered}
                    cols={cols}
                    onEdit={openEditRow}
                    onDelete={(id) => setDelConfirm({ kind: 'row', id, label: 'dòng này' })}
                  />
                )}
                <div className="mt-3 flex items-center justify-between px-1">
                  <span className="text-xs text-gray-400">
                    {filtered.length} dòng{search ? ` / ${rows.length} tổng` : ''}
                  </span>
                  <button onClick={openAddRow}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                    </svg>
                    Thêm dòng
                  </button>
                </div>
              </>
            )}

            {/* Table view */}
            {(viewMode === 'table' || cols.length === 0) && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

              {/* Empty columns */}
              {cols.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <p className="text-sm text-gray-400 mb-4">Bảng chưa có cột nào</p>
                  <button onClick={openAddCol}
                    className="flex items-center gap-1.5 border border-dashed border-blue-300 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                    </svg>
                    Thêm cột đầu tiên
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-max">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="w-10 px-3 py-3 text-center text-xs font-medium text-gray-400 select-none">#</th>
                        {cols.map(col => (
                          <th key={col.id}
                            className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[140px] relative group/th"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-gray-400 text-[11px] select-none">
                                {COL_TYPES.find(t => t.value === col.type)?.icon}
                              </span>
                              <span className="flex-1 truncate">{col.name}</span>
                              {col.required && <span className="text-red-400">*</span>}
                              {/* Column menu */}
                              <div className="relative opacity-0 group-hover/th:opacity-100 transition-opacity"
                                ref={colMenu === col.id ? colMenuRef : undefined}
                              >
                                <button
                                  onClick={e => { e.stopPropagation(); setColMenu(prev => prev === col.id ? null : col.id) }}
                                  className="p-0.5 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-200"
                                >
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                                    <circle cx="8" cy="2" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="14" r="1.5"/>
                                  </svg>
                                </button>
                                {colMenu === col.id && (
                                  <div className="absolute top-6 right-0 w-36 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1">
                                    <button onClick={() => openEditCol(col)}
                                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >✏️ Chỉnh sửa</button>
                                    <button
                                      onClick={() => { setDelConfirm({ kind: 'column', id: col.id, label: `cột "${col.name}"` }); setColMenu(null) }}
                                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >🗑 Xóa cột</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </th>
                        ))}
                        <th className="w-20 px-3 py-3 text-center text-xs font-medium text-gray-400">
                          <button onClick={openAddCol}
                            className="inline-flex items-center gap-1 text-gray-300 hover:text-blue-500 transition-colors"
                            title="Thêm cột"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                            </svg>
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rowsLoading ? (
                        <tr>
                          <td colSpan={cols.length + 2} className="text-center py-12 text-gray-400 text-sm">
                            Đang tải...
                          </td>
                        </tr>
                      ) : filtered.length === 0 ? (
                        <tr>
                          <td colSpan={cols.length + 2} className="text-center py-14 text-gray-400 text-sm">
                            {search
                              ? `Không tìm thấy kết quả cho "${search}"`
                              : 'Chưa có dữ liệu. Nhấn "Thêm dòng" để bắt đầu.'}
                          </td>
                        </tr>
                      ) : filtered.map((row, idx) => (
                        <tr key={row.id}
                          className="border-b border-gray-100 hover:bg-blue-50/20 cursor-pointer transition-colors"
                          onClick={() => openEditRow(row)}
                        >
                          <td className="px-3 py-3 text-gray-400 text-center text-xs select-none">{idx + 1}</td>
                          {cols.map(col => {
                            const cell = row.cells.find(c => c.columnId === col.id)
                            return (
                              <td key={col.id} className="px-3 py-3 text-gray-700 max-w-[220px]">
                                <CellValue value={cell?.value ?? null} col={col} />
                              </td>
                            )
                          })}
                          <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => openEditRow(row)}
                                className="text-blue-500 hover:text-blue-700 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                              >Sửa</button>
                              <button onClick={() => setDelConfirm({ kind: 'row', id: row.id, label: 'dòng này' })}
                                className="text-red-400 hover:text-red-600 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                              >Xóa</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table footer */}
              {cols.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {filtered.length} dòng{search ? ` / ${rows.length} tổng` : ''}
                  </span>
                  <button onClick={openAddRow}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                    </svg>
                    Thêm dòng
                  </button>
                </div>
              )}
            </div>
            )}
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          Modals
      ════════════════════════════════════════════════════════════════════ */}

      {/* Table name modal */}
      {tableModal.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              {tableModal.editId ? 'Đổi tên bảng' : 'Tạo bảng mới'}
            </h2>
            <input autoFocus type="text"
              placeholder="Tên bảng..."
              value={tableModal.name}
              onChange={e => setTableModal(m => ({ ...m, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSaveTable()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setTableModal({ open: false, editId: null, name: '' })}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">Hủy</button>
              <button onClick={handleSaveTable} disabled={saving || !tableModal.name.trim()}
                className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Đang lưu...' : tableModal.editId ? 'Lưu' : 'Tạo bảng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column modal */}
      {colModal.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-base font-semibold text-gray-800">
                {colModal.editCol ? 'Chỉnh sửa cột' : 'Thêm cột mới'}
              </h2>
              <button onClick={() => setColModal(m => ({ ...m, open: false }))}
                className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tên cột <span className="text-red-500">*</span>
                </label>
                <input autoFocus type="text"
                  value={colModal.name}
                  onChange={e => setColModal(m => ({ ...m, name: e.target.value }))}
                  placeholder="VD: Tên dự án, Diện tích..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kiểu dữ liệu</label>
                <div className="grid grid-cols-2 gap-2">
                  {COL_TYPES.map(ct => (
                    <button key={ct.value}
                      onClick={() => setColModal(m => ({ ...m, type: ct.value }))}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                        colModal.type === ct.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-mono text-base w-5 text-center leading-none">{ct.icon}</span>
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select options */}
              {colModal.type === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh sách tùy chọn
                  </label>
                  <div className="space-y-1.5 mb-3">
                    {colModal.options.length === 0 && (
                      <p className="text-xs text-gray-400">Chưa có tùy chọn nào</p>
                    )}
                    {colModal.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${BADGE_COLORS[i % BADGE_COLORS.length]}`}>
                          {opt}
                        </span>
                        <button
                          onClick={() => setColModal(m => ({ ...m, options: m.options.filter((_, j) => j !== i) }))}
                          className="ml-auto text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text"
                      placeholder="Nhập tùy chọn rồi nhấn Enter..."
                      value={colModal.newOption}
                      onChange={e => setColModal(m => ({ ...m, newOption: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && colModal.newOption.trim()) {
                          setColModal(m => ({ ...m, options: [...m.options, m.newOption.trim()], newOption: '' }))
                        }
                      }}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => {
                        if (colModal.newOption.trim())
                          setColModal(m => ({ ...m, options: [...m.options, m.newOption.trim()], newOption: '' }))
                      }}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors font-medium"
                    >Thêm</button>
                  </div>
                </div>
              )}

              {/* Required */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={colModal.required}
                  onChange={e => setColModal(m => ({ ...m, required: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Bắt buộc nhập</span>
              </label>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex flex-col gap-2 flex-shrink-0">
              <div className="flex gap-3">
                <button onClick={() => setColModal(m => ({ ...m, open: false }))}
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">Hủy</button>
                <button onClick={handleSaveCol} disabled={saving || !colModal.name.trim()}
                  className="flex-1 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Đang lưu...' : colModal.editCol ? 'Cập nhật' : 'Thêm cột'}
                </button>
              </div>
              {/* Delete column — only when editing */}
              {colModal.editCol && (
                <button
                  onClick={() => setDelConfirm({ kind: 'column', id: colModal.editCol!.id, label: `cột "${colModal.editCol!.name}"` })}
                  className="w-full px-4 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  🗑 Xóa cột này
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Row modal */}
      {rowModal.open && activeTable && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-base font-semibold text-gray-800">
                {rowModal.editRow ? 'Chỉnh sửa' : 'Thêm dòng mới'}
              </h2>
              <button onClick={() => setRowModal(m => ({ ...m, open: false }))}
                className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {activeTable.columns.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">Bảng chưa có cột nào.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeTable.columns.map(col => (
                    <div key={col.id} className={col.type === 'textarea' ? 'sm:col-span-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <span className="font-mono text-gray-400 text-xs mr-1">
                          {COL_TYPES.find(t => t.value === col.type)?.icon}
                        </span>
                        {col.name}
                        {col.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <FieldInput
                        col={col}
                        value={rowModal.values[col.id] ?? ''}
                        onChange={v => setRowModal(m => ({ ...m, values: { ...m.values, [col.id]: v } }))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0">
              <button onClick={() => setRowModal(m => ({ ...m, open: false }))}
                className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">Hủy</button>
              <button onClick={handleSaveRow} disabled={saving}
                className="flex-1 sm:flex-none px-5 py-2.5 sm:py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Đang lưu...' : rowModal.editRow ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {delConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Xác nhận xóa</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Bạn chắc chắn muốn xóa {delConfirm.label}? Thao tác không thể hoàn tác.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDelConfirm(null)}
                className="flex-1 px-4 py-2.5 sm:py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">Hủy</button>
              <button onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 sm:py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Xóa</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
