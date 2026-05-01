import { useState } from 'react'
import { MOCK_DEPTH } from '../mock/data'

export default function BracketOrder() {
  const [f, setF] = useState({
    exchange:'NSE', symbol:'NIFTY', instrument:'OPTIDX', expiry:'24-APR-2026', strike:'24200', optType:'CE',
    side:'BUY', qty:'50', entryPrice:'142.00', targetPrice:'152.00', slPrice:'137.00',
    trailingSL:'', product:'MIS', orderType:'LIMIT', validity:'DAY'
  })
  const s = (k,v) => setF(p=>({...p,[k]:v}))
  const isBuy = f.side === 'BUY'
  const risk = Math.abs(parseFloat(f.entryPrice||0) - parseFloat(f.slPrice||0)) * parseInt(f.qty||0)
  const reward = Math.abs(parseFloat(f.targetPrice||0) - parseFloat(f.entryPrice||0)) * parseInt(f.qty||0)
  const rr = risk > 0 ? (reward/risk).toFixed(2) : '—'

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background: isBuy ? '#0d2844' : '#3a0f0f' }}>
      <div style={{ height:28, display:'flex', alignItems:'center', justifyContent:'center', background: isBuy ? '#1565C0' : '#C62828', color:'#fff', fontWeight:700, fontSize:12, letterSpacing:2, textTransform:'uppercase' }}>
        ⟁ BRACKET ORDER
      </div>
      <div style={{ display:'flex', gap:4, padding:'4px 8px', background:'rgba(0,0,0,0.15)' }}>
        <button onClick={()=>s('side','BUY')} style={{ flex:1, padding:'3px', fontSize:10, border:'none', cursor:'pointer', fontWeight:700, background: isBuy ? '#1565C0' : 'transparent', color: isBuy ? '#fff' : '#7a7a8c' }}>BUY</button>
        <button onClick={()=>s('side','SELL')} style={{ flex:1, padding:'3px', fontSize:10, border:'none', cursor:'pointer', fontWeight:700, background: !isBuy ? '#C62828' : 'transparent', color: !isBuy ? '#fff' : '#7a7a8c' }}>SELL</button>
      </div>
      <div style={{ flex:1, overflow:'auto', padding:'6px 10px' }}>
        {[['Exchange','exchange',['NSE','BSE','MCX'],'sel'],['Instrument','instrument',['OPTIDX','OPTSTK','FUTIDX','EQ'],'sel'],['Symbol','symbol',null,'txt'],['Expiry','expiry',['24-APR-2026','01-MAY-2026','29-MAY-2026'],'sel'],['Strike','strike',null,'txt'],['Opt Type','optType',['CE','PE'],'sel']].map(([lbl,k,opts,t])=>(
          <div key={k} style={fldS}>
            <span style={lblS}>{lbl}</span>
            {t==='sel' ? <select value={f[k]} onChange={e=>s(k,e.target.value)} style={inpS}>{opts.map(o=><option key={o}>{o}</option>)}</select>
             : <input value={f[k]} onChange={e=>s(k,e.target.value)} style={inpS} />}
          </div>
        ))}
        <div style={{ height:1, background:'rgba(42,42,68,0.5)', margin:'6px 0' }} />
        <div style={{ fontSize:10, color:'var(--accent)', fontWeight:600, marginBottom:4 }}>── ORDER LEGS ──</div>
        <div style={fldS}><span style={lblS}>Qty</span><input value={f.qty} onChange={e=>s('qty',e.target.value)} style={inpS} /></div>
        <div style={fldS}><span style={lblS}>Entry Price</span><input value={f.entryPrice} onChange={e=>s('entryPrice',e.target.value)} style={{...inpS, borderColor:'var(--accent)'}} /></div>
        <div style={fldS}><span style={lblS}>Target Price</span><input value={f.targetPrice} onChange={e=>s('targetPrice',e.target.value)} style={{...inpS, borderColor:'#22c55e'}} /></div>
        <div style={fldS}><span style={lblS}>Stop Loss</span><input value={f.slPrice} onChange={e=>s('slPrice',e.target.value)} style={{...inpS, borderColor:'#ef4444'}} /></div>
        <div style={fldS}><span style={lblS}>Trailing SL</span><input value={f.trailingSL} onChange={e=>s('trailingSL',e.target.value)} style={inpS} placeholder="Optional" /></div>
        <div style={{ height:1, background:'rgba(42,42,68,0.5)', margin:'6px 0' }} />
        {/* Risk/Reward Display */}
        <div style={{ display:'flex', gap:8, fontSize:9, padding:'4px 0' }}>
          <div style={{ flex:1, background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', padding:'4px 8px', textAlign:'center' }}>
            <div style={{ color:'#7a7a8c' }}>Reward</div>
            <div style={{ color:'#22c55e', fontWeight:700, fontSize:12 }}>₹{reward.toFixed(0)}</div>
          </div>
          <div style={{ flex:1, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', padding:'4px 8px', textAlign:'center' }}>
            <div style={{ color:'#7a7a8c' }}>Risk</div>
            <div style={{ color:'#ef4444', fontWeight:700, fontSize:12 }}>₹{risk.toFixed(0)}</div>
          </div>
          <div style={{ flex:1, background:'rgba(0,188,212,0.08)', border:'1px solid rgba(0,188,212,0.2)', padding:'4px 8px', textAlign:'center' }}>
            <div style={{ color:'#7a7a8c' }}>R:R</div>
            <div style={{ color:'var(--accent)', fontWeight:700, fontSize:12 }}>1:{rr}</div>
          </div>
        </div>
        {/* Visual Bracket */}
        <div style={{ margin:'6px 0', padding:'6px', background:'rgba(0,0,0,0.15)', border:'1px solid var(--border)', fontSize:9 }}>
          <div style={{ display:'flex', justifyContent:'space-between', color:'#22c55e' }}>
            <span>▲ Target</span><span>{f.targetPrice}</span>
          </div>
          <div style={{ height:20, margin:'2px 0', borderLeft:'2px dashed #4dabf7', marginLeft:8, display:'flex', alignItems:'center', paddingLeft:8 }}>
            <span style={{ color:'#4dabf7', fontWeight:700 }}>◆ Entry: {f.entryPrice}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', color:'#ef4444' }}>
            <span>▼ Stop Loss</span><span>{f.slPrice}</span>
          </div>
        </div>
      </div>
      <div style={{ display:'flex', gap:6, padding:'8px 10px', borderTop:'1px solid var(--border)' }}>
        <button onClick={()=>alert('Bracket Order placed!')} style={{ flex:1, height:28, background: isBuy ? '#1565C0' : '#C62828', color:'#fff', border:'none', fontSize:11, fontWeight:700, cursor:'pointer' }}>
          SUBMIT BRACKET {f.side}
        </button>
        <button style={{ height:28, padding:'0 12px', background:'#2a2a44', color:'#d0d0d8', border:'1px solid #3a3a5a', fontSize:10, cursor:'pointer' }}>Reset</button>
      </div>
    </div>
  )
}

const fldS = { display:'flex', alignItems:'center', height:24, marginBottom:1, borderBottom:'1px solid rgba(255,255,255,0.04)' }
const lblS = { width:85, fontSize:10, color:'#9aa0b0', textAlign:'right', paddingRight:8, flexShrink:0 }
const inpS = { height:20, background:'#0a0a1a', border:'1px solid #2a2a44', color:'#e0e0e8', padding:'0 6px', fontSize:11, fontFamily:'var(--grid-font)', outline:'none', flex:1 }
