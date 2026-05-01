import { useState } from 'react'
import useAppStore from '../stores/useAppStore'
import InlineSettings, { SField, SSel, SChk, GearBtn } from '../components/InlineSettings'

const STRIKES = [
  { strike: 23800, cLtp: 450.00, cChg: 22.50, cIv: 17.8, cDelta: 0.85, cGamma: 0.003, cTheta: -8.50, cVega: 12.20, cRho: 0.15, cOi: 4500000, cOiChg: 210000, cVol: 12000, cBid: 448.50, cAsk: 451.50, pLtp: 5.00, pChg: -1.50, pIv: 19.2, pDelta: -0.15, pGamma: 0.003, pTheta: -2.10, pVega: 3.50, pRho: -0.02, pOi: 900000, pOiChg: -50000, pVol: 2000, pBid: 4.50, pAsk: 5.50 },
  { strike: 23900, cLtp: 358.00, cChg: 18.00, cIv: 17.2, cDelta: 0.78, cGamma: 0.005, cTheta: -9.20, cVega: 14.50, cRho: 0.13, cOi: 3800000, cOiChg: 350000, cVol: 9500, cBid: 356.50, cAsk: 359.50, pLtp: 12.00, pChg: -3.25, pIv: 18.5, pDelta: -0.22, pGamma: 0.005, pTheta: -3.80, pVega: 5.20, pRho: -0.04, pOi: 1200000, pOiChg: -120000, pVol: 3500, pBid: 11.50, pAsk: 12.50 },
  { strike: 24000, cLtp: 272.00, cChg: 14.50, cIv: 16.5, cDelta: 0.70, cGamma: 0.008, cTheta: -10.50, cVega: 16.80, cRho: 0.11, cOi: 5200000, cOiChg: 520000, cVol: 15000, cBid: 270.50, cAsk: 273.50, pLtp: 25.50, pChg: -5.80, pIv: 17.8, pDelta: -0.30, pGamma: 0.008, pTheta: -5.50, pVega: 8.40, pRho: -0.06, pOi: 2800000, pOiChg: -210000, pVol: 6200, pBid: 25.00, pAsk: 26.00 },
  { strike: 24100, cLtp: 205.00, cChg: 12.75, cIv: 15.8, cDelta: 0.62, cGamma: 0.012, cTheta: -12.00, cVega: 18.50, cRho: 0.09, cOi: 3560000, cOiChg: 180000, cVol: 8500, cBid: 204.00, cAsk: 206.00, pLtp: 42.00, pChg: -8.50, pIv: 17.0, pDelta: -0.38, pGamma: 0.012, pTheta: -7.20, pVega: 10.50, pRho: -0.08, pOi: 3500000, pOiChg: 280000, pVol: 7800, pBid: 41.50, pAsk: 42.50 },
  { strike: 24200, cLtp: 142.00, cChg: 8.50, cIv: 15.2, cDelta: 0.55, cGamma: 0.015, cTheta: -13.50, cVega: 20.00, cRho: 0.07, cOi: 5210000, cOiChg: 980000, cVol: 18500, cBid: 141.50, cAsk: 142.50, pLtp: 58.00, pChg: -12.25, pIv: 16.5, pDelta: -0.45, pGamma: 0.015, pTheta: -9.80, pVega: 14.20, pRho: -0.10, pOi: 3820000, pOiChg: -520000, pVol: 12500, pBid: 57.50, pAsk: 58.50, atm: true },
  { strike: 24300, cLtp: 92.50, cChg: 5.25, cIv: 14.8, cDelta: 0.42, cGamma: 0.014, cTheta: -11.80, cVega: 18.80, cRho: 0.05, cOi: 4800000, cOiChg: 650000, cVol: 15200, cBid: 92.00, cAsk: 93.00, pLtp: 98.50, pChg: -15.00, pIv: 16.0, pDelta: -0.58, pGamma: 0.014, pTheta: -11.20, pVega: 16.50, pRho: -0.12, pOi: 4200000, pOiChg: -410000, pVol: 14000, pBid: 98.00, pAsk: 99.00 },
  { strike: 24400, cLtp: 28.00, cChg: 2.50, cIv: 14.2, cDelta: 0.18, cGamma: 0.010, cTheta: -6.50, cVega: 11.20, cRho: 0.02, cOi: 5500000, cOiChg: 420000, cVol: 22000, cBid: 27.75, cAsk: 28.25, pLtp: 165.00, pChg: -18.75, pIv: 15.5, pDelta: -0.72, pGamma: 0.010, pTheta: -13.50, pVega: 18.00, pRho: -0.15, pOi: 2100000, pOiChg: -280000, pVol: 8500, pBid: 164.50, pAsk: 165.50 },
  { strike: 24500, cLtp: 12.50, cChg: 1.00, cIv: 13.8, cDelta: 0.10, cGamma: 0.006, cTheta: -3.80, cVega: 6.50, cRho: 0.01, cOi: 4200000, cOiChg: 280000, cVol: 14000, cBid: 12.25, cAsk: 12.75, pLtp: 240.00, pChg: -22.00, pIv: 15.2, pDelta: -0.82, pGamma: 0.006, pTheta: -15.80, pVega: 20.50, pRho: -0.18, pOi: 1800000, pOiChg: -150000, pVol: 5200, pBid: 239.50, pAsk: 240.50 },
  { strike: 24600, cLtp: 5.00, cChg: 0.50, cIv: 13.5, cDelta: 0.05, cGamma: 0.003, cTheta: -1.80, cVega: 3.20, cRho: 0.00, cOi: 3200000, cOiChg: 150000, cVol: 8000, cBid: 4.75, cAsk: 5.25, pLtp: 320.00, pChg: -25.50, pIv: 14.8, pDelta: -0.90, pGamma: 0.003, pTheta: -18.50, pVega: 22.00, pRho: -0.22, pOi: 1200000, pOiChg: -80000, pVol: 3000, pBid: 319.50, pAsk: 320.50 },
]

