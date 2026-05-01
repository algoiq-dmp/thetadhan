import { useState, useRef } from 'react'
import { exportGridCSV } from '../utils/gridUtils'
import ActionIcon from '../components/ActionIcons'

const TEMPLATE_COLS = ['Exchange', 'Symbol', 'Instrument', 'Expiry', 'Strike', 'OptType', 'Side', 'Qty', 'Price', 'Product', 'OrderType', 'Validity']
const SAMPLE_ROWS = [
  ['NSE', 'NIFTY', 'OPTIDX', '24-APR-2025', '24200', 'CE', 'BUY', '50', '142.00', 'MIS', 'LMT', 'DAY'],
  ['NSE', 'RELIANCE', 'EQ', '', '', '', 'BUY', '250', '2540.50', 'CNC', 'LMT', 'DAY'],
  ['NSE', 'BANKNIFTY', 'FUTIDX', '24-APR-2025', '', '', 'SELL', '30', '52150.00', 'NRML', 'MKT', 'DAY'],
]

export default function ExcelOrderUpload() {
  const [orders, setOrders] = useState([])
  const [fileName, setFileName] = useState('')
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(0)
  const fileRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const parseCSV = (text) => {
    const lines = text.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) return { rows: [], errs: ['File must have header + at least 1 data row'] }
    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const rows = []; const errs = []
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const row = {}; header.forEach((h, j) => { row[h] = vals[j] || '' })
      // Validate
      const rowErrs = []
      if (!row.Exchange || !['NSE', 'BSE', 'MCX'].includes(row.Exchange?.toUpperCase())) rowErrs.push('Invalid Exchange')
      if (!row.Symbol) rowErrs.push('Symbol required')
      if (!row.Side || !['BUY', 'SELL'].includes(row.Side?.toUpperCase())) rowErrs.push('Side must be BUY/SELL')
      if (!row.Qty || parseInt(row.Qty) <= 0) rowErrs.push('Qty must be > 0')
      if (row.OrderType === 'LMT' && (!row.Price || parseFloat(row.Price) <= 0)) rowErrs.push('Price required for LMT')
      row._row = i; row._errors = rowErrs; row._status = rowErrs.length > 0 ? 'error' : 'ready'
      rows.push(row)
      if (rowErrs.length > 0) errs.push(`Row ${i}: ${rowErrs.join(', ')}`)
    }
    return { rows, errs }
  }

  const handleFile = (file) => {
    if (!file) return
    setFileName(file.name); setSubmitted(0)
    const reader = new FileReader()
    reader.onload = (e) => {
      const { rows, errs } = parseCSV(e.target.result)
      setOrders(rows); setErrors(errs)
    }
    reader.readAsText(file)
  }

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }
  const onBrowse = (e) => handleFile(e.target.files[0])

  const downloadTemplate = () => {
    const csv = TEMPLATE_COLS.join(',') + '\n' + SAMPLE_ROWS.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bulk_order_template.csv'; a.click()
  }

  const submitAll = () => {
    setSubmitting(true); setSubmitted(0)
    const valid = orders.filter(o => o._status !== 'error')
    let i = 0
    const interval = setInterval(() => {
      if (i >= valid.length) { clearInterval(interval); setSubmitting(false); return }
      valid[i]._status = Math.random() > 0.15 ? 'executed' : 'rejected'
      i++; setSubmitted(i); setOrders([...orders])
    }, 200)
  }

  const validCount = orders.filter(o => o._status === 'ready' || o._status === 'executed').length
  const errorCount = orders.filter(o => o._status === 'error').length
  const execCount = orders.filter(o => o._status === 'executed').length
  const rejCount = orders.filter(o => o._status === 'rejected').length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)' }}>
      {/* Header */}
      <div style={{ padding: '6px 12px', background: 'var(--bg-surface)', borderBottom: '2px solid #1565C0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: '#4dabf7' }}>📋 Bulk Order Upload (Excel/CSV)</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <ActionIcon type="export" tooltip="Download Template" onClick={downloadTemplate} />
          {orders.length > 0 && <ActionIcon type="csv" tooltip="Export CSV" onClick={() => exportGridCSV(orders, TEMPLATE_COLS.map(c => ({key:c,label:c})), 'BulkOrders')} />}
        </span>
      </div>

      {/* Drop Zone */}
      {orders.length === 0 && (
        <div className={`drop-zone ${dragOver ? 'drop-zone-active' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#d0d0d8' }}>Drop CSV/Excel file here</div>
          <div style={{ fontSize: 10, color: '#7a7a8c', marginTop: 4 }}>or click to browse</div>
          <div style={{ fontSize: 9, color: '#5a5a6a', marginTop: 8 }}>
            Required columns: {TEMPLATE_COLS.join(', ')}
          </div>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={onBrowse} style={{ display: 'none' }} />
        </div>
      )}

      {/* Preview Grid */}
      {orders.length > 0 && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Stats bar */}
          <div style={{ display: 'flex', gap: 12, padding: '4px 12px', background: 'rgba(0,0,0,0.15)', fontSize: 9, alignItems: 'center' }}>
            <span style={{ color: '#7a7a8c' }}>File: <b style={{ color: '#d0d0d8' }}>{fileName}</b></span>
            <span style={{ color: '#7a7a8c' }}>Total: <b>{orders.length}</b></span>
            <span style={{ color: '#22c55e' }}>Valid: <b>{validCount}</b></span>
            <span style={{ color: '#ef4444' }}>Errors: <b>{errorCount}</b></span>
            {execCount > 0 && <span style={{ color: '#22c55e' }}>✓ Executed: <b>{execCount}</b></span>}
            {rejCount > 0 && <span style={{ color: '#ef4444' }}>✗ Rejected: <b>{rejCount}</b></span>}
            <span style={{ marginLeft: 'auto' }}>
              <ActionIcon type="clear" tooltip="Clear All" onClick={() => { setOrders([]); setFileName(''); setErrors([]) }} />
            </span>
          </div>

          {/* Progress */}
          {submitting && (
            <div style={{ height: 3, background: '#1a1a2e' }}>
              <div style={{ height: '100%', background: 'var(--accent)', width: `${(submitted / orders.filter(o => o._status !== 'error').length) * 100}%`, transition: 'width 0.2s' }} />
            </div>
          )}

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--grid-font)', fontSize: 10 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                <th style={thS}>#</th>
                <th style={thS}>Status</th>
                {TEMPLATE_COLS.map(c => <th key={c} style={thS}>{c}</th>)}
                <th style={thS}>Errors</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={i} style={{
                  borderBottom: '1px solid rgba(42,42,68,0.3)',
                  background: o._status === 'error' ? 'rgba(239,68,68,0.06)' : o._status === 'executed' ? 'rgba(34,197,94,0.06)' : o._status === 'rejected' ? 'rgba(239,68,68,0.08)' : i % 2 === 0 ? 'var(--bg-row-even)' : 'var(--bg-row-odd)'
                }}>
                  <td style={tdS}>{i + 1}</td>
                  <td style={tdS}>
                    {o._status === 'ready' && <span style={{ color: '#4dabf7' }}>●</span>}
                    {o._status === 'error' && <span style={{ color: '#ef4444' }}>✗</span>}
                    {o._status === 'executed' && <span style={{ color: '#22c55e' }}>✓</span>}
                    {o._status === 'rejected' && <span style={{ color: '#ef4444' }}>REJ</span>}
                  </td>
                  {TEMPLATE_COLS.map(c => (
                    <td key={c} style={{
                      ...tdS,
                      color: c === 'Side' ? (o[c]?.toUpperCase() === 'BUY' ? '#4dabf7' : '#ff6b6b') : '#d0d0d8',
                      fontWeight: c === 'Side' || c === 'Qty' || c === 'Price' ? 600 : 400
                    }}>{o[c] || '—'}</td>
                  ))}
                  <td style={{ ...tdS, color: '#ef4444', fontSize: 8, maxWidth: 120 }}>{o._errors?.join('; ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      {orders.length > 0 && (
        <div style={{ display: 'flex', gap: 6, padding: '6px 12px', borderTop: '1px solid var(--border)', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.1)' }}>
          <button onClick={() => { setOrders(orders.filter(o => o._status !== 'error')) }}
            style={{ height: 24, padding: '0 12px', background: '#2a2a44', color: '#d0d0d8', border: '1px solid #3a3a5a', fontSize: 10, cursor: 'pointer' }}>
            Remove Invalid ({errorCount})
          </button>
          <button onClick={submitAll} disabled={submitting || validCount === 0}
            style={{ height: 24, padding: '0 16px', background: submitting ? '#2a2a44' : '#1565C0', color: '#fff', border: 'none', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
            {submitting ? `⏳ Submitting ${submitted}/${validCount}...` : `⚡ Submit All (${validCount} orders)`}
          </button>
        </div>
      )}
    </div>
  )
}

const thS = { padding: '3px 6px', color: '#6a6a7a', fontSize: 9, fontWeight: 600, textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }
const tdS = { padding: '3px 6px', height: 22, whiteSpace: 'nowrap' }
