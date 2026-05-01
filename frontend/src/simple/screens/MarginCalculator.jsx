import { useState } from 'react'

export default function MarginCalculator() {
  const [f, setF] = useState({ exchange:'NSE', instrument:'OPTIDX', symbol:'NIFTY', expiry:'24-APR-2026', strike:'24200', optType:'CE', side:'BUY', qty:'50', price:'142.00', product:'MIS' })
  const s = (k,v) => setF(p=>({...p,[k]:v}))
  const spanMargin = (parseFloat(f.price||0) * parseInt(f.qty||0) * 0.15).toFixed(2)
  const exposureMargin = (parseFloat(f.price||0) * parseInt(f.qty||0) * 0.03).toFixed(2)
  const totalMargin = (parseFloat(spanMargin) + parseFloat(exposureMargin)).toFixed(2)
  const premium = (parseFloat(f.price||0) * parseInt(f.qty||0)).toFixed(2)
  const isBuy = f.side === 'BUY'
  const isOption = f.instrument.includes('OPT')

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--bg-panel)' }}>
      <div style={{ height:28, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(90deg,#00bcd4,#7c4dff)', color:'#fff', fontWeight:700, fontSize:12, letterSpacing:1 }}>
        🧮 MARGIN CALCULATOR
      </div>
      <div style={{ flex:1, overflow:'auto', padding:'8px 12px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2px 12px' }}>
          {[['Exchange','exchange',['NSE','BSE','MCX']],['Instrument','instrument',['OPTIDX','OPTSTK','FUTIDX','FUTSTK','EQ']],['Symbol','symbol'],['Expiry','expiry',['24-APR-2026','01-MAY-2026','29-MAY-2026']],['Strike','strike'],['Option Type','optType',['CE','PE']],['Side','side',['BUY','SELL']],['Quantity','qty'],['Price','price'],['Product','product',['MIS','NRML','CNC']]].map(([lbl,k,opts])=>(
            <div key={k} style={fS}>
              <span style={lS}>{lbl}</span>
              {opts ? <select value={f[k]} onChange={e=>s(k,e.target.value)} style={iS}>{opts.map(o=><option key={o}>{o}</option>)}</select>
               : <input value={f[k]} onChange={e=>s(k,e.target.value)} style={iS} />}
            </div>
          ))}
        </div>
        <div style={{ height:1, background:'var(--border)', margin:'10px 0' }} />
        <div style={{ fontSize:11, fontWeight:700, color:'var(--accent)', marginBottom:8 }}>── MARGIN BREAKDOWN ──</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div style={boxS('#1565C0')}><div style={boxLbl}>SPAN Margin</div><div style={boxVal}>₹{Number(spanMargin).toLocaleString()}</div></div>
          <div style={boxS('#7c4dff')}><div style={boxLbl}>Exposure Margin</div><div style={boxVal}>₹{Number(exposureMargin).toLocaleString()}</div></div>
          <div style={boxS('#eab308')}><div style={boxLbl}>Premium Required</div><div style={boxVal}>₹{Number(premium).toLocaleString()}</div></div>
          <div style={{...boxS('#00bcd4'), borderWidth:2}}><div style={boxLbl}>Total Margin</div><div style={{...boxVal, fontSize:16}}>₹{Number(totalMargin).toLocaleString()}</div></div>
        </div>
        <div style={{ marginTop:10, padding:'6px 10px', background:'rgba(0,188,212,0.04)', border:'1px solid var(--border)', fontSize:9, color:'#7a7a8c' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
            <span>Leverage</span><b style={{ color:'#d0d0d8' }}>{(100 / 15).toFixed(1)}x</b>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
            <span>Contract Value</span><b style={{ color:'#d0d0d8' }}>₹{(parseFloat(f.price||0) * parseInt(f.qty||0)).toLocaleString()}</b>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span>MIS Benefit ({f.product === 'MIS' ? '50%' : '0%'})</span>
            <b style={{ color:'#22c55e' }}>{f.product === 'MIS' ? '₹' + (parseFloat(totalMargin)/2).toFixed(0) + ' saved' : '—'}</b>
          </div>
        </div>
      </div>
      <div style={{ padding:'6px 12px', borderTop:'1px solid var(--border)', display:'flex', gap:6 }}>
        <button onClick={()=>alert(`Margin Required: ₹${totalMargin}`)} style={{ flex:1, height:26, background:'var(--accent)', color:'#000', border:'none', fontSize:10, fontWeight:700, cursor:'pointer' }}>Calculate</button>
        <button style={{ height:26, padding:'0 12px', background:'#2a2a44', color:'#d0d0d8', border:'1px solid #3a3a5a', fontSize:9, cursor:'pointer' }}>Reset</button>
      </div>
    </div>
  )
}
const fS={display:'flex',alignItems:'center',height:24,marginBottom:1}
const lS={width:80,fontSize:9,color:'#9aa0b0',textAlign:'right',paddingRight:6,flexShrink:0}
const iS={height:20,background:'#0a0a1a',border:'1px solid #2a2a44',color:'#e0e0e8',padding:'0 6px',fontSize:10,fontFamily:'var(--grid-font)',outline:'none',flex:1}
const boxS=(c)=>({padding:'8px 10px',background:`${c}10`,border:`1px solid ${c}40`,textAlign:'center'})
const boxLbl={fontSize:9,color:'#7a7a8c',marginBottom:2}
const boxVal={fontSize:14,fontWeight:700,color:'#d0d0d8',fontFamily:'var(--grid-font)'}
