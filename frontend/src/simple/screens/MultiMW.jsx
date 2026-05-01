import { useState } from 'react'
import MarketWatch from './MarketWatch'

const LAYOUTS = [
  { id: '2col', label: '2 Panels', cols: 2 },
  { id: '3col', label: '3 Panels', cols: 3 },
  { id: '4col', label: '4 Panels', cols: 4 },
]

const MOCK_MESSAGES = [
  { time: '09:15:33', type: 'trade', msg: '✅ Trade: BUY NIFTY 24200CE 50@142.00 — Trade#TRD001' },
  { time: '09:20:16', type: 'trade', msg: '✅ Trade: SELL RELIANCE 250@2540.50 — Trade#TRD002' },
  { time: '10:05:42', type: 'info', msg: 'ℹ Order placed: BUY INFY 600@1520.00 LMT — Order#25042' },
  { time: '11:15:05', type: 'error', msg: '✕ REJECTED: BUY HDFCBANK 550@1680.00 — Insufficient margin' },
  { time: '11:30:00', type: 'warning', msg: '⚠ Exchange: Pre-close session begins at 15:40' },
  { time: '12:00:00', type: 'success', msg: '✅ System: Market data refreshed — 220 symbols active' },
  { time: '13:10:36', type: 'trade', msg: '✅ Trade: BUY TATAMOTORS 1425@678.50 MKT — Trade#TRD005' },
]

export default function MultiMW() {
  const [layout, setLayout] = useState('4col')
  const cols = LAYOUTS.find(l => l.id === layout)?.cols || 4
  const [msgOpen, setMsgOpen] = useState(true)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', fontSize: 10 }}>
        <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 11 }}>⊞ Multi Market Watch</span>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        {LAYOUTS.map(l => (
          <button key={l.id} onClick={() => setLayout(l.id)} style={{
            padding: '2px 8px', fontSize: 9, cursor: 'pointer',
            background: layout === l.id ? 'var(--accent)' : 'var(--bg-input)',
            color: layout === l.id ? '#000' : 'var(--text-secondary)',
            border: `1px solid ${layout === l.id ? 'var(--accent)' : 'var(--border)'}`,
            fontWeight: layout === l.id ? 700 : 400,
          }}>{l.label}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 8, color: 'var(--text-muted)' }}>
          {cols} panels active
        </span>
        <button onClick={() => setMsgOpen(m => !m)} style={{
          padding: '2px 6px', fontSize: 8, cursor: 'pointer',
          background: msgOpen ? 'rgba(0,188,212,0.15)' : 'var(--bg-input)',
          color: msgOpen ? 'var(--accent)' : 'var(--text-muted)',
          border: '1px solid var(--border)',
        }}>{msgOpen ? '▼ Messages' : '▲ Messages'}</button>
      </div>

      {/* MW Panels Grid */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 1, background: 'var(--border)', overflow: 'hidden',
      }}>
        {[...Array(cols)].map((_, i) => (
          <div key={i} style={{ background: 'var(--bg-panel)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '2px 6px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
              fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4
            }}>
              <span style={{ color: 'var(--accent)' }}>MW-{i + 1}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 8 }}>
                {['NIFTY 50', 'BANK NIFTY', 'FIN NIFTY', 'MID CAP'][i] || `Panel ${i + 1}`}
              </span>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <MarketWatch />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Message Log */}
      {msgOpen && (
        <div style={{
          height: 100, borderTop: '2px solid var(--accent)', background: 'var(--bg-panel)',
          overflow: 'auto', padding: '2px 0',
        }}>
          <div style={{ padding: '2px 8px', fontSize: 9, color: 'var(--accent)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
            📨 Messages — {MOCK_MESSAGES.length} entries
          </div>
          {MOCK_MESSAGES.map((m, i) => (
            <div key={i} style={{
              padding: '1px 8px', fontSize: 9, display: 'flex', gap: 8,
              borderBottom: '1px solid rgba(42,42,68,0.15)',
              background: i % 2 === 0 ? 'var(--bg-row-even)' : 'var(--bg-row-odd)',
            }}>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--grid-font)', minWidth: 55 }}>{m.time}</span>
              <span style={{
                color: m.type === 'error' ? 'var(--loss)' : m.type === 'warning' ? '#eab308' : m.type === 'trade' ? 'var(--profit)' : 'var(--text-primary)'
              }}>{m.msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
