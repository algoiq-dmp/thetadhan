import { useState, useRef } from 'react'
import ActionIcon from '../components/ActionIcons'

const POS_COLS = ['Symbol', 'Exchange', 'Product', 'BuyQty', 'BuyAvg', 'SellQty', 'SellAvg']
const SAMPLE = [
  ['NIFTY 24200CE', 'NSE', 'MIS', '50', '142.00', '0', '0'],
  ['RELIANCE', 'NSE', 'CNC', '0', '0', '250', '2540.50'],
  ['BANKNIFTY FUT', 'NSE', 'NRML', '30', '52150.00', '0', '0'],
]

export default function PositionUpload() {
  const [positions, setPositions] = useState([])
  const [fileName, setFileName] = useState('')
  const [mergeMode, setMergeMode] = useState('add')
  const [imported, setImported] = useState(false)
  const fileRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const parseCSV = (text) => {
    const lines = text.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) return []
    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    return lines.slice(1).map((line, i) => {
      const vals = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const row = {}; header.forEach((h, j) => { row[h] = vals[j] || '' })
      const buyQty = parseInt(row.BuyQty) || 0, sellQty = parseInt(row.SellQty) || 0
      const buyAvg = parseFloat(row.BuyAvg) || 0, sellAvg = parseFloat(row.SellAvg) || 0
      const netQty = buyQty - sellQty
      const ltp = buyAvg > 0 ? buyAvg * (1 + (Math.random() * 0.04 - 0.02)) : sellAvg * (1 + (Math.random() * 0.04 - 0.02))
      const mtmPnl = netQty > 0 ? (ltp - buyAvg) * netQty : netQty < 0 ? (sellAvg - ltp) * Math.abs(netQty) : 0
      row._netQty = netQty; row._ltp = ltp; row._mtmPnl = mtmPnl; row._row = i + 1
      row._valid = row.Symbol && row.Exchange && (buyQty > 0 || sellQty > 0)
      return row
    })
  }

  const handleFile = (f) => {
    if (!f) return; setFileName(f.name); setImported(false)
    const reader = new FileReader()
    reader.onload = (e) => setPositions(parseCSV(e.target.result))
    reader.readAsText(f)
  }

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }

  const downloadTemplate = () => {
    const csv = POS_COLS.join(',') + '\n' + SAMPLE.map(r => r.join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'position_template.csv'; a.click()
  }

  const importPositions = () => { setImported(true) }

  const validCount = positions.filter(p => p._valid).length
  const totalMtm = positions.reduce((a, p) => a + (p._mtmPnl || 0), 0)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)' }}>
      <div style={{ padding: '6px 12px', background: 'var(--bg-surface)', borderBottom: '2px solid #22c55e', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: '#22c55e' }}>📊 Position Upload (CSV)</span>
        <span style={{ marginLeft: 'auto' }}>
          <ActionIcon type="export" tooltip="Download Template" onClick={downloadTemplate} />
        </span>
      </div>

      {positions.length === 0 && (
        <div className={`drop-zone ${dragOver ? 'drop-zone-active' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
          onDrop={onDrop} onClick={() => fileRef.current?.click()}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#d0d0d8' }}>Drop Position CSV here</div>
          <div style={{ fontSize: 10, color: '#7a7a8c', marginTop: 4 }}>Columns: {POS_COLS.join(', ')}</div>
          <input ref={fileRef} type="file" accept=".csv" onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />
        </div>
      )}

      {positions.length > 0 && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'flex', gap: 12, padding: '4px 12px', background: 'rgba(0,0,0,0.15)', fontSize: 9, alignItems: 'center' }}>
            <span style={{ color: '#7a7a8c' }}>File: <b style={{ color: '#d0d0d8' }}>{fileName}</b></span>
            <span>Positions: <b>{positions.length}</b></span>
            <span>Valid: <b style={{ color: '#22c55e' }}>{validCount}</b></span>
            <span>MTM: <b className={totalMtm >= 0 ? 'pnl-positive' : 'pnl-negative'}>₹{totalMtm.toFixed(0)}</b></span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ color: '#7a7a8c' }}>Merge:</span>
              {['add', 'replace', 'reconcile'].map(m => (
                <button key={m} onClick={() => setMergeMode(m)} style={{
                  padding: '1px 6px', fontSize: 8, border: '1px solid var(--border)', cursor: 'pointer',
                  background: mergeMode === m ? 'var(--bg-row-selected)' : 'transparent',
                  color: mergeMode === m ? 'var(--accent)' : '#7a7a8c', textTransform: 'capitalize'
                }}>{m}</button>
              ))}
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--grid-font)', fontSize: 10 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                <th style={thS}>#</th>
                {POS_COLS.map(c => <th key={c} style={thS}>{c}</th>)}
                <th style={thS}>Net Qty</th>
                <th style={thS}>LTP</th>
                <th style={thS}>MTM P&L</th>
                <th style={thS}>Status</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(42,42,68,0.3)', background: !p._valid ? 'rgba(239,68,68,0.06)' : i % 2 === 0 ? 'var(--bg-row-even)' : 'var(--bg-row-odd)' }}>
                  <td style={tdS}>{i + 1}</td>
                  {POS_COLS.map(c => <td key={c} style={{ ...tdS, fontWeight: c === 'Symbol' ? 600 : 400 }}>{p[c] || '—'}</td>)}
                  <td style={{ ...tdS, color: p._netQty > 0 ? '#22c55e' : p._netQty < 0 ? '#ef4444' : '#d0d0d8', fontWeight: 700 }}>
                    {p._netQty > 0 ? '+' : ''}{p._netQty}
                  </td>
                  <td style={tdS}>{p._ltp?.toFixed(2)}</td>
                  <td style={{ ...tdS, fontWeight: 600 }} className={p._mtmPnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>
                    {p._mtmPnl >= 0 ? '+' : ''}₹{p._mtmPnl?.toFixed(0)}
                  </td>
                  <td style={tdS}>{imported ? <span style={{ color: '#22c55e' }}>✓</span> : p._valid ? <span style={{ color: '#4dabf7' }}>●</span> : <span style={{ color: '#ef4444' }}>✗</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {positions.length > 0 && (
        <div style={{ display: 'flex', gap: 6, padding: '6px 12px', borderTop: '1px solid var(--border)', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.1)' }}>
          <ActionIcon type="clear" tooltip="Clear" onClick={() => { setPositions([]); setFileName('') }} />
          <button onClick={importPositions} disabled={imported} style={{ height: 24, padding: '0 16px', background: imported ? '#22c55e' : '#1565C0', color: '#fff', border: 'none', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
            {imported ? '✓ Imported' : `📥 Import ${validCount} Positions (${mergeMode})`}
          </button>
        </div>
      )}
    </div>
  )
}

const thS = { padding: '3px 6px', color: '#6a6a7a', fontSize: 9, fontWeight: 600, textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }
const tdS = { padding: '3px 6px', height: 22, color: '#d0d0d8', whiteSpace: 'nowrap' }
