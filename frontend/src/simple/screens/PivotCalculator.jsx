import { useState } from 'react'

export default function PivotCalculator() {
  const [high, setHigh] = useState('24380')
  const [low, setLow] = useState('24120')
  const [close, setClose] = useState('24250')
  const [method, setMethod] = useState('standard')

  const h = parseFloat(high||0), l = parseFloat(low||0), c = parseFloat(close||0)
  const pp = (h + l + c) / 3
  const r1 = 2*pp - l, s1 = 2*pp - h
  const r2 = pp + (h - l), s2 = pp - (h - l)
  const r3 = h + 2*(pp - l), s3 = l - 2*(h - pp)
  // Woodie
  const wPP = (h + l + 2*c) / 4
  const wR1 = 2*wPP - l, wS1 = 2*wPP - h
  const wR2 = wPP + (h - l), wS2 = wPP - (h - l)
  // Camarilla
  const cR1 = c + (h-l)*1.1/12, cR2 = c + (h-l)*1.1/6, cR3 = c + (h-l)*1.1/4, cR4 = c + (h-l)*1.1/2
  const cS1 = c - (h-l)*1.1/12, cS2 = c - (h-l)*1.1/6, cS3 = c - (h-l)*1.1/4, cS4 = c - (h-l)*1.1/2

  const levels = method === 'standard' ? [
    { label:'R3', value:r3, color:'#ef4444' }, { label:'R2', value:r2, color:'#ef4444' }, { label:'R1', value:r1, color:'#ff6b6b' },
    { label:'PP', value:pp, color:'#00bcd4' },
    { label:'S1', value:s1, color:'#4dabf7' }, { label:'S2', value:s2, color:'#1565C0' }, { label:'S3', value:s3, color:'#1565C0' },
  ] : method === 'woodie' ? [
    { label:'R2', value:wR2, color:'#ef4444' }, { label:'R1', value:wR1, color:'#ff6b6b' },
    { label:'PP', value:wPP, color:'#00bcd4' },
    { label:'S1', value:wS1, color:'#4dabf7' }, { label:'S2', value:wS2, color:'#1565C0' },
  ] : [
    { label:'R4', value:cR4, color:'#ef4444' }, { label:'R3', value:cR3, color:'#ef4444' }, { label:'R2', value:cR2, color:'#ff6b6b' }, { label:'R1', value:cR1, color:'#ff6b6b' },
    { label:'PP', value:pp, color:'#00bcd4' },
    { label:'S1', value:cS1, color:'#4dabf7' }, { label:'S2', value:cS2, color:'#4dabf7' }, { label:'S3', value:cS3, color:'#1565C0' }, { label:'S4', value:cS4, color:'#1565C0' },
  ]

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--bg-panel)' }}>
      <div style={{ height:28, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(90deg,#eab308,#ff6b6b)', color:'#000', fontWeight:700, fontSize:12, letterSpacing:1 }}>
        📐 PIVOT CALCULATOR
      </div>
      <div style={{ flex:1, overflow:'auto', padding:'8px 12px' }}>
        <div style={{ display:'flex', gap:8, marginBottom:8 }}>
          {['standard','woodie','camarilla'].map(m=>(
            <button key={m} onClick={()=>setMethod(m)} style={{ flex:1, padding:'3px', fontSize:9, border:'1px solid var(--border)', cursor:'pointer', textTransform:'capitalize', fontWeight:method===m?700:400, background: method===m ? 'rgba(0,188,212,0.15)' : 'transparent', color: method===m ? 'var(--accent)' : '#7a7a8c' }}>{m}</button>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:10 }}>
          {[['High',high,setHigh,'#22c55e'],['Low',low,setLow,'#ef4444'],['Close',close,setClose,'#00bcd4']].map(([lbl,val,fn,clr])=>(
            <div key={lbl} style={{ display:'flex', flexDirection:'column', gap:2 }}>
              <span style={{ fontSize:8, color:clr, fontWeight:600 }}>{lbl}</span>
              <input value={val} onChange={e=>fn(e.target.value)} style={{ height:24, background:'#0a0a1a', border:`1px solid ${clr}40`, color:'#e0e0e8', padding:'0 6px', fontSize:12, fontFamily:'var(--grid-font)', outline:'none', textAlign:'center', fontWeight:700 }} />
            </div>
          ))}
        </div>
        <div style={{ fontSize:10, fontWeight:600, color:'var(--accent)', marginBottom:6 }}>── PIVOT LEVELS ──</div>
        {levels.map(lv=>(
          <div key={lv.label} style={{ display:'flex', alignItems:'center', padding:'4px 0', borderBottom:'1px solid rgba(42,42,68,0.3)' }}>
            <span style={{ width:40, fontSize:11, fontWeight:700, color:lv.color }}>{lv.label}</span>
            <div style={{ flex:1, height:4, background:'rgba(42,42,68,0.3)', marginRight:8, position:'relative' }}>
              <div style={{ position:'absolute', left:`${Math.min(100, Math.max(0, ((lv.value-l)/(h-l))*100))}%`, top:-3, width:10, height:10, borderRadius:'50%', background:lv.color }} />
            </div>
            <span style={{ fontSize:12, fontWeight:700, color:'#d0d0d8', fontFamily:'var(--grid-font)', minWidth:80, textAlign:'right' }}>{lv.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
