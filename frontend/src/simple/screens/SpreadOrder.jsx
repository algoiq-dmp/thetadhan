import { useState } from 'react'
import ActionIcon from '../components/ActionIcons'

export default function SpreadOrder() {
  const [leg1, setLeg1] = useState({ side:'BUY', symbol:'NIFTY', expiry:'24-APR-2026', strike:'24200', optType:'CE', qty:'50', price:'142.00', orderType:'LIMIT' })
  const [leg2, setLeg2] = useState({ side:'SELL', symbol:'NIFTY', expiry:'24-APR-2026', strike:'24300', optType:'CE', qty:'50', price:'92.50', orderType:'LIMIT' })
  const sL1 = (k,v) => setLeg1(p=>({...p,[k]:v}))
  const sL2 = (k,v) => setLeg2(p=>({...p,[k]:v}))
  const spread = (parseFloat(leg1.price||0) - parseFloat(leg2.price||0)).toFixed(2)
  const netQty = parseInt(leg1.qty||0) - parseInt(leg2.qty||0)

  const LegPanel = ({ leg, setLeg, label, num }) => (
    <div style={{ flex:1, border:'1px solid var(--border)', padding:'6px 8px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
        <span style={{ fontSize:10, fontWeight:700, color:'var(--accent)' }}>LEG {num}</span>
        <div style={{ display:'flex', gap:2 }}>
          {['BUY','SELL'].map(s=>(
            <button key={s} onClick={()=>setLeg('side',s)} style={{ padding:'1px 8px', fontSize:8, border:'none', cursor:'pointer', fontWeight:700, background: leg.side===s ? (s==='BUY' ? '#1565C0' : '#C62828') : '#2a2a44', color: leg.side===s ? '#fff' : '#7a7a8c' }}>{s}</button>
          ))}
        </div>
      </div>
      {[['Symbol','symbol'],['Expiry','expiry',['24-APR-2026','01-MAY-2026','29-MAY-2026']],['Strike','strike'],['Type','optType',['CE','PE']],['Qty','qty'],['Price','price']].map(([lbl,k,opts])=>(
        <div key={k} style={{ display:'flex', alignItems:'center', height:22, marginBottom:1 }}>
          <span style={{ width:50, fontSize:9, color:'#7a7a8c', textAlign:'right', paddingRight:6 }}>{lbl}</span>
          {opts ? <select value={leg[k]} onChange={e=>setLeg(k,e.target.value)} style={iS}>{opts.map(o=><option key={o}>{o}</option>)}</select>
           : <input value={leg[k]} onChange={e=>setLeg(k,e.target.value)} style={iS} />}
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--bg-panel)' }}>
      <div style={{ height:28, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(90deg, #1565C0, #7c4dff)', color:'#fff', fontWeight:700, fontSize:12, letterSpacing:2 }}>
        ⇄ SPREAD ORDER (Ctrl+F3)
      </div>
      <div style={{ flex:1, overflow:'auto', padding:'6px 8px' }}>
        <div style={{ display:'flex', gap:6 }}>
          <LegPanel leg={leg1} setLeg={sL1} label="Leg 1" num={1} />
          <LegPanel leg={leg2} setLeg={sL2} label="Leg 2" num={2} />
        </div>
        <div style={{ margin:'8px 0', padding:'6px 10px', background:'rgba(0,188,212,0.06)', border:'1px solid rgba(0,188,212,0.2)', fontSize:9 }}>
          <div style={{ display:'flex', gap:16 }}>
            <div><span style={{ color:'#7a7a8c' }}>Net Spread:</span> <b style={{ color: parseFloat(spread) >= 0 ? '#22c55e' : '#ef4444', fontSize:13 }}>₹{spread}</b></div>
            <div><span style={{ color:'#7a7a8c' }}>Net Qty:</span> <b style={{ color:'#d0d0d8' }}>{netQty}</b></div>
            <div><span style={{ color:'#7a7a8c' }}>Max Profit:</span> <b style={{ color:'#22c55e' }}>₹{(Math.abs(parseFloat(spread)) * parseInt(leg1.qty||0)).toFixed(0)}</b></div>
            <div><span style={{ color:'#7a7a8c' }}>Max Risk:</span> <b style={{ color:'#ef4444' }}>₹{((Math.abs(parseInt(leg1.strike||0) - parseInt(leg2.strike||0)) - Math.abs(parseFloat(spread))) * parseInt(leg1.qty||0)).toFixed(0)}</b></div>
          </div>
        </div>
        <div style={{ fontSize:9, color:'#5a5a6a', padding:'4px 0' }}>
          Strategy: <b style={{ color:'#d0d0d8' }}>{leg1.side === 'BUY' && leg2.side === 'SELL' ? 'Bull Spread' : leg1.side === 'SELL' && leg2.side === 'BUY' ? 'Bear Spread' : 'Custom'}</b>
          {' │ '}{leg1.optType}{leg1.strike}/{leg2.optType}{leg2.strike}
        </div>
      </div>
      <div style={{ display:'flex', gap:6, padding:'8px 10px', borderTop:'1px solid var(--border)' }}>
        <button onClick={()=>alert('Spread Order placed!')} style={{ flex:1, height:28, background:'linear-gradient(90deg, #1565C0, #7c4dff)', color:'#fff', border:'none', fontSize:11, fontWeight:700, cursor:'pointer' }}>
          SUBMIT SPREAD ORDER
        </button>
        <ActionIcon type="reset" tooltip="Reset" />
      </div>
    </div>
  )
}
const iS = { height:18, background:'#0a0a1a', border:'1px solid #2a2a44', color:'#e0e0e8', padding:'0 4px', fontSize:10, fontFamily:'var(--grid-font)', outline:'none', flex:1 }
