import { useState, useEffect } from 'react'
import { exportGridCSV, SortTh, sortGridData } from '../utils/gridUtils'
import ActionIcon from '../components/ActionIcons'

const SCAN_PRESETS = [
  { id: 'vol_spike', name: 'Volume Spike > 3x Avg', category: 'Volume', icon: '📊' },
  { id: 'oi_buildup', name: 'OI Buildup > 10%', category: 'OI', icon: '📈' },
  { id: 'circuit_hit', name: 'Circuit Limit Hit', category: 'Price', icon: '⚡' },
  { id: 'gap_up', name: 'Gap Up > 2%', category: 'Price', icon: '🟢' },
  { id: 'gap_down', name: 'Gap Down > 2%', category: 'Price', icon: '🔴' },
  { id: '52w_high', name: '52-Week High Breakout', category: 'Price', icon: '🏔️' },
  { id: '52w_low', name: '52-Week Low Breakdown', category: 'Price', icon: '🕳️' },
  { id: 'high_iv', name: 'IV > 30% (Options)', category: 'IV', icon: '🌊' },
  { id: 'iv_crush', name: 'IV Crush < 15%', category: 'IV', icon: '📉' },
  { id: 'pcr_extreme', name: 'PCR > 1.5 or < 0.5', category: 'OI', icon: '⚖️' },
  { id: 'big_trade', name: 'Block Deal > ₹5Cr', category: 'Volume', icon: '💰' },
  { id: 'delivery_high', name: 'Delivery % > 60%', category: 'Volume', icon: '📦' },
]

const MOCK_RESULTS = [
  { time: '14:32:15', symbol: 'ADANIENT', exchange: 'NSE', scan: 'Volume Spike > 3x Avg', value: '4.2x avg', ltp: 2850, chgP: 3.2 },
  { time: '14:28:42', symbol: 'TATAMOTORS', exchange: 'NSE', scan: '52-Week High Breakout', value: '₹712 (prev: ₹698)', ltp: 712, chgP: 2.8 },
  { time: '14:25:10', symbol: 'NIFTY 24200PE', exchange: 'NSE', scan: 'IV Crush < 15%', value: 'IV: 12.8%', ltp: 58, chgP: -18.5 },
  { time: '14:22:05', symbol: 'SBIN', exchange: 'NSE', scan: 'OI Buildup > 10%', value: '+15.2% OI', ltp: 780, chgP: 2.1 },
  { time: '14:18:30', symbol: 'RELIANCE', exchange: 'NSE', scan: 'Block Deal > ₹5Cr', value: '₹12.5Cr block', ltp: 2540, chgP: 1.2 },
  { time: '14:15:22', symbol: 'BANKNIFTY FUT', exchange: 'NSE', scan: 'Gap Up > 2%', value: '+2.4% gap', ltp: 51520, chgP: 2.4 },
  { time: '14:12:08', symbol: 'WIPRO', exchange: 'NSE', scan: 'Gap Down > 2%', value: '-2.8% gap', ltp: 450, chgP: -2.8 },
  { time: '14:08:55', symbol: 'NIFTY 24400CE', exchange: 'NSE', scan: 'IV > 30% (Options)', value: 'IV: 34.2%', ltp: 28, chgP: 15.5 },
  { time: '14:05:12', symbol: 'HDFCBANK', exchange: 'NSE', scan: 'Delivery % > 60%', value: '68.5% delivery', ltp: 1580, chgP: 0.8 },
  { time: '14:02:40', symbol: 'ITC', exchange: 'NSE', scan: 'PCR > 1.5 or < 0.5', value: 'PCR: 1.72', ltp: 430, chgP: -0.2 },
]

