import { useState, useMemo } from 'react'
import useAppStore from '../stores/useAppStore'
import { exportGridCSV } from '../utils/gridUtils'
import ActionIcon from '../components/ActionIcons'

const SEGMENTS = {
  'Equity Delivery': { brokerage: 0.30, stt: 0.10, exchange: 0.00325, gst: 18, sebi: 0.0001, stamp: 0.015, dp: 15.93 },
  'Equity Intraday':  { brokerage: 0.03, stt: 0.025, exchange: 0.00325, gst: 18, sebi: 0.0001, stamp: 0.003, dp: 0 },
  'F&O Futures':      { brokerage: 0.03, stt: 0.0125, exchange: 0.002, gst: 18, sebi: 0.0001, stamp: 0.002, dp: 0 },
  'F&O Options':      { brokerage: 20, stt: 0.0625, exchange: 0.053, gst: 18, sebi: 0.0001, stamp: 0.003, dp: 0 },  // flat per lot
  'Currency':         { brokerage: 0.03, stt: 0, exchange: 0.001, gst: 18, sebi: 0.0001, stamp: 0.0001, dp: 0 },
  'Commodity':        { brokerage: 0.03, stt: 0.01, exchange: 0.003, gst: 18, sebi: 0.0001, stamp: 0.002, dp: 0 },
}



function calcCharges(trade) {
  const rates = SEGMENTS[trade.segment]
  if (!rates) return {}
  const tv = trade.turnover
  const isFlat = trade.segment === 'F&O Options'
  const brokerage = isFlat ? rates.brokerage : (tv * rates.brokerage / 100)
  const stt = tv * rates.stt / 100
  const exchTxn = tv * rates.exchange / 100
  const gst = (brokerage + exchTxn) * rates.gst / 100
  const sebi = tv * rates.sebi / 100
  const stamp = tv * rates.stamp / 100
  const dp = rates.dp
  const total = brokerage + stt + exchTxn + gst + sebi + stamp + dp
  return { brokerage, stt, exchTxn, gst, sebi, stamp, dp, total }
}