const fmtOi = (n) => (n / 100000).toFixed(1) + 'L'
const fmtOiChg = (n) => { const v = (n / 100000).toFixed(1); return n > 0 ? '+' + v + 'L' : v + 'L' }
const fmtVol = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n

// Buildup logic: OI↑ + Price↑ = Long Building, OI↑ + Price↓ = Short Building, OI↓ + Price↑ = Short Covering, OI↓ + Price↓ = Long Unwinding
const getBuildup = (oiChg, priceChg) => {
  if (oiChg > 0 && priceChg > 0) return { label: 'Long Build', color: '#22c55e' }
  if (oiChg > 0 && priceChg <= 0) return { label: 'Short Build', color: '#ef4444' }
  if (oiChg <= 0 && priceChg > 0) return { label: 'Sht Cover', color: '#4dabf7' }
  return { label: 'Long Unwind', color: '#eab308' }
}

export default function OptionChain() {
  const [expiry, setExpiry] = useState('24-APR-2026')
  const openWindow = useAppStore(s => s.openWindow)
  const [showSettings, setShowSettings] = useState(false)
  const [viewMode, setViewMode] = useState('standard') // 'standard' | 'greeks'
  const [ocSettings, setOcSettings] = useState({
    showGreeks: true, showBuildup: true, showBidAsk: true, clickToTrade: true, highlightATM: true, strikeInterval: '100', showIV: true
  })
  const setOc = (k, v) => setOcSettings(p => ({ ...p, [k]: v }))

  const onClickLtp = (strike, type) => {
    openWindow({ id: type === 'CE' ? 'buy' : 'sell', title: `${type === 'CE' ? 'Buy' : 'Sell'} Order [${type === 'CE' ? 'F1' : 'F2'}]`, x: 50, y: 20, w: 380, h: 580 })
  }

  const totalCeOi = STRIKES.reduce((a, s) => a + s.cOi, 0)
  const totalPeOi = STRIKES.reduce((a, s) => a + s.pOi, 0)
  const pcr = (totalPeOi / totalCeOi).toFixed(2)

  // Build header columns based on view mode
  const showGreeks = viewMode === 'greeks' || ocSettings.showGreeks
  const showBidAsk = ocSettings.showBidAsk
  const showBuildup = ocSettings.showBuildup

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
        background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', fontSize: 10, flexWrap: 'wrap'
      }}>
        <span style={{ fontWeight: 700, color: 'var(--text-bright)', fontSize: 12 }}>NIFTY</span>
        <span style={{ color: 'var(--accent)' }}>Spot: <b>24,250.50</b></span>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <span style={{ color: '#7a7a8c' }}>Expiry:</span>
        <select style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: 10, height: 18 }}
          value={expiry} onChange={e => setExpiry(e.target.value)}>
          <option>24-APR-2026</option><option>01-MAY-2026</option><option>29-MAY-2026</option><option>26-JUN-2026</option>
        </select>
        <div style={{ display: 'flex', gap: 3, marginLeft: 4 }}>
          <button onClick={() => setViewMode('standard')} style={{
            padding: '1px 6px', fontSize: 8, border: '1px solid var(--border)', cursor: 'pointer',
            background: viewMode === 'standard' ? 'var(--accent)' : 'transparent', color: viewMode === 'standard' ? '#000' : '#d0d0d8', fontWeight: 600
          }}>OI View</button>
          <button onClick={() => setViewMode('greeks')} style={{
            padding: '1px 6px', fontSize: 8, border: '1px solid var(--border)', cursor: 'pointer',
            background: viewMode === 'greeks' ? 'var(--accent)' : 'transparent', color: viewMode === 'greeks' ? '#000' : '#d0d0d8', fontWeight: 600
          }}>Greek View</button>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 9, color: '#7a7a8c' }}>PCR: <b style={{ color: 'var(--accent)' }}>{pcr}</b></span>
        <span style={{ fontSize: 9, color: '#7a7a8c' }}>Max Pain: <b style={{ color: '#eab308' }}>24200</b></span>
        <GearBtn onClick={() => setShowSettings(s => !s)} />
      </div>

      {/* OC Settings */}
      <InlineSettings show={showSettings} onClose={() => setShowSettings(false)} title="Option Chain Settings">
        <SChk checked={ocSettings.showGreeks} label="Show Greeks (Δ Γ Θ ν)" onChange={v => setOc('showGreeks', v)} />
        <SChk checked={ocSettings.showBidAsk} label="Show Bid/Ask" onChange={v => setOc('showBidAsk', v)} />
        <SChk checked={ocSettings.showBuildup} label="Show Buildup" onChange={v => setOc('showBuildup', v)} />
        <SChk checked={ocSettings.clickToTrade} label="Click-to-Trade" onChange={v => setOc('clickToTrade', v)} />
        <SChk checked={ocSettings.highlightATM} label="Highlight ATM" onChange={v => setOc('highlightATM', v)} />
        <SField label="Strike Gap"><SSel value={ocSettings.strikeInterval} options={['50','100','200','500']} onChange={v => setOc('strikeInterval', v)} /></SField>
        <SChk checked={ocSettings.showIV} label="Show IV" onChange={v => setOc('showIV', v)} />
      </InlineSettings>

      {/* Grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--grid-font)', fontSize: 10 }}>
          <thead>
            <tr>
              <th colSpan={showBuildup ? 1 : 0} style={{ display: showBuildup ? '' : 'none' }}></th>
              <th colSpan={
                3 + (showBidAsk ? 2 : 0) + (showGreeks ? 4 : 1) + 1
              } style={{ textAlign: 'center', padding: '3px', background: 'rgba(21,101,192,0.15)', color: '#4dabf7', fontSize: 9, borderBottom: '1px solid var(--border)' }}>CALLS</th>
              <th style={{ textAlign: 'center', padding: '3px', background: 'var(--bg-surface)', color: 'var(--text-bright)', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>STRIKE</th>
              <th colSpan={
                3 + (showBidAsk ? 2 : 0) + (showGreeks ? 4 : 1) + 1
              } style={{ textAlign: 'center', padding: '3px', background: 'rgba(198,40,40,0.15)', color: '#ff6b6b', fontSize: 9, borderBottom: '1px solid var(--border)' }}>PUTS</th>
              <th colSpan={showBuildup ? 1 : 0} style={{ display: showBuildup ? '' : 'none' }}></th>
            </tr>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {showBuildup && <th style={thStyle}>Buildup</th>}
              <th style={thStyle}>OI</th>
              <th style={thStyle}>OI Chg</th>
              <th style={thStyle}>Vol</th>
              {showBidAsk && <><th style={thStyle}>Bid</th><th style={thStyle}>Ask</th></>}
              <th style={{ ...thStyle, color: '#4dabf7' }}>LTP</th>
              <th style={thStyle}>Chg</th>
              <th style={thStyle}>IV</th>
              <th style={thStyle}>Δ</th>
              {showGreeks && <><th style={thStyle}>Γ</th><th style={thStyle}>Θ</th><th style={thStyle}>ν</th></>}
              <th style={{ ...thStyle, textAlign: 'center', background: 'var(--bg-surface)', fontWeight: 700, fontSize: 10 }}></th>
              {showGreeks && <><th style={thStyle}>ν</th><th style={thStyle}>Θ</th><th style={thStyle}>Γ</th></>}
              <th style={thStyle}>Δ</th>
              <th style={thStyle}>IV</th>
              <th style={thStyle}>Chg</th>
              <th style={{ ...thStyle, color: '#ff6b6b' }}>LTP</th>
              {showBidAsk && <><th style={thStyle}>Bid</th><th style={thStyle}>Ask</th></>}
              <th style={thStyle}>Vol</th>
              <th style={thStyle}>OI Chg</th>
              <th style={thStyle}>OI</th>
              {showBuildup && <th style={thStyle}>Buildup</th>}
            </tr>
          </thead>
          <tbody>
            {STRIKES.map(s => {
              const cBuildup = getBuildup(s.cOiChg, s.cChg)
              const pBuildup = getBuildup(s.pOiChg, s.pChg)
              return (
                <tr key={s.strike} style={s.atm ? { background: 'rgba(0,188,212,0.08)' } : {}}>
                  {showBuildup && <td style={{ ...tdStyle, fontSize: 8, color: cBuildup.color, whiteSpace: 'nowrap' }}>{cBuildup.label}</td>}
                  <td style={tdStyle}>{fmtOi(s.cOi)}</td>
                  <td style={{ ...tdStyle, color: s.cOiChg >= 0 ? '#22c55e' : '#ef4444', fontSize: 9 }}>{fmtOiChg(s.cOiChg)}</td>
                  <td style={tdStyle}>{fmtVol(s.cVol)}</td>
                  {showBidAsk && <><td style={{ ...tdStyle, color: '#4dabf7' }}>{s.cBid.toFixed(2)}</td><td style={{ ...tdStyle, color: '#ff6b6b' }}>{s.cAsk.toFixed(2)}</td></>}
                  <td style={{ ...tdStyle, color: '#4dabf7', fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => onClickLtp(s.strike, 'CE')}>{s.cLtp.toFixed(2)}</td>
                  <td style={{ ...tdStyle, color: s.cChg >= 0 ? '#22c55e' : '#ef4444' }}>
                    {s.cChg >= 0 ? '+' : ''}{s.cChg.toFixed(2)}</td>
                  <td style={tdStyle}>{s.cIv.toFixed(1)}</td>
                  <td style={tdStyle}>{s.cDelta.toFixed(2)}</td>
                  {showGreeks && <>
                    <td style={{ ...tdStyle, fontSize: 9 }}>{s.cGamma.toFixed(3)}</td>
                    <td style={{ ...tdStyle, fontSize: 9, color: '#ef4444' }}>{s.cTheta.toFixed(1)}</td>
                    <td style={{ ...tdStyle, fontSize: 9 }}>{s.cVega.toFixed(1)}</td>
                  </>}
                  <td style={{
                    textAlign: 'center', padding: '2px 6px', fontWeight: 700, fontSize: 11,
                    background: s.atm ? 'rgba(0,188,212,0.15)' : 'var(--bg-surface)',
                    color: s.atm ? 'var(--accent)' : 'var(--text-bright)',
                    borderLeft: '2px solid var(--border)', borderRight: '2px solid var(--border)',
                    height: 22
                  }}>
                    {s.atm ? `●${s.strike}●` : s.strike}
                  </td>
                  {showGreeks && <>
                    <td style={{ ...tdStyle, fontSize: 9 }}>{s.pVega.toFixed(1)}</td>
                    <td style={{ ...tdStyle, fontSize: 9, color: '#ef4444' }}>{s.pTheta.toFixed(1)}</td>
                    <td style={{ ...tdStyle, fontSize: 9 }}>{s.pGamma.toFixed(3)}</td>
                  </>}
                  <td style={tdStyle}>{s.pDelta.toFixed(2)}</td>
                  <td style={tdStyle}>{s.pIv.toFixed(1)}</td>
                  <td style={{ ...tdStyle, color: s.pChg >= 0 ? '#22c55e' : '#ef4444' }}>
                    {s.pChg >= 0 ? '+' : ''}{s.pChg.toFixed(2)}</td>
                  <td style={{ ...tdStyle, color: '#ff6b6b', fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => onClickLtp(s.strike, 'PE')}>{s.pLtp.toFixed(2)}</td>
                  {showBidAsk && <><td style={{ ...tdStyle, color: '#4dabf7' }}>{s.pBid.toFixed(2)}</td><td style={{ ...tdStyle, color: '#ff6b6b' }}>{s.pAsk.toFixed(2)}</td></>}
                  <td style={tdStyle}>{fmtVol(s.pVol)}</td>
                  <td style={{ ...tdStyle, color: s.pOiChg >= 0 ? '#22c55e' : '#ef4444', fontSize: 9 }}>{fmtOiChg(s.pOiChg)}</td>
                  <td style={tdStyle}>{fmtOi(s.pOi)}</td>
                  {showBuildup && <td style={{ ...tdStyle, fontSize: 8, color: pBuildup.color, whiteSpace: 'nowrap' }}>{pBuildup.label}</td>}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', flexWrap: 'wrap',
        background: 'rgba(0,0,0,0.15)', borderTop: '1px solid var(--border)', fontSize: 9
      }}>
        <span style={{ color: '#7a7a8c' }}>Total CE OI: <b style={{ color: '#4dabf7' }}>{(totalCeOi/10000000).toFixed(1)}Cr</b></span>
        <span style={{ color: '#7a7a8c' }}>Total PE OI: <b style={{ color: '#ff6b6b' }}>{(totalPeOi/10000000).toFixed(1)}Cr</b></span>
        <span style={{ color: '#7a7a8c' }}>PCR: <b style={{ color: 'var(--accent)' }}>{pcr}</b></span>
        <span style={{ color: '#7a7a8c' }}>Max Pain: <b style={{ color: '#eab308' }}>24200</b></span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <button onClick={() => { const strikes = STRIKES.filter(s => Math.abs(s.strike - 24200) <= 300).map(s => `${s.strike}CE, ${s.strike}PE`).join(', '); alert(`Loaded to Market Watch:\n${strikes}\n\n${STRIKES.filter(s => Math.abs(s.strike - 24200) <= 300).length * 2} contracts added to current portfolio`) }} style={{ padding: '1px 8px', fontSize: 8, background: 'var(--accent)', color: '#000', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Load to MW</button>
          <button onClick={() => openWindow({ id: 'buy', title: 'Buy Order [F1]', x: 50, y: 20, w: 380, h: 580 })} style={{ padding: '1px 8px', fontSize: 8, background: '#1565C0', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Buy</button>
          <button onClick={() => openWindow({ id: 'sell', title: 'Sell Order [F2]', x: 440, y: 20, w: 380, h: 580 })} style={{ padding: '1px 8px', fontSize: 8, background: '#C62828', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Sell</button>
        </div>
      </div>
    </div>
  )
}

const thStyle = { textAlign: 'right', padding: '2px 5px', color: '#6a6a7a', fontSize: 8, fontWeight: 500, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }
const tdStyle = { textAlign: 'right', padding: '2px 5px', height: 22, borderBottom: '1px solid rgba(42,42,68,0.3)', color: '#d0d0d8' }
