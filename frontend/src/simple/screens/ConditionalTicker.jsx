import { useState, useEffect } from 'react'
import { exportGridCSV, SortTh, sortGridData } from '../utils/gridUtils'
import ActionIcon from '../components/ActionIcons'

const INITIAL_TICKS = [
  { time: '14:32:15', symbol: 'RELIANCE', exchange: 'NSE', ltp: 2540.50, chg: 12.25, chgP: 0.48, vol: 125000, side: 'BUY', qty: 500 },
  { time: '14:32:14', symbol: 'NIFTY 24200CE', exchange: 'NSE', ltp: 142.00, chg: 8.50, chgP: 6.37, vol: 18500, side: 'BUY', qty: 75 },
  { time: '14:32:12', symbol: 'TCS', exchange: 'NSE', ltp: 3850.00, chg: -19.50, chgP: -0.50, vol: 82000, side: 'SELL', qty: 175 },
  { time: '14:32:10', symbol: 'HDFCBANK', exchange: 'NSE', ltp: 1580.25, chg: 8.75, chgP: 0.56, vol: 95000, side: 'BUY', qty: 550 },
  { time: '14:32:08', symbol: 'BANKNIFTY FUT', exchange: 'NSE', ltp: 51520.00, chg: 425.10, chgP: 0.83, vol: 210000, side: 'BUY', qty: 30 },
  { time: '14:32:05', symbol: 'SBIN', exchange: 'NSE', ltp: 780.50, chg: 15.25, chgP: 1.99, vol: 180000, side: 'BUY', qty: 1500 },
  { time: '14:32:02', symbol: 'INFY', exchange: 'NSE', ltp: 1420.00, chg: -12.50, chgP: -0.87, vol: 68000, side: 'SELL', qty: 300 },
  { time: '14:31:58', symbol: 'NIFTY 24300PE', exchange: 'NSE', ltp: 125.50, chg: -15.00, chgP: -10.68, vol: 14000, side: 'SELL', qty: 75 },
]

const CONDITIONS = [
  { id: 'chg_pos', label: 'Price Up (>0%)', check: t => t.chgP > 0 },
  { id: 'chg_neg', label: 'Price Down (<0%)', check: t => t.chgP < 0 },
  { id: 'chg_big', label: 'Big Move (>2%)', check: t => Math.abs(t.chgP) > 2 },
  { id: 'vol_high', label: 'Volume > 100K', check: t => t.vol > 100000 },
  { id: 'buy_side', label: 'Buy Side Only', check: t => t.side === 'BUY' },
  { id: 'sell_side', label: 'Sell Side Only', check: t => t.side === 'SELL' },
  { id: 'fno', label: 'F&O Only', check: t => t.symbol.includes('CE') || t.symbol.includes('PE') || t.symbol.includes('FUT') },
  { id: 'eq', label: 'Equity Only', check: t => !t.symbol.includes('CE') && !t.symbol.includes('PE') && !t.symbol.includes('FUT') },
]

const SYMBOLS = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'SBIN', 'ICICIBANK', 'NIFTY 24200CE', 'NIFTY 24300PE', 'BANKNIFTY FUT', 'TATAMOTORS', 'WIPRO', 'AXISBANK']

