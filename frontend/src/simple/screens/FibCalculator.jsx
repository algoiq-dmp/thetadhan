import { useState } from 'react'

export default function FibCalculator() {
  const [high, setHigh] = useState('24380')
  const [low, setLow] = useState('24120')
  const [dir, setDir] = useState('up') // up = retracement from low to high

  const h = parseFloat(high||0), l = parseFloat(low||0)
  const diff = h - l
  const fibs = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.618]
  const labels = ['0%', '23.6%', '38.2%', '50%', '61.8%', '78.6%', '100%', '127.2%', '161.8%']
  const colors = ['#22c55e','#4dabf7','#00bcd4','#eab308','#ff6b6b','#ef4444','#7c4dff','#c084fc','#f472b6']

  const levels = fibs.map((fib, i) => ({
    label: labels[i], fib,
    value: dir === 'up' ? h - diff * fib : l + diff * fib,
    color: colors[i],
    isKey: [0.382, 0.5, 0.618].includes(fib)
  }))

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--bg-panel)' }}>
      <div style={{ height:28, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(90deg,#7c4dff,#f472b6)', color:'#fff', fontWeight:700, fontSize:12, letterSpacing:1 }}>
        ⌇ FIBONACCI RETRACEMENT
      </div>
      <div style={{ flex:1, overflow:'auto', padding:'8px 12px' }}>
        <div style={{ display:'flex', gap:4, marginBottom:8 }}>
          <button onClick={()=>setDir('up')} style={{ flex:1, padding:'3px', fontSize:9, border:'1px solid var(--border)', cursor:'pointer', fontWeight:dir==='up'?700:400, background:dir==='up'?'rgba(34,197,94,0.15)':'transparent', color:dir==='up'?'#22c55e':'#7a7a8c' }}>▲ Uptrend Retracement</button>
          <button onClick={()=>setDir('down')} style={{ flex:1, padding:'3px', fontSize:9, border:'1px solid var(--border)', cursor:'pointer', fontWeight:dir==='down'?700:400, background:dir==='down'?'rgba(239,68,68,0.15)':'transparent', color:dir==='down'?'#ef4444':'#7a7a8c' }}>▼ Downtrend Retracement</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
          <div><span style={{ fontSize:8, color:'#22c55e', fontWeight:600 }}>High</span>
            <input value={high} onChange={e=>setHigh(e.target.value)} style={iS} /></div>
          <div><span style={{ fontSize:8, color:'#ef4444', fontWeight:600 }}>Low</span>
            <input value={low} onChange={e=>setLow(e.target.value)} style={iS} /></div>
        </div>
        <div style={{ fontSize:10, fontWeight:600, color:'#7c4dff', marginBottom:6 }}>── FIBONACCI LEVELS ──</div>
        {levels.map(lv=>(
          <div key={lv.label} style={{ display:'flex', alignItems:'center', padding:'4px 0', borderBottom:'1px solid rgba(42,42,68,0.3)', background: lv.isKey ? 'rgba(234,179,8,0.04)' : 'transparent' }}>
            <span style={{ width:50, fontSize:10, fontWeight: lv.isKey ? 700 : 500, color: lv.color }}>{lv.label}</span>
            <div style={{ flex:1, height: lv.isKey ? 6 : 3, background:`${lv.color}20`, marginRight:8, borderRadius:2, position:'relative' }}>
              <div style={{ position:'absolute', right:0, top: lv.isKey ? -1 : 0, width: lv.isKey ? 12 : 8, height: lv.isKey ? 8 : 3, background:lv.color, borderRadius:1 }} />
            </div>
            <span style={{ fontSize: lv.isKey ? 13 : 11, fontWeight: lv.isKey ? 700 : 500, color: lv.isKey ? '#fff' : '#d0d0d8', fontFamily:'var(--grid-font)', minWidth:80, textAlign:'right' }}>{lv.value.toFixed(2)}</span>
            {lv.isKey && <span style={{ fontSize:7, color:'#eab308', marginLeft:4 }}>★</span>}
          </div>
        ))}
        <div style={{ marginTop:8, padding:'6px', background:'rgba(124,77,255,0.06)', border:'1px solid rgba(124,77,255,0.2)', fontSize:8, color:'#7a7a8c' }}>
          <b style={{ color:'#7c4dff' }}>Key Levels:</b> 38.2%, 50%, 61.8% are the strongest retracement zones. Watch for price action confirmation at these levels.
        </div>
      </div>
    </div>
  )
}
const iS={height:26,background:'#0a0a1a',border:'1px solid #2a2a44',color:'#e0e0e8',padding:'0 6px',fontSize:13,fontFamily:'var(--grid-font)',outline:'none',width:'100%',textAlign:'center',fontWeight:700,marginTop:2}
