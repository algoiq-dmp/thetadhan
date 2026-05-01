import { useState } from 'react'
import ActionIcon from '../components/ActionIcons'

const MOCK_TRAIL = [
  { time:'09:15:01', event:'Order Placed', symbol:'NIFTY 24200CE', side:'BUY', qty:50, price:140.00, underlying:24180.50, iv:16.2, oiChg:'+1.2L', mtm:0, cumPnl:0 },
  { time:'09:15:33', event:'Executed', symbol:'NIFTY 24200CE', side:'BUY', qty:50, price:142.00, underlying:24185.00, iv:16.1, oiChg:'+1.5L', mtm:0, cumPnl:0 },
  { time:'09:20:10', event:'Order Placed', symbol:'RELIANCE', side:'SELL', qty:250, price:2540.00, underlying:2538.50, iv:'—', oiChg:'—', mtm:0, cumPnl:0 },
  { time:'09:20:16', event:'Executed', symbol:'RELIANCE', side:'SELL', qty:250, price:2540.50, underlying:2539.00, iv:'—', oiChg:'—', mtm:125, cumPnl:125 },
  { time:'10:05:42', event:'Order Placed', symbol:'INFY', side:'BUY', qty:600, price:1520.00, underlying:1518.50, iv:'—', oiChg:'—', mtm:0, cumPnl:125 },
  { time:'10:06:00', event:'Pending', symbol:'INFY', side:'BUY', qty:600, price:1520.00, underlying:1519.00, iv:'—', oiChg:'—', mtm:0, cumPnl:125 },
  { time:'10:30:15', event:'Executed', symbol:'INFY', side:'BUY', qty:600, price:1521.00, underlying:1522.50, iv:'—', oiChg:'—', mtm:900, cumPnl:1025 },
  { time:'11:15:05', event:'Rejected', symbol:'HDFCBANK', side:'BUY', qty:550, price:1680.00, underlying:1575.00, iv:'—', oiChg:'—', mtm:0, cumPnl:1025 },
  { time:'11:30:22', event:'Order Placed', symbol:'NIFTY 24300CE', side:'SELL', qty:100, price:96.00, underlying:24210.00, iv:15.8, oiChg:'-0.8L', mtm:0, cumPnl:1025 },
  { time:'11:30:23', event:'Executed', symbol:'NIFTY 24300CE', side:'SELL', qty:100, price:95.00, underlying:24208.00, iv:15.9, oiChg:'-1.0L', mtm:-100, cumPnl:925 },
  { time:'12:45:11', event:'Order Placed', symbol:'SBIN', side:'BUY', qty:750, price:824.00, underlying:780.50, iv:'—', oiChg:'—', mtm:0, cumPnl:925 },
  { time:'12:45:13', event:'Executed', symbol:'SBIN', side:'BUY', qty:750, price:824.00, underlying:780.00, iv:'—', oiChg:'—', mtm:0, cumPnl:925 },
  { time:'13:10:30', event:'Order Placed', symbol:'TATAMOTORS', side:'BUY', qty:1425, price:678.50, underlying:680.00, iv:'—', oiChg:'—', mtm:0, cumPnl:925 },
  { time:'13:10:36', event:'Executed', symbol:'TATAMOTORS', side:'BUY', qty:1425, price:678.50, underlying:680.00, iv:'—', oiChg:'—', mtm:2137, cumPnl:3062 },
  { time:'14:22:18', event:'Cancelled', symbol:'NIFTY 24200PE', side:'SELL', qty:150, price:60.00, underlying:24250.50, iv:14.5, oiChg:'+0.5L', mtm:0, cumPnl:3062 },
  { time:'14:50:00', event:'Square Off', symbol:'NIFTY 24200CE', side:'SELL', qty:50, price:155.00, underlying:24280.00, iv:15.0, oiChg:'-2.0L', mtm:650, cumPnl:3712 },
  { time:'15:10:00', event:'Square Off', symbol:'INFY', side:'SELL', qty:600, price:1528.00, underlying:1530.00, iv:'—', oiChg:'—', mtm:4200, cumPnl:7912 },
]

