import { useState } from 'react'
import useAppStore from '../stores/useAppStore'
import ActionIcon from '../components/ActionIcons'


const EVENT_COLORS = {
  'Order Placed': '#4dabf7', Executed: '#22c55e', Pending: '#eab308',
  Rejected: '#ef4444', Cancelled: '#7a7a8c', 'Square Off': '#c084fc',
  Modified: '#f59e0b',
}
const EVENT_FILTERS = ['ALL','Order Placed','Executed','Pending','Rejected','Cancelled','Square Off']
const SIDE_FILTERS = ['ALL','BUY','SELL']

export default function TradeTrail() {
  const messages = useAppStore(s => s.messages) || []
  const orders = useAppStore(s => s.orders) || []
  const trades = useAppStore(s => s.trades) || []

  // Build trail from live orders + trades
  const trail = [
    ...orders.map(o => ({
      time: o.time || '', event: o.status === 'TRADED' ? 'Executed' : o.status === 'REJECTED' ? 'Rejected' : o.status === 'CANCELLED' ? 'Cancelled' : o.status === 'PENDING' ? 'Pending' : 'Order Placed',
      symbol: o.symbol || '', side: o.side || '', qty: o.qty || 0, price: o.price || 0,
      underlying: '—', iv: '—', oiChg: '—', mtm: 0, cumPnl: 0
    })),
    ...trades.map(t => ({
      time: t.time || '', event: 'Executed', symbol: t.symbol || '', side: t.side || '',
      qty: t.qty || 0, price: t.price || 0, underlying: '—', iv: '—', oiChg: '—', mtm: 0, cumPnl: 0
    }))
  ].sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  // Compute cumPnl
  let cumPnl = 0
  trail.forEach(t => { cumPnl += t.mtm; t.cumPnl = cumPnl })

  const allEvents = trail // alias for minimal JSX changes
  const [eventFilter, setEventFilter] = useState('ALL')
  const [sideFilter, setSideFilter] = useState('ALL')
  const [symFilter, setSymFilter] = useState('')

  const filtered = allEvents.filter(t =>
    (eventFilter === 'ALL' || t.event === eventFilter) &&
    (sideFilter === 'ALL' || t.side === sideFilter) &&
    (!symFilter || t.symbol.toLowerCase().includes(symFilter.toLowerCase()))
  )

  const execTrades = allEvents.filter(t => t.event === 'Executed')
  const totalTrades = execTrades.length
  const winners = execTrades.filter(t => t.mtm > 0).length
  const winRate = totalTrades > 0 ? Math.round(winners / totalTrades * 100) : 0
  const peakPnl = allEvents.length > 0 ? Math.max(...allEvents.map(t => t.cumPnl)) : 0
  const finalPnl = allEvents[allEvents.length - 1]?.cumPnl || 0

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
          { label: 'Events', val: allEvents.length, color: 'var(--text-secondary)' },
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
        <span>Showing: <b style={{ color: 'var(--text-primary)' }}>{filtered.length}</b> of {allEvents.length}</span>
        <span>Date: <b style={{ color: 'var(--accent)' }}>27-Apr-2026</b></span>
        <span style={{ marginLeft: 'auto' }}>Session: 09:15 — 15:30 IST</span>
      </div>
    </div>
  )
}
const tdR = { textAlign: 'right', padding: '2px 6px', height: 22, color: 'var(--text-primary)' }
