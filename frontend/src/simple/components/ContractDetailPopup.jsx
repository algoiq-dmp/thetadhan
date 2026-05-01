/**
 * ContractDetailPopup — Floating contract information panel
 * Shows: Today/Last Day/Weekly OHLC, Pivot Points, Circuit Limits, Key Stats
 * Opens near the symbol in MarketWatch on clicking the ℹ icon
 */
import { useState, useEffect, useRef } from 'react'

function calcPivots(high, low, close) {
  const pp = (high + low + close) / 3
  const r1 = 2 * pp - low, s1 = 2 * pp - high
  const r2 = pp + (high - low), s2 = pp - (high - low)
  const r3 = high + 2 * (pp - low), s3 = low - 2 * (high - pp)
  return { pp, r1, r2, r3, s1, s2, s3 }
}

export default function ContractDetailPopup({ sym, x, y, onClose }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ left: x, top: y })

  // Clamp position to viewport
  useEffect(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    let left = x, top = y
    if (left + rect.width > window.innerWidth - 10) left = window.innerWidth - rect.width - 10
    if (top + rect.height > window.innerHeight - 10) top = window.innerHeight - rect.height - 10
    if (left < 10) left = 10
    if (top < 10) top = 10
    setPos({ left, top })
  }, [x, y])

  // Click-outside handler
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  if (!sym) return null

  const ltp = sym.ltp || 0
  const open = sym.open || ltp
  const high = sym.high || ltp
  const low = sym.low || ltp
  const close = sym.close || ltp // prev close

  // Mock last day & weekly OHLC (in production would come from server)
  const lastDay = {
    open: (close * (1 + (Math.random() * 0.005 - 0.0025))).toFixed(2),
    high: (close * (1 + Math.random() * 0.012)).toFixed(2),
    low: (close * (1 - Math.random() * 0.012)).toFixed(2),
    close: close.toFixed(2),
  }
  const weekly = {
    open: (close * (1 - Math.random() * 0.02)).toFixed(2),
    high: (high * (1 + Math.random() * 0.015)).toFixed(2),
    low: (low * (1 - Math.random() * 0.015)).toFixed(2),
    close: ltp.toFixed(2),
  }

  // Pivot Points (based on last day's OHLC)
  const pivots = calcPivots(parseFloat(lastDay.high), parseFloat(lastDay.low), parseFloat(lastDay.close))

  // VWAP (approximate)
  const vwap = sym.atp || ((high + low + ltp) / 3)

  const Row = ({ label, value, color, bold }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
      <span style={{ color: '#7a7a8c', fontSize: 9 }}>{label}</span>
      <span style={{ color: color || '#d0d0d8', fontSize: 9, fontWeight: bold ? 700 : 500, fontFamily: 'var(--grid-font)' }}>{value}</span>
    </div>
  )

  const Section = ({ title, color, children }) => (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 8, fontWeight: 700, color: color || 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, borderBottom: `1px solid ${color || 'var(--accent)'}30`, paddingBottom: 2, marginBottom: 3 }}>
        {title}
      </div>
      {children}
    </div>
  )

  const OHLCBar = ({ o, h, l, c, label }) => {
    const range = parseFloat(h) - parseFloat(l)
    const isGreen = parseFloat(c) >= parseFloat(o)
    return (
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 8, color: '#5a5a6a', marginBottom: 2 }}>{label}</div>
        <div style={{ display: 'flex', gap: 8, fontSize: 9, fontFamily: 'var(--grid-font)' }}>
          <span>O:<b style={{ color: '#d0d0d8' }}>{o}</b></span>
          <span>H:<b style={{ color: '#22c55e' }}>{h}</b></span>
          <span>L:<b style={{ color: '#ef4444' }}>{l}</b></span>
          <span>C:<b style={{ color: isGreen ? '#22c55e' : '#ef4444' }}>{c}</b></span>
        </div>
        <div style={{ height: 4, background: '#1a1a2e', marginTop: 2, position: 'relative', borderRadius: 2 }}>
          {range > 0 && (
            <div style={{
              position: 'absolute',
              left: `${((Math.min(parseFloat(o), parseFloat(c)) - parseFloat(l)) / range) * 100}%`,
              width: `${(Math.abs(parseFloat(c) - parseFloat(o)) / range) * 100}%`,
              height: '100%', background: isGreen ? '#22c55e' : '#ef4444', borderRadius: 2, minWidth: 2,
            }} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} style={{
      position: 'fixed', left: pos.left, top: pos.top, zIndex: 99999,
      width: 280, background: '#12121f', border: '1px solid #3a3a5a',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 1px rgba(0,188,212,0.3)',
      padding: '8px 10px', fontFamily: 'var(--font-ui, Inter, sans-serif)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-bright)' }}>{sym.symbol}</span>
          <span style={{ fontSize: 9, color: '#5a5a6a', marginLeft: 6 }}>{sym.exchange}</span>
          {sym.instrument && <span style={{ fontSize: 8, color: '#5a5a6a', marginLeft: 4 }}>{sym.instrument}</span>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#5a5a6a', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button>
      </div>

      {/* LTP Strip */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8, padding: '4px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid #2a2a44' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: sym.chg >= 0 ? '#22c55e' : '#ef4444', fontFamily: 'var(--grid-font)' }}>
          ₹{ltp.toFixed(2)}
        </span>
        <span style={{ fontSize: 10, color: sym.chg >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
          {sym.chg >= 0 ? '+' : ''}{sym.chg?.toFixed(2)} ({sym.chgP >= 0 ? '+' : ''}{sym.chgP?.toFixed(2)}%)
        </span>
      </div>

      {/* Today's OHLC */}
      <Section title="Today's OHLC" color="#4dabf7">
        <OHLCBar o={open.toFixed(2)} h={high.toFixed(2)} l={low.toFixed(2)} c={ltp.toFixed(2)} label="Intraday" />
      </Section>

      {/* Last Day OHLC */}
      <Section title="Last Day OHLC" color="#a78bfa">
        <OHLCBar o={lastDay.open} h={lastDay.high} l={lastDay.low} c={lastDay.close} label="Previous Session" />
      </Section>

      {/* Weekly OHLC */}
      <Section title="Weekly OHLC" color="#f59e0b">
        <OHLCBar o={weekly.open} h={weekly.high} l={weekly.low} c={weekly.close} label="Current Week" />
      </Section>

      {/* Pivot Points */}
      <Section title="Pivot Points (Standard)" color="#22c55e">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px 8px' }}>
          <Row label="R3" value={pivots.r3.toFixed(2)} color="#ef4444" bold />
          <Row label="R2" value={pivots.r2.toFixed(2)} color="#ef4444" />
          <Row label="R1" value={pivots.r1.toFixed(2)} color="#ff6b6b" />
          <Row label="PP" value={pivots.pp.toFixed(2)} color="#fbbf24" bold />
          <Row label="S1" value={pivots.s1.toFixed(2)} color="#4ade80" />
          <Row label="S2" value={pivots.s2.toFixed(2)} color="#22c55e" />
          <Row label="S3" value={pivots.s3.toFixed(2)} color="#22c55e" bold />
          <Row label="VWAP" value={vwap.toFixed(2)} color="#a78bfa" bold />
          <div />
        </div>
      </Section>

      {/* Key Statistics */}
      <Section title="Key Statistics" color="#00bcd4">
        <Row label="Volume" value={sym.vol >= 100000 ? (sym.vol / 100000).toFixed(1) + 'L' : (sym.vol / 1000).toFixed(1) + 'K'} />
        {sym.oi > 0 && <Row label="Open Interest" value={(sym.oi / 100000).toFixed(1) + 'L'} color="#eab308" />}
        {sym.oiChg !== 0 && <Row label="OI Change" value={(sym.oiChg > 0 ? '+' : '') + (sym.oiChg / 100000).toFixed(1) + 'L'} color={sym.oiChg > 0 ? '#22c55e' : '#ef4444'} />}
        <Row label="ATP / VWAP" value={'₹' + vwap.toFixed(2)} color="#a78bfa" />
        <Row label="Bid / Ask" value={`₹${sym.bid?.toFixed(2)} / ₹${sym.ask?.toFixed(2)}`} />
        <Row label="52W High" value={sym.w52High > 0 ? '₹' + sym.w52High.toFixed(2) : '—'} color="#22c55e" />
        <Row label="52W Low" value={sym.w52Low > 0 ? '₹' + sym.w52Low.toFixed(2) : '—'} color="#ef4444" />
        <Row label="Upper Circuit" value={sym.upperCkt > 0 ? '₹' + sym.upperCkt.toFixed(2) : '—'} />
        <Row label="Lower Circuit" value={sym.lowerCkt > 0 ? '₹' + sym.lowerCkt.toFixed(2) : '—'} />
        {sym.lotSize > 1 && <Row label="Lot Size" value={sym.lotSize.toLocaleString()} />}
        {sym.expiry && <Row label="Expiry" value={sym.expiry} color="#eab308" />}
        {sym.strikePrice && <Row label="Strike" value={sym.strikePrice + ' ' + (sym.optionType || '')} color={sym.optionType === 'CE' ? '#4dabf7' : '#ff6b6b'} />}
        <Row label="Turnover" value={sym.turnover >= 100000 ? '₹' + (sym.turnover / 100000).toFixed(1) + 'L' : '₹' + (sym.turnover / 1000).toFixed(1) + 'K'} />
      </Section>

      {/* Footer */}
      <div style={{ fontSize: 7, color: '#3a3a5a', textAlign: 'center', borderTop: '1px solid #2a2a44', paddingTop: 3 }}>
        Data as of {new Date().toLocaleTimeString('en-IN', { hour12: false })} • Pivot values are indicative
      </div>
    </div>
  )
}
