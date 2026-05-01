import { useState, useEffect } from 'react'

const LS_KEY = 'lightz-exch-settings'

const EXCHANGES = [
  { key: 'nse', label: 'NSE', segments: ['FO', 'CM', 'CD'] },
  { key: 'bse', label: 'BSE', segments: ['FO', 'CM'] },
  { key: 'mcx', label: 'MCX', segments: ['COM'] },
]

const DEF_SEG = {
  enabled: true,
  orderTypes: { MKT: true, LMT: true, SL: true, 'SL-M': true },
  products: { MIS: true, NRML: true, CNC: true },
  maxQtyPerOrder: '5000', freezeQty: '1800', maxOrdersDay: '500',
  priceBand: '20', circuitWarn: '18', dpr: '20',
  marketOpen: '09:15', preOpen: '09:00', normalClose: '15:30', postClose: '16:00', sqOffTime: '15:20',
  misMultiplier: '5', exposureMargin: '10', spanMargin: true
}

const mkDefault = () => {
  const d = {}
  EXCHANGES.forEach(ex => {
    d[ex.key] = {}
    ex.segments.forEach(seg => {
      d[ex.key][seg] = { ...DEF_SEG, orderTypes: { ...DEF_SEG.orderTypes }, products: { ...DEF_SEG.products } }
      if (seg === 'FO') { d[ex.key][seg].freezeQty = ex.key === 'nse' ? '1800' : '1500' }
      if (seg === 'CM') { d[ex.key][seg].products.NRML = false; d[ex.key][seg].freezeQty = '500000' }
      if (seg === 'COM') { d[ex.key][seg].products.CNC = false; d[ex.key][seg].freezeQty = '100' }
    })
  })
  return d
}

