import { useState } from 'react'
import useAppStore from '../stores/useAppStore'
import engineConnector from '../../services/engineConnector'

export default function GridOrder() {
  const [f, setF] = useState({ symbol:'NIFTY', exchange:'NSE', instrument:'OPTIDX', expiry:'24-APR-2026', strike:'24200', optType:'CE',
    side:'BUY', startPrice:'140.00', endPrice:'145.00', gridCount:'5', qtyPerGrid:'50', product:'MIS' })
  const s = (k,v) => setF(p=>({...p,[k]:v}))
  const start = parseFloat(f.startPrice||0), end = parseFloat(f.endPrice||0), count = parseInt(f.gridCount||1)
  const step = count > 1 ? (end - start) / (count - 1) : 0
  const grids = Array.from({length:count}, (_, i) => ({
    level: i+1, price: (start + step*i).toFixed(2), qty: parseInt(f.qtyPerGrid||0),
    value: ((start + step*i) * parseInt(f.qtyPerGrid||0)).toFixed(0)
  }))
  const totalQty = count * parseInt(f.qtyPerGrid||0)
  const totalValue = grids.reduce((a,g) => a + parseFloat(g.price)*g.qty, 0)

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--bg-panel)' }}>
      <div style={{ height:28, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(90deg,#22c55e,#eab308)', color:'#000', fontWeight:700, fontSize:12, letterSpacing:1 }}>
        ⊞ GRID ORDER
      </div>
      <div style={{ flex:1, overflow:'auto', padding:'6px 10px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2px 10px' }}>
          {[['Symbol','symbol'],['Exchange','exchange',['NSE','BSE']],['Start Price','startPrice'],['End Price','endPrice'],['Grid Count','gridCount'],['Qty per Grid','qtyPerGrid'],['Product','product',['MIS','NRML']],['Side','side',['BUY','SELL']]].map(([lbl,k,opts])=>(
            <div key={k} style={{ display:'flex', alignItems:'center', height:24, marginBottom:1 }}>
              <span style={{ width:70, fontSize:9, color:'#9aa0b0', textAlign:'right', paddingRight:6 }}>{lbl}</span>
              {opts ? <select value={f[k]} onChange={e=>s(k,e.target.value)} style={iS}>{opts.map(o=><option key={o}>{o}</option>)}</select>
               : <input value={f[k]} onChange={e=>s(k,e.target.value)} style={iS} />}
            </div>
          ))}
        </div>
        <div style={{ height:1, background:'var(--border)', margin:'6px 0' }} />
        <div style={{ fontSize:10, fontWeight:600, color:'#eab308', marginBottom:4 }}>── GRID LEVELS ──</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'var(--grid-font)', fontSize:10 }}>
          <thead><tr style={{ background:'rgba(255,255,255,0.03)' }}>
            <th style={thS}>#</th><th style={thS}>Price</th><th style={thS}>Qty</th><th style={thS}>Value</th>
          </tr></thead>
          <tbody>{grids.map(g=>(
            <tr key={g.level} style={{ borderBottom:'1px solid rgba(42,42,68,0.3)' }}>
              <td style={tdS}>{g.level}</td>
              <td style={{...tdS, color:'var(--accent)', fontWeight:600}}>₹{g.price}</td>
              <td style={tdS}>{g.qty}</td>
              <td style={{...tdS, color:'#7a7a8c'}}>₹{Number(g.value).toLocaleString()}</td>
            </tr>
          ))}</tbody>
        </table>
        <div style={{ marginTop:6, display:'flex', gap:10, fontSize:9, color:'#7a7a8c' }}>
          <span>Total Qty: <b style={{ color:'#d0d0d8' }}>{totalQty}</b></span>
          <span>Total Value: <b style={{ color:'var(--accent)' }}>₹{totalValue.toLocaleString()}</b></span>
          <span>Step: <b style={{ color:'#eab308' }}>{step.toFixed(2)}</b></span>
        </div>
      </div>
      <div style={{ display:'flex', gap:6, padding:'6px 10px', borderTop:'1px solid var(--border)' }}>
        <button onClick={async () => {
          const addMessage = useAppStore.getState().addMessage
          let ok = 0, fail = 0
          for (const g of grids) {
            const order = {
              transactionType: f.side, exchangeSegment: 'NSE_FNO', productType: f.product === 'MIS' ? 'INTRADAY' : 'MARGIN',
              orderType: 'LIMIT', validity: 'DAY', securityId: f.symbol,
              quantity: g.qty, price: parseFloat(g.price),
            }
            const res = await engineConnector.placeOrder(order)
            if (res.success) ok++; else fail++
          }
          addMessage('order', `Grid: ${ok} placed, ${fail} failed out of ${count} levels`)
        }} style={{ flex:1, height:26, background:'#22c55e', color:'#000', border:'none', fontSize:10, fontWeight:700, cursor:'pointer' }}>⚡ Place Grid Order ({count} levels)</button>
      </div>
    </div>
  )
}
const iS={height:20,background:'#0a0a1a',border:'1px solid #2a2a44',color:'#e0e0e8',padding:'0 6px',fontSize:10,fontFamily:'var(--grid-font)',outline:'none',flex:1}
const thS={padding:'3px 6px',color:'#6a6a7a',fontSize:9,fontWeight:600,textAlign:'center',borderBottom:'1px solid var(--border)'}
const tdS={padding:'3px 6px',height:22,textAlign:'center',color:'#d0d0d8'}
