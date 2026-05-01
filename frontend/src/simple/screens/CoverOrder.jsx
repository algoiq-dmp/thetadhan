import { useState } from 'react'

export default function CoverOrder() {
  const [f, setF] = useState({
    exchange:'NSE', symbol:'NIFTY', instrument:'OPTIDX', expiry:'24-APR-2026', strike:'24200', optType:'CE',
    side:'BUY', qty:'50', entryPrice:'142.00', slPrice:'132.00', product:'MIS', orderType:'MARKET'
  })
  const s = (k,v) => setF(p=>({...p,[k]:v}))
  const isBuy = f.side === 'BUY'
  const risk = Math.abs(parseFloat(f.entryPrice||0) - parseFloat(f.slPrice||0)) * parseInt(f.qty||0)
  const margin = (parseFloat(f.entryPrice||0) * parseInt(f.qty||0) * 0.12).toFixed(0)

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background: isBuy ? '#0d2844' : '#3a0f0f' }}>
      <div style={{ height:28, display:'flex', alignItems:'center', justifyContent:'center', background: isBuy ? '#1565C0' : '#C62828', color:'#fff', fontWeight:700, fontSize:12, letterSpacing:2 }}>
        🛡 COVER ORDER
      </div>
      <div style={{ display:'flex', gap:4, padding:'4px 8px', background:'rgba(0,0,0,0.15)' }}>
        <button onClick={()=>s('side','BUY')} style={{ flex:1, padding:'3px', fontSize:10, border:'none', cursor:'pointer', fontWeight:700, background: isBuy ? '#1565C0' : 'transparent', color: isBuy ? '#fff' : '#7a7a8c' }}>BUY</button>
        <button onClick={()=>s('side','SELL')} style={{ flex:1, padding:'3px', fontSize:10, border:'none', cursor:'pointer', fontWeight:700, background: !isBuy ? '#C62828' : 'transparent', color: !isBuy ? '#fff' : '#7a7a8c' }}>SELL</button>
      </div>
      <div style={{ flex:1, overflow:'auto', padding:'6px 10px' }}>
        {[['Exchange','exchange',['NSE','BSE']],['Instrument','instrument',['OPTIDX','OPTSTK','FUTIDX','EQ']],['Symbol','symbol'],['Expiry','expiry',['24-APR-2026','01-MAY-2026']],['Strike','strike'],['Opt Type','optType',['CE','PE']]].map(([lbl,k,opts])=>(
          <div key={k} style={fS}>
            <span style={lS}>{lbl}</span>
            {opts ? <select value={f[k]} onChange={e=>s(k,e.target.value)} style={iS}>{opts.map(o=><option key={o}>{o}</option>)}</select>
             : <input value={f[k]} onChange={e=>s(k,e.target.value)} style={iS} />}
          </div>
        ))}
        <div style={{ height:1, background:'rgba(42,42,68,0.5)', margin:'6px 0' }} />
        <div style={{ fontSize:10, color:'#eab308', fontWeight:600, marginBottom:4 }}>── COVER ORDER ── (Entry + Compulsory SL)</div>
        <div style={fS}><span style={lS}>Order Type</span>
          <div style={{ display:'flex', gap:8, fontSize:10 }}>
            {['MARKET','LIMIT'].map(t=>(
              <label key={t} style={{ display:'flex', alignItems:'center', gap:3, color:'#d0d0d8', cursor:'pointer' }}>
                <input type="radio" name="coType" checked={f.orderType===t} onChange={()=>s('orderType',t)} style={{ accentColor:'#00bcd4' }} />{t}
              </label>
            ))}
          </div>
        </div>
        <div style={fS}><span style={lS}>Qty</span><input value={f.qty} onChange={e=>s('qty',e.target.value)} style={iS} /></div>
        {f.orderType==='LIMIT' && <div style={fS}><span style={lS}>Entry Price</span><input value={f.entryPrice} onChange={e=>s('entryPrice',e.target.value)} style={iS} /></div>}
        <div style={fS}><span style={{...lS, color:'#ef4444'}}>⚠ Stop Loss</span><input value={f.slPrice} onChange={e=>s('slPrice',e.target.value)} style={{...iS, borderColor:'#ef4444'}} /></div>
        <div style={{ margin:'8px 0', padding:'6px', background:'rgba(234,179,8,0.06)', border:'1px solid rgba(234,179,8,0.2)', fontSize:9, color:'#eab308' }}>
          ⚠ Cover Order has COMPULSORY Stop Loss. Higher leverage available due to reduced risk.
        </div>
        <div style={{ display:'flex', gap:8, fontSize:9 }}>
          <div style={{ flex:1, padding:'4px 8px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', textAlign:'center' }}>
            <div style={{ color:'#7a7a8c' }}>Max Risk</div><div style={{ color:'#ef4444', fontWeight:700, fontSize:12 }}>₹{risk.toFixed(0)}</div>
          </div>
          <div style={{ flex:1, padding:'4px 8px', background:'rgba(0,188,212,0.08)', border:'1px solid rgba(0,188,212,0.2)', textAlign:'center' }}>
            <div style={{ color:'#7a7a8c' }}>Margin Req.</div><div style={{ color:'var(--accent)', fontWeight:700, fontSize:12 }}>₹{margin}</div>
          </div>
        </div>
      </div>
      <div style={{ display:'flex', gap:6, padding:'8px 10px', borderTop:'1px solid var(--border)' }}>
        <button onClick={()=>alert('Cover Order placed!')} style={{ flex:1, height:28, background: isBuy ? '#1565C0' : '#C62828', color:'#fff', border:'none', fontSize:11, fontWeight:700, cursor:'pointer' }}>
          SUBMIT COVER {f.side}
        </button>
        <button style={{ height:28, padding:'0 12px', background:'#2a2a44', color:'#d0d0d8', border:'1px solid #3a3a5a', fontSize:10, cursor:'pointer' }}>Reset</button>
      </div>
    </div>
  )
}
const fS = { display:'flex', alignItems:'center', height:24, marginBottom:1, borderBottom:'1px solid rgba(255,255,255,0.04)' }
const lS = { width:85, fontSize:10, color:'#9aa0b0', textAlign:'right', paddingRight:8, flexShrink:0 }
const iS = { height:20, background:'#0a0a1a', border:'1px solid #2a2a44', color:'#e0e0e8', padding:'0 6px', fontSize:11, fontFamily:'var(--grid-font)', outline:'none', flex:1 }
