import { useState } from 'react'

const SAMPLE = [
  { id:1, exchange:'NSE', symbol:'NIFTY 24200CE', side:'BUY', qty:50, price:'142.00', product:'MIS', orderType:'LMT', enabled:true },
  { id:2, exchange:'NSE', symbol:'NIFTY 24300CE', side:'SELL', qty:50, price:'92.50', product:'MIS', orderType:'LMT', enabled:true },
  { id:3, exchange:'NSE', symbol:'BANKNIFTY FUT', side:'BUY', qty:30, price:'51500', product:'NRML', orderType:'MKT', enabled:true },
  { id:4, exchange:'NSE', symbol:'RELIANCE', side:'BUY', qty:250, price:'2540.50', product:'CNC', orderType:'LMT', enabled:true },
]

export default function BasketOrder() {
  const [orders, setOrders] = useState(SAMPLE)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(0)
  const toggle = (id) => setOrders(prev => prev.map(o => o.id === id ? { ...o, enabled: !o.enabled } : o))
  const remove = (id) => setOrders(prev => prev.filter(o => o.id !== id))
  const addRow = () => setOrders(prev => [...prev, { id: Date.now(), exchange:'NSE', symbol:'', side:'BUY', qty:0, price:'0', product:'MIS', orderType:'LMT', enabled:true }])

  const enabledCount = orders.filter(o => o.enabled).length
  const totalValue = orders.filter(o => o.enabled).reduce((a, o) => a + (parseFloat(o.price||0) * o.qty), 0)

  const submitAll = () => {
    setSubmitting(true); setSubmitted(0)
    let i = 0
    const interval = setInterval(() => {
      if (i >= enabledCount) { clearInterval(interval); setSubmitting(false); return }
      i++; setSubmitted(i)
    }, 300)
  }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--bg-panel)' }}>
      <div style={{ height:28, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(90deg, #22c55e, #1565C0)', color:'#fff', fontWeight:700, fontSize:12, letterSpacing:2 }}>
        📦 BASKET ORDER
      </div>
      <div style={{ display:'flex', gap:6, padding:'4px 8px', background:'rgba(0,0,0,0.1)', alignItems:'center', fontSize:9 }}>
        <span style={{ color:'#7a7a8c' }}>Orders: <b style={{ color:'#d0d0d8' }}>{enabledCount}/{orders.length}</b></span>
        <span style={{ color:'#7a7a8c' }}>Value: <b style={{ color:'var(--accent)' }}>₹{totalValue.toLocaleString()}</b></span>
        <span style={{ marginLeft:'auto' }}>
          <button onClick={addRow} style={{ height:18, padding:'0 8px', background:'var(--accent)', color:'#000', border:'none', fontSize:8, fontWeight:700, cursor:'pointer' }}>+ Add Row</button>
        </span>
      </div>
      <div style={{ flex:1, overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'var(--grid-font)', fontSize:10 }}>
          <thead>
            <tr style={{ background:'rgba(255,255,255,0.04)' }}>
              <th style={thS}>✓</th><th style={thS}>#</th><th style={thS}>Exch</th><th style={thS}>Symbol</th>
              <th style={thS}>Side</th><th style={thS}>Qty</th><th style={thS}>Price</th><th style={thS}>Product</th>
              <th style={thS}>Type</th><th style={thS}>Value</th><th style={thS}>✕</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={o.id} style={{ borderBottom:'1px solid rgba(42,42,68,0.3)', opacity: o.enabled ? 1 : 0.4, background: i%2===0 ? 'var(--bg-row-even)' : 'var(--bg-row-odd)' }}>
                <td style={tdS}><input type="checkbox" checked={o.enabled} onChange={()=>toggle(o.id)} style={{ accentColor:'#00bcd4' }} /></td>
                <td style={tdS}>{i+1}</td>
                <td style={tdS}>{o.exchange}</td>
                <td style={{...tdS, fontWeight:600, textAlign:'left'}}>{o.symbol || '—'}</td>
                <td style={{...tdS, color: o.side==='BUY' ? '#4dabf7' : '#ff6b6b', fontWeight:700}}>{o.side}</td>
                <td style={tdS}>{o.qty}</td>
                <td style={tdS}>{o.price}</td>
                <td style={tdS}>{o.product}</td>
                <td style={tdS}>{o.orderType}</td>
                <td style={{...tdS, color:'var(--accent)'}}>₹{(parseFloat(o.price||0)*o.qty).toLocaleString()}</td>
                <td style={tdS}><button onClick={()=>remove(o.id)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:10 }}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {submitting && (
        <div style={{ height:3, background:'#1a1a2e' }}>
          <div style={{ height:'100%', background:'var(--accent)', width:`${(submitted/enabledCount)*100}%`, transition:'width 0.2s' }} />
        </div>
      )}
      <div style={{ display:'flex', gap:6, padding:'8px 10px', borderTop:'1px solid var(--border)' }}>
        <button onClick={submitAll} disabled={submitting || enabledCount===0} style={{ flex:1, height:28, background: submitting ? '#2a2a44' : '#22c55e', color:'#000', border:'none', fontSize:11, fontWeight:700, cursor:'pointer' }}>
          {submitting ? `⏳ Submitting ${submitted}/${enabledCount}...` : `⚡ Execute Basket (${enabledCount} orders)`}
        </button>
        <button style={{ height:28, padding:'0 12px', background:'#2a2a44', color:'#d0d0d8', border:'1px solid #3a3a5a', fontSize:10, cursor:'pointer' }}>Clear All</button>
      </div>
    </div>
  )
}
const thS = { padding:'3px 6px', color:'#6a6a7a', fontSize:9, fontWeight:600, textAlign:'center', borderBottom:'1px solid var(--border)' }
const tdS = { padding:'3px 6px', height:22, textAlign:'center' }