export default function EventScanner() {
  const [activeScans, setActiveScans] = useState(['vol_spike', 'oi_buildup', '52w_high', 'high_iv'])
  const [results, setResults] = useState(MOCK_RESULTS)
  const [filter, setFilter] = useState('ALL')
  const [isScanning, setIsScanning] = useState(true)
  const [sortKey, setSortKey] = useState(null)
  const [sortAsc, setSortAsc] = useState(true)
  const onSort = (k) => { if (sortKey === k) setSortAsc(!sortAsc); else { setSortKey(k); setSortAsc(true) } }

  const toggleScan = (id) => setActiveScans(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const categories = ['ALL', ...new Set(SCAN_PRESETS.map(s => s.category))]

  // Simulate live scanning
  useEffect(() => {
    if (!isScanning) return
    const iv = setInterval(() => {
      const preset = SCAN_PRESETS[Math.floor(Math.random() * SCAN_PRESETS.length)]
      const symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'SBIN', 'ICICIBANK', 'NIFTY FUT', 'BANKNIFTY FUT']
      const newResult = {
        time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        exchange: 'NSE',
        scan: preset.name,
        value: 'Live scan',
        ltp: (1000 + Math.random() * 3000).toFixed(2),
        chgP: ((Math.random() - 0.4) * 6).toFixed(2),
      }
      setResults(p => [newResult, ...p].slice(0, 50))
    }, 8000)
    return () => clearInterval(iv)
  }, [isScanning])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)' }}>
      {/* Header */}
      <div style={{ padding: '5px 10px', background: 'var(--bg-surface)', borderBottom: '2px solid #a78bfa', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: '#a78bfa' }}>🔍 Event Scanner</span>
        <span style={{ fontSize: 9, color: '#7a7a8c' }}>Active: <b style={{ color: '#22c55e' }}>{activeScans.length}</b> scans</span>
        <span style={{ fontSize: 9, color: '#7a7a8c' }}>Results: <b style={{ color: '#d0d0d8' }}>{results.length}</b></span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <button onClick={() => setIsScanning(s => !s)} style={{
            height: 20, padding: '0 8px', fontSize: 9, fontWeight: 600, cursor: 'pointer', border: 'none',
            background: isScanning ? '#22c55e' : '#ef4444', color: '#000'
          }}>{isScanning ? '● SCANNING' : '○ PAUSED'}</button>
          <ActionIcon type="clear" tooltip="Clear Results" onClick={() => setResults([])} />
          <ActionIcon type="csv" tooltip="Export CSV" onClick={() => exportGridCSV(results, [{key:'time',label:'Time'},{key:'symbol',label:'Symbol'},{key:'exchange',label:'Exch'},{key:'scan',label:'Scan'},{key:'value',label:'Value'},{key:'ltp',label:'LTP'},{key:'chgP',label:'%Chg'}], 'EventScanner')} />
        </div>
      </div>

      {/* Scan Presets */}
      <div style={{ padding: '4px 8px', background: 'rgba(167,139,250,0.04)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {SCAN_PRESETS.map(s => (
          <button key={s.id} onClick={() => toggleScan(s.id)} style={{
            padding: '2px 6px', fontSize: 7, border: `1px solid ${activeScans.includes(s.id) ? '#a78bfa40' : '#2a2a44'}`,
            background: activeScans.includes(s.id) ? 'rgba(167,139,250,0.15)' : 'transparent',
            color: activeScans.includes(s.id) ? '#a78bfa' : '#5a5a6a', cursor: 'pointer', whiteSpace: 'nowrap'
          }}>{s.icon} {s.name}</button>
        ))}
      </div>

      {/* Filter */}
      <div style={{ padding: '2px 8px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 3 }}>
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: '1px 6px', fontSize: 8, border: '1px solid var(--border)', cursor: 'pointer',
            background: filter === c ? 'var(--bg-row-selected)' : 'transparent',
            color: filter === c ? 'var(--accent)' : '#7a7a8c'
          }}>{c}</button>
        ))}
      </div>

      {/* Results Grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--grid-font)', fontSize: 10 }}>
          <thead>
            <tr>
              {[{k:'time',l:'Time'},{k:'symbol',l:'Symbol',a:'left'},{k:'exchange',l:'Exch'},{k:'scan',l:'Scan Condition',a:'left'},{k:'value',l:'Value'},{k:'ltp',l:'LTP'},{k:'chgP',l:'%Chg'}].map(c => (
                <SortTh key={c.k} colKey={c.k} label={c.l} sortKey={sortKey} sortAsc={sortAsc} onSort={onSort} align={c.a} />
              ))}
            </tr>
          </thead>
          <tbody>
            {sortGridData(results.filter(r => filter === 'ALL' || SCAN_PRESETS.find(s => s.name === r.scan)?.category === filter), sortKey, sortAsc).map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(42,42,68,0.3)', background: i === 0 ? 'rgba(167,139,250,0.06)' : i % 2 === 0 ? 'var(--bg-row-even)' : 'var(--bg-row-odd)' }}>
                <td style={tdS}>{r.time}</td>
                <td style={{ ...tdS, textAlign: 'left', fontWeight: 600 }}>{r.symbol}</td>
                <td style={tdS}>{r.exchange}</td>
                <td style={{ ...tdS, textAlign: 'left', color: '#a78bfa' }}>{r.scan}</td>
                <td style={{ ...tdS, color: '#eab308' }}>{r.value}</td>
                <td style={{ ...tdS, fontWeight: 600 }}>₹{typeof r.ltp === 'number' ? r.ltp.toFixed(2) : r.ltp}</td>
                <td style={{ ...tdS, color: Number(r.chgP) >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                  {Number(r.chgP) >= 0 ? '+' : ''}{r.chgP}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const tdS = { padding: '3px 6px', height: 22, textAlign: 'right', color: '#d0d0d8' }