const Sec = ({ children }) => <div style={{ fontSize: 10, color: '#6a6a7a', padding: '6px 0 4px', borderBottom: '1px solid rgba(42,42,68,0.5)', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>── {children} ──</div>

export default function ExchangeSegmentSettings() {
  const [exchTab, setExchTab] = useState('nse')
  const [segTab, setSegTab] = useState('FO')
  const [data, setData] = useState(mkDefault)

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(LS_KEY)); if (s) setData(s) } catch {}
  }, [])

  const seg = data[exchTab]?.[segTab] || DEF_SEG
  const setSeg = (k, v) => setData(prev => ({
    ...prev, [exchTab]: { ...prev[exchTab], [segTab]: { ...prev[exchTab][segTab], [k]: v } }
  }))
  const toggleOT = (ot) => setSeg('orderTypes', { ...seg.orderTypes, [ot]: !seg.orderTypes[ot] })
  const toggleProd = (p) => setSeg('products', { ...seg.products, [p]: !seg.products[p] })
  const save = () => { localStorage.setItem(LS_KEY, JSON.stringify(data)); alert('Exchange settings saved!') }

  const exch = EXCHANGES.find(e => e.key === exchTab)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)' }}>
      {/* Header */}
      <div style={{ padding: '6px 12px', background: 'var(--bg-surface)', borderBottom: '2px solid #eab308', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: '#eab308' }}>⚙ Exchange & Segment Order Settings</span>
        <span style={{ marginLeft: 'auto', fontSize: 9, color: '#7a7a8c' }}>Per-exchange, per-segment compliance config</span>
      </div>

      {/* Exchange Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
        {EXCHANGES.map(e => (
          <button key={e.key} onClick={() => { setExchTab(e.key); setSegTab(e.segments[0]) }} style={{
            flex: 1, padding: '6px', fontSize: 11, border: 'none', cursor: 'pointer', fontWeight: 700,
            background: exchTab === e.key ? 'var(--bg-row-selected)' : 'var(--bg-surface)',
            color: exchTab === e.key ? 'var(--accent)' : '#7a7a8c',
            borderBottom: exchTab === e.key ? '2px solid var(--accent)' : '2px solid transparent'
          }}>{e.label}</button>
        ))}
      </div>

      {/* Segment Tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '0 12px', background: 'rgba(0,0,0,0.1)' }}>
        {exch.segments.map(s => (
          <button key={s} onClick={() => setSegTab(s)} style={{
            padding: '4px 14px', fontSize: 10, border: 'none', cursor: 'pointer',
            background: segTab === s ? 'var(--bg-panel)' : 'transparent',
            color: segTab === s ? '#d0d0d8' : '#6a6a7a', fontWeight: segTab === s ? 600 : 400,
            borderTop: segTab === s ? '2px solid var(--accent)' : '2px solid transparent'
          }}>{s === 'FO' ? 'Futures & Options' : s === 'CM' ? 'Cash / Equity' : s === 'CD' ? 'Currency' : 'Commodity'}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
        {/* Enable Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', marginBottom: 6 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={seg.enabled} onChange={e => setSeg('enabled', e.target.checked)} style={{ accentColor: '#00bcd4', width: 14, height: 14 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: seg.enabled ? '#22c55e' : '#ef4444' }}>
              {seg.enabled ? '✓ ENABLED' : '✗ DISABLED'} — {exch.label} {segTab}
            </span>
          </label>
        </div>

        {/* Allowed Order Types */}
        <Sec>Allowed Order Types</Sec>
        <div style={{ display: 'flex', gap: 16, padding: '4px 0', flexWrap: 'wrap' }}>
          {['MKT', 'LMT', 'SL', 'SL-M'].map(ot => (
            <label key={ot} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#d0d0d8', cursor: 'pointer' }}>
              <input type="checkbox" checked={seg.orderTypes[ot]} onChange={() => toggleOT(ot)} style={{ accentColor: '#00bcd4' }} />
              {ot}
            </label>
          ))}
        </div>

        {/* Allowed Product Types */}
        <Sec>Allowed Product Types</Sec>
        <div style={{ display: 'flex', gap: 16, padding: '4px 0', flexWrap: 'wrap' }}>
          {['MIS', 'NRML', 'CNC'].map(p => (
            <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#d0d0d8', cursor: 'pointer' }}>
              <input type="checkbox" checked={seg.products[p]} onChange={() => toggleProd(p)} style={{ accentColor: '#00bcd4' }} />
              {p} <span style={{ fontSize: 8, color: '#5a5a6a' }}>({p === 'MIS' ? 'Intraday' : p === 'NRML' ? 'Carry Forward' : 'Delivery'})</span>
            </label>
          ))}
        </div>

        {/* Quantity Limits */}
        <Sec>Quantity & Order Limits</Sec>
        <Row label="Max Qty per Order"><InpS value={seg.maxQtyPerOrder} onChange={v => setSeg('maxQtyPerOrder', v)} w={80} /></Row>
        <Row label="Freeze Qty (Exchange)"><InpS value={seg.freezeQty} onChange={v => setSeg('freezeQty', v)} w={80} /><span style={{ fontSize: 8, color: '#eab308', marginLeft: 6 }}>SEBI mandated</span></Row>
        <Row label="Max Orders / Day"><InpS value={seg.maxOrdersDay} onChange={v => setSeg('maxOrdersDay', v)} w={80} /></Row>

        {/* Price Band */}
        <Sec>Price Band & Circuit Limits</Sec>
        <Row label="Price Band %"><InpS value={seg.priceBand} onChange={v => setSeg('priceBand', v)} w={50} /><span style={{ fontSize: 9, color: '#7a7a8c' }}>%</span></Row>
        <Row label="Circuit Warning %"><InpS value={seg.circuitWarn} onChange={v => setSeg('circuitWarn', v)} w={50} /><span style={{ fontSize: 9, color: '#7a7a8c' }}>% (warn before reaching)</span></Row>
        <Row label="DPR (Daily Price Range)"><InpS value={seg.dpr} onChange={v => setSeg('dpr', v)} w={50} /><span style={{ fontSize: 9, color: '#7a7a8c' }}>%</span></Row>

        {/* Trading Hours */}
        <Sec>Trading Hours</Sec>
        <Row label="Pre-Open"><InpS value={seg.preOpen} onChange={v => setSeg('preOpen', v)} w={60} /></Row>
        <Row label="Market Open"><InpS value={seg.marketOpen} onChange={v => setSeg('marketOpen', v)} w={60} /></Row>
        <Row label="Normal Close"><InpS value={seg.normalClose} onChange={v => setSeg('normalClose', v)} w={60} /></Row>
        <Row label="Post-Close"><InpS value={seg.postClose} onChange={v => setSeg('postClose', v)} w={60} /></Row>
        <Row label="MIS Square-Off"><InpS value={seg.sqOffTime} onChange={v => setSeg('sqOffTime', v)} w={60} /><span style={{ fontSize: 8, color: '#ef4444' }}>⚠ Auto square-off</span></Row>

        {/* Margin */}
        <Sec>Margin Rules</Sec>
        <Row label="MIS Multiplier"><InpS value={seg.misMultiplier} onChange={v => setSeg('misMultiplier', v)} w={40} /><span style={{ fontSize: 9, color: '#7a7a8c' }}>× leverage</span></Row>
        <Row label="Exposure Margin %"><InpS value={seg.exposureMargin} onChange={v => setSeg('exposureMargin', v)} w={50} /></Row>
        <Row label="SPAN Margin">
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#d0d0d8', cursor: 'pointer' }}>
            <input type="checkbox" checked={seg.spanMargin} onChange={e => setSeg('spanMargin', e.target.checked)} style={{ accentColor: '#00bcd4' }} />Show SPAN margin
          </label>
        </Row>

        {/* SEBI Compliance */}
        <Sec>🛡 SEBI Compliance Panel</Sec>
        <div style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)', padding: '8px 12px', fontSize: 10 }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div><span style={{ color: '#7a7a8c' }}>Max Orders/Sec:</span> <b style={{ color: '#ef4444' }}>&lt;10 OPS</b></div>
            <div><span style={{ color: '#7a7a8c' }}>Algo ID Tagging:</span> <b style={{ color: '#22c55e' }}>Required</b></div>
            <div><span style={{ color: '#7a7a8c' }}>Algo Order Type:</span> <b style={{ color: '#eab308' }}>LIMIT only</b></div>
            <div><span style={{ color: '#7a7a8c' }}>Bid ≈ Buy:</span> <b style={{ color: '#22c55e' }}>Enforced</b></div>
          </div>
          <div style={{ marginTop: 6, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div><span style={{ color: '#7a7a8c' }}>Audit Trail:</span> <b style={{ color: '#22c55e' }}>SEBI 5-yr retention</b></div>
            <div><span style={{ color: '#7a7a8c' }}>Risk Check:</span> <b style={{ color: '#22c55e' }}>Pre-trade validation</b></div>
            <div><span style={{ color: '#7a7a8c' }}>Kill Switch:</span> <b style={{ color: '#ef4444' }}>Available</b></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', gap: 6, padding: '6px 16px', borderTop: '1px solid var(--border)', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.1)' }}>
        <button onClick={save} style={{ height: 24, padding: '0 16px', background: '#22c55e', color: '#000', border: 'none', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>💾 Save</button>
        <button style={{ height: 24, padding: '0 14px', background: '#2a2a44', color: '#d0d0d8', border: '1px solid #3a3a5a', fontSize: 10, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
      <span style={{ width: 140, fontSize: 10, color: '#9aa0b0', textAlign: 'right', paddingRight: 10, flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{children}</div>
    </div>
  )
}

function InpS({ value, onChange, w = 120 }) {
  return <input style={{ height: 20, width: w, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8', padding: '0 6px', fontSize: 10, fontFamily: 'var(--grid-font)', outline: 'none' }}
    value={value} onChange={e => onChange(e.target.value)} />
}