export default function ConditionalTicker() {
  const [ticks, setTicks] = useState(INITIAL_TICKS)
  const [activeConditions, setActiveConditions] = useState(['chg_big', 'vol_high'])
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState('3s')

  const toggle = (id) => setActiveConditions(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  // Simulated live ticks
  useEffect(() => {
    if (isPaused) return
    const ms = speed === '1s' ? 1000 : speed === '3s' ? 3000 : 5000
    const iv = setInterval(() => {
      const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      const chgP = ((Math.random() - 0.4) * 6)
      const newTick = {
        time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        symbol: sym,
        exchange: 'NSE',
        ltp: +(1000 + Math.random() * 3000).toFixed(2),
        chg: +(chgP * 15).toFixed(2),
        chgP: +chgP.toFixed(2),
        vol: Math.floor(50000 + Math.random() * 200000),
        side: Math.random() > 0.45 ? 'BUY' : 'SELL',
        qty: Math.floor(50 + Math.random() * 1000),
      }
      setTicks(p => [newTick, ...p].slice(0, 200))
    }, ms)
    return () => clearInterval(iv)
  }, [isPaused, speed])

  // Apply conditions
  const filtered = activeConditions.length === 0 ? ticks :
    ticks.filter(t => activeConditions.every(cid => CONDITIONS.find(c => c.id === cid)?.check(t)))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)' }}>
      {/* Header */}
      <div style={{ padding: '5px 10px', background: 'var(--bg-surface)', borderBottom: '2px solid #f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: '#f59e0b' }}>📡 Conditional Ticker</span>
        <span style={{ fontSize: 9, color: '#7a7a8c' }}>Ticks: <b style={{ color: '#d0d0d8' }}>{filtered.length}</b> / {ticks.length}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 8, color: '#7a7a8c' }}>Speed:</span>
          {['1s', '3s', '5s'].map(s => (
            <button key={s} onClick={() => setSpeed(s)} style={{
              padding: '1px 5px', fontSize: 8, border: '1px solid var(--border)', cursor: 'pointer',
              background: speed === s ? 'rgba(245,158,11,0.2)' : 'transparent',
              color: speed === s ? '#f59e0b' : '#5a5a6a'
            }}>{s}</button>
          ))}
          <button onClick={() => setIsPaused(s => !s)} style={{
            height: 20, padding: '0 8px', fontSize: 9, fontWeight: 600, cursor: 'pointer', border: 'none',
            background: isPaused ? '#ef4444' : '#22c55e', color: '#000'
          }}>{isPaused ? '▶ RESUME' : '● LIVE'}</button>
          <ActionIcon type="csv" tooltip="Export CSV" onClick={() => exportGridCSV(filtered, [{key:'time',label:'Time'},{key:'symbol',label:'Symbol'},{key:'exchange',label:'Exch'},{key:'side',label:'Side'},{key:'qty',label:'Qty'},{key:'ltp',label:'LTP'},{key:'chg',label:'Change'},{key:'chgP',label:'%Chg'},{key:'vol',label:'Volume'}], 'Ticker')} />
        </div>
      </div>

      {/* Condition Filters */}
      <div style={{ padding: '3px 8px', background: 'rgba(245,158,11,0.04)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 8, color: '#7a7a8c', marginRight: 4 }}>CONDITIONS:</span>
        {CONDITIONS.map(c => (
          <button key={c.id} onClick={() => toggle(c.id)} style={{
            padding: '2px 6px', fontSize: 7, border: `1px solid ${activeConditions.includes(c.id) ? '#f59e0b40' : '#2a2a44'}`,
            background: activeConditions.includes(c.id) ? 'rgba(245,158,11,0.15)' : 'transparent',
            color: activeConditions.includes(c.id) ? '#f59e0b' : '#5a5a6a', cursor: 'pointer'
          }}>{c.label}</button>
        ))}
        {activeConditions.length > 0 && (
          <ActionIcon type="clear" tooltip="Clear Conditions" onClick={() => setActiveConditions([])} />
        )}
      </div>

      {/* Ticker Grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--grid-font)', fontSize: 10 }}>
          <thead>
            <tr>
              {[{k:'time',l:'Time'},{k:'symbol',l:'Symbol',a:'left'},{k:'exchange',l:'Exch'},{k:'side',l:'Side'},{k:'qty',l:'Qty'},{k:'ltp',l:'LTP'},{k:'chg',l:'Change'},{k:'chgP',l:'%Chg'},{k:'vol',l:'Volume'}].map(c => (
                <th key={c.k} onClick={() => {}} style={{
                  textAlign: c.a || 'right', padding: '3px 6px', background: 'linear-gradient(180deg, #2a2a44, #1e1e38)',
                  border: '1px solid var(--border)', color: '#7a7a8c', fontSize: 9, fontWeight: 500,
                  position: 'sticky', top: 0, zIndex: 5, textTransform: 'uppercase', cursor: 'pointer'
                }}>{c.l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid rgba(42,42,68,0.3)',
                background: i === 0 ? 'rgba(245,158,11,0.06)' : i % 2 === 0 ? 'var(--bg-row-even)' : 'var(--bg-row-odd)',
                animation: i === 0 ? 'fadeIn 0.3s ease' : 'none'
              }}>
                <td style={tdS}>{t.time}</td>
                <td style={{ ...tdS, textAlign: 'left', fontWeight: 600, color: 'var(--text-bright)' }}>{t.symbol}</td>
                <td style={tdS}>{t.exchange}</td>
                <td style={{ ...tdS, fontWeight: 700, color: t.side === 'BUY' ? '#1565C0' : '#C62828' }}>{t.side}</td>
                <td style={tdS}>{t.qty.toLocaleString()}</td>
                <td style={{ ...tdS, fontWeight: 600 }}>₹{t.ltp.toFixed(2)}</td>
                <td style={{ ...tdS, color: t.chg >= 0 ? '#22c55e' : '#ef4444' }}>{t.chg >= 0 ? '+' : ''}{t.chg.toFixed(2)}</td>
                <td style={{ ...tdS, color: t.chgP >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{t.chgP >= 0 ? '+' : ''}{t.chgP.toFixed(2)}%</td>
                <td style={tdS}>{t.vol >= 100000 ? (t.vol / 100000).toFixed(1) + 'L' : (t.vol / 1000).toFixed(1) + 'K'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ padding: '3px 8px', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid var(--border)', fontSize: 8, color: '#5a5a6a', display: 'flex', gap: 8 }}>
        <span>Buy: <b style={{ color: '#1565C0' }}>{filtered.filter(t => t.side === 'BUY').length}</b></span>
        <span>Sell: <b style={{ color: '#C62828' }}>{filtered.filter(t => t.side === 'SELL').length}</b></span>
        <span>│ Conditions: {activeConditions.length > 0 ? activeConditions.map(id => CONDITIONS.find(c => c.id === id)?.label).join(' + ') : 'None (showing all)'}</span>
      </div>
    </div>
  )
}

const tdS = { padding: '3px 6px', height: 22, textAlign: 'right', color: '#d0d0d8' }
