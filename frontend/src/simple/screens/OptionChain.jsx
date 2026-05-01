import { useState, useEffect } from 'react'
import useAppStore from '../stores/useAppStore'
import engineConnector from '../../services/engineConnector'
import InlineSettings, { SField, SSel, SChk, GearBtn } from '../components/InlineSettings'

const fmtOi = (n) => (n / 100000).toFixed(1) + 'L'
const fmtOiChg = (n) => { const v = (n / 100000).toFixed(1); return n > 0 ? '+' + v + 'L' : v + 'L' }
const fmtVol = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n

// Buildup logic
const getBuildup = (oiChg, priceChg) => {
  if (oiChg > 0 && priceChg > 0) return { label: 'Long Build', color: '#22c55e' }
  if (oiChg > 0 && priceChg <= 0) return { label: 'Short Build', color: '#ef4444' }
  if (oiChg <= 0 && priceChg > 0) return { label: 'Sht Cover', color: '#4dabf7' }
  return { label: 'Long Unwind', color: '#eab308' }
}

export default function OptionChain() {
  const openWindow = useAppStore(s => s.openWindow)
  const [expiry, setExpiry] = useState('')
  const [expiryList, setExpiryList] = useState([])
  const [chainData, setChainData] = useState([])
  const [loading, setLoading] = useState(true)
  const [strikesVisible, setStrikesVisible] = useState(20) // ±20 from ATM
  const [showSettings, setShowSettings] = useState(false)
  const [viewMode, setViewMode] = useState('standard')
  const [ocSettings, setOcSettings] = useState({
    showGreeks: true, showBuildup: true, showBidAsk: true, clickToTrade: true, highlightATM: true, strikeInterval: '100', showIV: true
  })
  const setOc = (k, v) => setOcSettings(p => ({ ...p, [k]: v }))

  // Load expiry list
  useEffect(() => {
    const loadExpiries = async () => {
      const data = await engineConnector.getExpiryList({ underlyingScrip: '13', underlyingSeg: 'IDX_I' })
      if (data && Array.isArray(data)) {
        setExpiryList(data)
        if (data.length > 0 && !expiry) setExpiry(data[0])
      } else {
        // Fallback
        const fallback = ['2026-05-01','2026-05-08','2026-05-15','2026-05-29','2026-06-26']
        setExpiryList(fallback)
        if (!expiry) setExpiry(fallback[0])
      }
    }
    loadExpiries()
  }, [])

  // Load option chain
  useEffect(() => {
    if (!expiry) return
    setLoading(true)
    const loadChain = async () => {
      const data = await engineConnector.getOptionChain({ underlyingScrip: '13', underlyingSeg: 'IDX_I', expiryDate: expiry })
      if (data && data.data && Array.isArray(data.data)) {
        // Map Dhan response to grid format
        const mapped = data.data.map(row => ({
          strike: row.strikePrice,
          cLtp: row.ce_ltp || 0, cChg: row.ce_close_price ? (row.ce_ltp - row.ce_close_price) : 0,
          cIv: row.ce_iv || 0, cDelta: row.ce_delta || 0, cGamma: row.ce_gamma || 0,
          cTheta: row.ce_theta || 0, cVega: row.ce_vega || 0, cRho: 0,
          cOi: row.ce_oi || 0, cOiChg: row.ce_oi_change || 0, cVol: row.ce_volume || 0,
          cBid: row.ce_bid_price || 0, cAsk: row.ce_ask_price || 0,
          pLtp: row.pe_ltp || 0, pChg: row.pe_close_price ? (row.pe_ltp - row.pe_close_price) : 0,
          pIv: row.pe_iv || 0, pDelta: row.pe_delta || 0, pGamma: row.pe_gamma || 0,
          pTheta: row.pe_theta || 0, pVega: row.pe_vega || 0, pRho: 0,
          pOi: row.pe_oi || 0, pOiChg: row.pe_oi_change || 0, pVol: row.pe_volume || 0,
          pBid: row.pe_bid_price || 0, pAsk: row.pe_ask_price || 0,
        }))
        setChainData(mapped)
      }
      setLoading(false)
    }
    loadChain()
    const timer = setInterval(loadChain, 10000) // refresh every 10s
    return () => clearInterval(timer)
  }, [expiry])

  const onClickLtp = (strike, type) => {
    openWindow({ id: type === 'CE' ? 'buy' : 'sell', title: `${type === 'CE' ? 'Buy' : 'Sell'} Order [${type === 'CE' ? 'F1' : 'F2'}]`, x: 50, y: 20, w: 380, h: 580 })
  }

  // Find ATM and limit to ±N strikes
  const spotPrice = chainData.length > 0 ? chainData.reduce((closest, s) => Math.abs(s.cLtp - s.pLtp) < Math.abs(closest.cLtp - closest.pLtp) ? s : closest, chainData[0])?.strike : 0
  const atmIdx = chainData.findIndex(s => s.strike === spotPrice)
  const startIdx = Math.max(0, atmIdx - strikesVisible)
  const endIdx = Math.min(chainData.length, atmIdx + strikesVisible + 1)
  const STRIKES = chainData.slice(startIdx, endIdx).map(s => ({ ...s, atm: s.strike === spotPrice }))

  const totalCeOi = STRIKES.reduce((a, s) => a + s.cOi, 0)
  const totalPeOi = STRIKES.reduce((a, s) => a + s.pOi, 0)
  const pcr = totalCeOi > 0 ? (totalPeOi / totalCeOi).toFixed(2) : '—'

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
        <span style={{ color: 'var(--accent)' }}>ATM: <b>{spotPrice || '—'}</b></span>
        {loading && <span style={{ color: '#eab308', fontSize: 9 }}>⏳ Loading...</span>}
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <span style={{ color: '#7a7a8c' }}>Expiry:</span>
        <select style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: 10, height: 18 }}
          value={expiry} onChange={e => setExpiry(e.target.value)}>
          {expiryList.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <span style={{ color: '#7a7a8c', fontSize: 9 }}>±{strikesVisible}</span>
        <button onClick={() => setStrikesVisible(v => v + 10)} style={{ padding: '1px 6px', fontSize: 8, background: 'rgba(0,188,212,0.1)', color: 'var(--accent)', border: '1px solid var(--border)', cursor: 'pointer' }}>+10 More</button>
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