export default function ExpensesMaster() {
  const storeTrades = useAppStore(s => s.trades) || []
  const [tab, setTab] = useState('analysis')

  // Editable rates
  const [rates, setRates] = useState(SEGMENTS)
  const setRate = (seg, key, val) => setRates(prev => ({...prev, [seg]: {...prev[seg], [key]: parseFloat(val) || 0 }}))

  // Map live trades to expense format
  const liveTrades = storeTrades.map(t => {
    const isOpt = t.symbol?.includes('CE') || t.symbol?.includes('PE')
    const isFut = t.symbol?.includes('FUT')
    const segment = isOpt ? 'F&O Options' : isFut ? 'F&O Futures' : t.product === 'INTRADAY' ? 'Equity Intraday' : 'Equity Delivery'
    const turnover = (t.qty || 0) * (t.price || 0)
    return { symbol: t.symbol, segment, side: t.side, qty: t.qty || 0, price: t.price || 0, turnover }
  })

  // Calculate all
  const tradeCharges = liveTrades.map(t => ({ ...t, charges: calcCharges(t) }))
  const totalCharges = tradeCharges.reduce((sum, t) => sum + (t.charges.total || 0), 0)
  const totalTurnover = liveTrades.reduce((sum, t) => sum + t.turnover, 0)
  const totalBrokerage = tradeCharges.reduce((s, t) => s + (t.charges.brokerage || 0), 0)
  const totalSTT = tradeCharges.reduce((s, t) => s + (t.charges.stt || 0), 0)
  const totalGST = tradeCharges.reduce((s, t) => s + (t.charges.gst || 0), 0)
  const totalExch = tradeCharges.reduce((s, t) => s + (t.charges.exchTxn || 0), 0)
  const breakeven = totalCharges

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--accent)' }}>💰 Expenses</span>
        {['analysis', 'master'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '3px 12px', fontSize: 9, cursor: 'pointer', textTransform: 'uppercase',
            background: tab === t ? 'var(--accent)' : 'var(--bg-input)',
            color: tab === t ? '#000' : 'var(--text-secondary)',
            border: `1px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`,
            fontWeight: tab === t ? 700 : 400,
          }}>{t === 'analysis' ? '📊 Analysis' : '⚙ Rates Master'}</button>
        ))}
        <ActionIcon type="csv" tooltip="Export CSV" style={{ marginLeft: 'auto' }} onClick={() => exportGridCSV(tradeCharges.map(t => ({...t, brokerage: t.charges.brokerage?.toFixed(2), stt: t.charges.stt?.toFixed(2), gst: t.charges.gst?.toFixed(2), total_charges: t.charges.total?.toFixed(2)})), [{key:'symbol',label:'Symbol'},{key:'segment',label:'Segment'},{key:'side',label:'Side'},{key:'qty',label:'Qty'},{key:'price',label:'Price'},{key:'turnover',label:'Turnover'},{key:'brokerage',label:'Brokerage'},{key:'stt',label:'STT'},{key:'gst',label:'GST'},{key:'total_charges',label:'Total'}], 'Expenses')} />
      </div>

      {tab === 'analysis' ? (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'flex', gap: 6, padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>
            {[
              { label: 'Total Turnover', val: `₹${(totalTurnover/100000).toFixed(1)}L`, color: 'var(--text-primary)' },
              { label: 'Total Charges', val: `₹${totalCharges.toFixed(0)}`, color: '#ef4444' },
              { label: 'Brokerage', val: `₹${totalBrokerage.toFixed(0)}`, color: '#eab308' },
              { label: 'STT/CTT', val: `₹${totalSTT.toFixed(0)}`, color: '#f59e0b' },
              { label: 'GST', val: `₹${totalGST.toFixed(0)}`, color: '#c084fc' },
              { label: 'Break-Even', val: `₹${breakeven.toFixed(0)}`, color: '#22c55e' },
            ].map((c, i) => (
              <div key={i} style={{ flex: 1, padding: '5px 8px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: 7, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{c.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.color, fontFamily: 'var(--grid-font)' }}>{c.val}</div>
              </div>
            ))}
          </div>

          {/* Trade-by-trade breakdown */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--grid-font)', fontSize: 10 }}>
              <thead>
                <tr>
                  {['#','Symbol','Segment','Side','Qty','Price','Turnover','Brokerage','STT','Exchange','GST','SEBI','Stamp','DP','Total Charges'].map(h => (
                    <th key={h} style={{
                      textAlign: h === 'Symbol' || h === 'Segment' || h === 'Side' ? 'left' : 'right',
                      padding: '3px 5px', background: 'linear-gradient(180deg,#2a2a44,#1e1e38)',
                      border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 500, fontSize: 8,
                      position: 'sticky', top: 0, zIndex: 5, whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tradeCharges.map((t, i) => {
                  const c = t.charges
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(42,42,68,0.3)', background: i % 2 === 0 ? 'var(--bg-row-even)' : 'var(--bg-row-odd)' }}>
                      <td style={tdR}>{i + 1}</td>
                      <td style={{ ...tdR, textAlign: 'left', fontWeight: 600, color: 'var(--text-bright)' }}>{t.symbol}</td>
                      <td style={{ ...tdR, textAlign: 'left', fontSize: 8, color: 'var(--text-secondary)' }}>{t.segment}</td>
                      <td style={{ ...tdR, textAlign: 'left', fontWeight: 700, color: t.side === 'BUY' ? 'var(--buy)' : 'var(--sell)' }}>{t.side}</td>
                      <td style={tdR}>{t.qty}</td>
                      <td style={tdR}>{t.price.toFixed(2)}</td>
                      <td style={tdR}>₹{t.turnover.toLocaleString()}</td>
                      <td style={{ ...tdR, color: '#eab308' }}>{c.brokerage?.toFixed(2)}</td>
                      <td style={tdR}>{c.stt?.toFixed(2)}</td>
                      <td style={tdR}>{c.exchTxn?.toFixed(2)}</td>
                      <td style={{ ...tdR, color: '#c084fc' }}>{c.gst?.toFixed(2)}</td>
                      <td style={tdR}>{c.sebi?.toFixed(2)}</td>
                      <td style={tdR}>{c.stamp?.toFixed(2)}</td>
                      <td style={tdR}>{c.dp > 0 ? c.dp.toFixed(2) : '—'}</td>
                      <td style={{ ...tdR, fontWeight: 700, color: '#ef4444', fontSize: 11 }}>₹{c.total?.toFixed(2)}</td>
                    </tr>
                  )
                })}
                <tr style={{ background: 'rgba(0,188,212,0.06)', fontWeight: 700 }}>
                  <td colSpan={7} style={{ ...tdR, textAlign: 'right', color: 'var(--accent)' }}>TOTAL</td>
                  <td style={{ ...tdR, color: '#eab308' }}>₹{totalBrokerage.toFixed(0)}</td>
                  <td style={tdR}>₹{totalSTT.toFixed(0)}</td>
                  <td style={tdR}>₹{totalExch.toFixed(0)}</td>
                  <td style={{ ...tdR, color: '#c084fc' }}>₹{totalGST.toFixed(0)}</td>
                  <td colSpan={3} />
                  <td style={{ ...tdR, color: '#ef4444', fontSize: 12 }}>₹{totalCharges.toFixed(0)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Charge Distribution */}
          <div style={{ padding: '6px 10px', borderTop: '1px solid var(--border)', display: 'flex', gap: 4, fontSize: 9 }}>
            {[
              { label: 'Brokerage', pct: totalBrokerage / totalCharges * 100, color: '#eab308' },
              { label: 'STT', pct: totalSTT / totalCharges * 100, color: '#f59e0b' },
              { label: 'Exchange', pct: totalExch / totalCharges * 100, color: '#4dabf7' },
              { label: 'GST', pct: totalGST / totalCharges * 100, color: '#c084fc' },
            ].map((c, i) => (
              <div key={i} style={{ flex: c.pct, background: c.color, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: 7, minWidth: c.pct > 8 ? 'auto' : 0, overflow: 'hidden' }}>
                {c.pct > 10 && `${c.label} ${c.pct.toFixed(0)}%`}
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Rates Master Tab */
        <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Configure brokerage and regulatory charges per segment. Changes are applied to the Analysis tab instantly.
          </div>
          {Object.entries(rates).map(([seg, r]) => (
            <div key={seg} style={{ marginBottom: 12, padding: '8px 10px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>{seg}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {[
                  { key: 'brokerage', label: seg === 'F&O Options' ? 'Brokerage (₹/lot)' : 'Brokerage (%)', },
                  { key: 'stt', label: 'STT/CTT (%)' },
                  { key: 'exchange', label: 'Exchange Txn (%)' },
                  { key: 'gst', label: 'GST (%)' },
                  { key: 'sebi', label: 'SEBI (%)' },
                  { key: 'stamp', label: 'Stamp Duty (%)' },
                  { key: 'dp', label: 'DP Charges (₹)' },
                ].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: 8, color: 'var(--text-muted)', marginBottom: 2 }}>{f.label}</div>
                    <input value={r[f.key]} onChange={e => setRate(seg, f.key, e.target.value)}
                      style={{ width: '100%', height: 22, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0 6px', fontSize: 10, fontFamily: 'var(--grid-font)' }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
const tdR = { textAlign: 'right', padding: '2px 5px', height: 22, color: 'var(--text-primary)' }
