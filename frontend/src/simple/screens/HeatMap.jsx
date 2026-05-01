import { useState } from 'react'

const SECTORS = {
  'NIFTY 50': [
    { symbol:'RELIANCE', weight:10.2, ltp:2540, chgP:1.2 },{ symbol:'TCS', weight:4.1, ltp:3450, chgP:-0.3 },
    { symbol:'HDFCBANK', weight:8.5, ltp:1580, chgP:0.8 },{ symbol:'INFY', weight:5.8, ltp:1420, chgP:-1.1 },
    { symbol:'ICICIBANK', weight:7.2, ltp:1180, chgP:1.5 },{ symbol:'SBIN', weight:2.8, ltp:780, chgP:2.1 },
    { symbol:'BHARTIARTL', weight:3.5, ltp:1620, chgP:0.5 },{ symbol:'ITC', weight:3.2, ltp:430, chgP:-0.2 },
    { symbol:'KOTAKBANK', weight:3.0, ltp:1850, chgP:-0.8 },{ symbol:'LT', weight:2.8, ltp:3280, chgP:0.9 },
    { symbol:'AXISBANK', weight:2.5, ltp:1120, chgP:1.8 },{ symbol:'HINDUNILVR', weight:2.4, ltp:2380, chgP:-0.4 },
    { symbol:'BAJFINANCE', weight:2.2, ltp:6950, chgP:1.3 },{ symbol:'MARUTI', weight:1.8, ltp:12500, chgP:0.6 },
    { symbol:'WIPRO', weight:1.5, ltp:450, chgP:-2.1 },{ symbol:'TATAMOTORS', weight:1.8, ltp:680, chgP:1.9 },
    { symbol:'SUNPHARMA', weight:1.6, ltp:1750, chgP:0.3 },{ symbol:'M&M', weight:2.1, ltp:2650, chgP:1.1 },
    { symbol:'TITAN', weight:1.4, ltp:3200, chgP:-0.6 },{ symbol:'ADANIENT', weight:1.2, ltp:2850, chgP:3.2 },
  ],
  'BANK NIFTY': [
    { symbol:'HDFCBANK', weight:28, ltp:1580, chgP:0.8 },{ symbol:'ICICIBANK', weight:22, ltp:1180, chgP:1.5 },
    { symbol:'KOTAKBANK', weight:12, ltp:1850, chgP:-0.8 },{ symbol:'AXISBANK', weight:10, ltp:1120, chgP:1.8 },
    { symbol:'SBIN', weight:9, ltp:780, chgP:2.1 },{ symbol:'INDUSINDBK', weight:5, ltp:1450, chgP:-1.2 },
    { symbol:'BANDHANBNK', weight:3, ltp:210, chgP:0.4 },{ symbol:'FEDERALBNK', weight:3, ltp:168, chgP:0.9 },
  ],
}

const getColor = (chgP) => {
  if (chgP > 2) return '#15803d'
  if (chgP > 1) return '#22c55e'
  if (chgP > 0) return '#4ade80'
  if (chgP > -1) return '#fca5a5'
  if (chgP > -2) return '#ef4444'
  return '#b91c1c'
}

export default function HeatMap() {
  const [sector, setSector] = useState('NIFTY 50')
  const stocks = SECTORS[sector] || []
  const advancers = stocks.filter(s => s.chgP > 0).length
  const decliners = stocks.filter(s => s.chgP < 0).length

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--bg-panel)' }}>
      <div style={{ padding:'6px 12px', background:'var(--bg-surface)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontWeight:700, fontSize:12, color:'#d0d0d8' }}>🗺 Market Heat Map</span>
        <select value={sector} onChange={e=>setSector(e.target.value)} style={{ height:20, background:'var(--bg-input)', color:'var(--text-primary)', border:'1px solid var(--border)', fontSize:10 }}>
          {Object.keys(SECTORS).map(s=><option key={s}>{s}</option>)}
        </select>
        <span style={{ marginLeft:'auto', fontSize:9 }}>
          <span style={{ color:'#22c55e' }}>▲{advancers}</span> <span style={{ color:'#ef4444' }}>▼{decliners}</span>
        </span>
      </div>
      <div style={{ flex:1, overflow:'auto', padding:6 }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
          {stocks.map(s=>{
            const size = Math.max(60, s.weight * 8)
            return (
              <div key={s.symbol} style={{
                width:size, height:size, background:getColor(s.chgP), display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'transform 0.15s',
                border:'1px solid rgba(0,0,0,0.2)', position:'relative'
              }} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.08)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
                <span style={{ fontSize: size > 80 ? 10 : 8, fontWeight:700, color:'#fff', textShadow:'0 1px 2px rgba(0,0,0,0.5)' }}>{s.symbol}</span>
                <span style={{ fontSize: size > 80 ? 11 : 8, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>
                  {s.chgP > 0 ? '+' : ''}{s.chgP.toFixed(1)}%
                </span>
                {size > 70 && <span style={{ fontSize:7, color:'rgba(255,255,255,0.6)' }}>₹{s.ltp}</span>}
              </div>
            )
          })}
        </div>
      </div>
      <div style={{ padding:'4px 10px', background:'rgba(0,0,0,0.15)', borderTop:'1px solid var(--border)', fontSize:8, color:'#5a5a6a', display:'flex', gap:10 }}>
        <span>■ <span style={{ color:'#15803d' }}>&gt;+2%</span></span>
        <span>■ <span style={{ color:'#22c55e' }}>+1~2%</span></span>
        <span>■ <span style={{ color:'#4ade80' }}>0~1%</span></span>
        <span>■ <span style={{ color:'#fca5a5' }}>0~-1%</span></span>
        <span>■ <span style={{ color:'#ef4444' }}>-1~-2%</span></span>
        <span>■ <span style={{ color:'#b91c1c' }}>&lt;-2%</span></span>
      </div>
    </div>
  )
}