const EVENT_COLORS = {
  'Order Placed': '#4dabf7', Executed: '#22c55e', Pending: '#eab308',
  Rejected: '#ef4444', Cancelled: '#7a7a8c', 'Square Off': '#c084fc',
  Modified: '#f59e0b',
}
const EVENT_FILTERS = ['ALL','Order Placed','Executed','Pending','Rejected','Cancelled','Square Off']
const SIDE_FILTERS = ['ALL','BUY','SELL']

export default function TradeTrail() {
  const [eventFilter, setEventFilter] = useState('ALL')
  const [sideFilter, setSideFilter] = useState('ALL')
  const [symFilter, setSymFilter] = useState('')

  const filtered = MOCK_TRAIL.filter(t =>
    (eventFilter === 'ALL' || t.event === eventFilter) &&
    (sideFilter === 'ALL' || t.side === sideFilter) &&
    (!symFilter || t.symbol.toLowerCase().includes(symFilter.toLowerCase()))
  )

  const execTrades = MOCK_TRAIL.filter(t => t.event === 'Executed')
  const totalTrades = execTrades.length
  const winners = execTrades.filter(t => t.mtm > 0).length
  const winRate = totalTrades > 0 ? Math.round(winners / totalTrades * 100) : 0
  const peakPnl = Math.max(...MOCK_TRAIL.map(t => t.cumPnl))
  const finalPnl = MOCK_TRAIL[MOCK_TRAIL.length - 1]?.cumPnl || 0

  const exportCSV = () => {
    const header = 'Time,Event,Symbol,Side,Qty,Price,Underlying,IV,OI Chg,MTM,Cumul P&L\n'
    const rows = filtered.map(t => `${t.time},${t.event},${t.symbol},${t.side},${t.qty},${t.price},${t.underlying},${t.iv},${t.oiChg},${t.mtm},${t.cumPnl}`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'trade_trail.csv'; a.click()
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)' }}>
      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 6, padding: '6px 10px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        {[
          { label: 'Total Trades', val: totalTrades, color: 'var(--accent)' },
          { label: 'Win Rate', val: `${winRate}%`, color: winRate >= 50 ? '#22c55e' : '#ef4444' },
          { label: 'Final P&L', val: `₹${finalPnl.toLocaleString()}`, color: finalPnl >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'Peak P&L', val: `₹${peakPnl.toLocaleString()}`, color: '#c084fc' },
          { label: 'Events', val: MOCK_TRAIL.length, color: 'var(--text-secondary)' },
        ].map((c, i) => (
          <div key={i} style={{
            flex: 1, padding: '6px 10px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{c.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: c.color, fontFamily: 'var(--grid-font)' }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderBottom: '1px solid var(--border)', fontSize: 9 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 8 }}>EVENT:</span>
        {EVENT_FILTERS.map(f => (
          <button key={f} onClick={() => setEventFilter(f)} style={{
            padding: '1px 6px', fontSize: 8, cursor: 'pointer',
            background: eventFilter === f ? 'var(--bg-row-selected)' : 'transparent',
            color: eventFilter === f ? EVENT_COLORS[f] || 'var(--accent)' : 'var(--text-muted)',
            border: `1px solid ${eventFilter === f ? 'var(--border-light)' : 'var(--border)'}`,
          }}>{f}</button>
        ))}
        <span style={{ color: 'var(--text-muted)', fontSize: 8, marginLeft: 6 }}>SIDE:</span>
        {SIDE_FILTERS.map(f => (
          <button key={f} onClick={() => setSideFilter(f)} style={{
            padding: '1px 6px', fontSize: 8, cursor: 'pointer',
            background: sideFilter === f ? 'var(--bg-row-selected)' : 'transparent',
            color: sideFilter === f ? (f === 'BUY' ? 'var(--buy)' : f === 'SELL' ? 'var(--sell)' : 'var(--accent)') : 'var(--text-muted)',
            border: `1px solid ${sideFilter === f ? 'var(--border-light)' : 'var(--border)'}`,
          }}>{f}</button>
        ))}
        <input value={symFilter} onChange={e => setSymFilter(e.target.value)} placeholder="Filter symbol..."
          style={{ height: 18, width: 100, marginLeft: 6, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0 4px', fontSize: 9 }} />
        <ActionIcon type="csv" tooltip="Export CSV" onClick={exportCSV} />
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--grid-font)', fontSize: 10 }}>
          <thead>
            <tr>
              {['#','Time','Event','Symbol','Side','Qty','Price','Underlying','IV','OI Chg','MTM','Cumul P&L'].map(h => (
                <th key={h} style={{
                  textAlign: h === 'Symbol' || h === 'Event' || h === 'Side' ? 'left' : 'right',
                  padding: '3px 6px', background: 'linear-gradient(180deg,#2a2a44,#1e1e38)',
                  border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 500, fontSize: 9,
                  position: 'sticky', top: 0, zIndex: 5, whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => {
              const evColor = EVENT_COLORS[t.event] || 'var(--text-primary)'
              return (
                <tr key={i} style={{
                  borderBottom: '1px solid rgba(42,42,68,0.3)',
                  background: i % 2 === 0 ? 'var(--bg-row-even)' : 'var(--bg-row-odd)',
                }}>
                  <td style={tdR}>{i + 1}</td>
                  <td style={{ ...tdR, fontFamily: 'var(--grid-font)', color: 'var(--text-muted)' }}>{t.time}</td>
                  <td style={{ ...tdR, textAlign: 'left', fontWeight: 600, color: evColor }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: evColor, marginRight: 4, verticalAlign: 'middle' }} />
                    {t.event}
                  </td>
                  <td style={{ ...tdR, textAlign: 'left', fontWeight: 600, color: 'var(--text-bright)' }}>{t.symbol}</td>
                  <td style={{ ...tdR, textAlign: 'left', fontWeight: 700, color: t.side === 'BUY' ? 'var(--buy)' : 'var(--sell)' }}>{t.side}</td>
                  <td style={{ ...tdR, fontWeight: 600 }}>{t.qty}</td>
                  <td style={tdR}>{t.price.toFixed(2)}</td>
                  <td style={{ ...tdR, color: '#c084fc' }}>{t.underlying}</td>
                  <td style={{ ...tdR, color: t.iv !== '—' ? '#eab308' : 'var(--text-muted)' }}>{t.iv !== '—' ? `${t.iv}%` : '—'}</td>
                  <td style={{ ...tdR, color: typeof t.oiChg === 'string' && t.oiChg.startsWith('+') ? '#22c55e' : typeof t.oiChg === 'string' && t.oiChg.startsWith('-') ? '#ef4444' : 'var(--text-muted)' }}>{t.oiChg}</td>
                  <td style={{ ...tdR, fontWeight: 600, color: t.mtm > 0 ? '#22c55e' : t.mtm < 0 ? '#ef4444' : 'var(--text-muted)' }}>
                    {t.mtm !== 0 ? (t.mtm > 0 ? '+' : '') + '₹' + t.mtm.toLocaleString() : '—'}
                  </td>
                  <td style={{ ...tdR, fontWeight: 700, color: t.cumPnl > 0 ? '#22c55e' : t.cumPnl < 0 ? '#ef4444' : 'var(--text-muted)', fontSize: 11 }}>
                    ₹{t.cumPnl.toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ padding: '4px 10px', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid var(--border)', fontSize: 9, display: 'flex', gap: 12, color: 'var(--text-muted)' }}>
        <span>Showing: <b style={{ color: 'var(--text-primary)' }}>{filtered.length}</b> of {MOCK_TRAIL.length}</span>
        <span>Date: <b style={{ color: 'var(--accent)' }}>27-Apr-2026</b></span>
        <span style={{ marginLeft: 'auto' }}>Session: 09:15 — 15:30 IST</span>
      </div>
    </div>
  )
}
const tdR = { textAlign: 'right', padding: '2px 6px', height: 22, color: 'var(--text-primary)' }
