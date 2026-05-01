import { useState } from 'react'
import useAppStore from '../stores/useAppStore'
import engineConnector from '../../services/engineConnector'

export default function PTSTOrder() {
  const [f, setF] = useState({
    exchange:'NSE', symbol:'NIFTY', instrument:'OPTIDX', expiry:'24-APR-2026', strike:'24200', optType:'CE',
    side:'BUY', qty:'50', price:'142.00', product:'MIS', orderType:'LIMIT',
    clientCode:'', proTradeId:'', ctclId:'', dealerName:'', remarks:'', ptst:'Pro'
  })
  const s = (k,v) => setF(p=>({...p,[k]:v}))
  const isPro = f.ptst === 'Pro'

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--bg-panel)' }}>
      <div style={{ height:28, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(90deg,#ef4444,#eab308)', color:'#fff', fontWeight:700, fontSize:12, letterSpacing:1 }}>
        🏛 PRO / SELF TRADE (PTST)
      </div>
      <div style={{ display:'flex', gap:4, padding:'4px 8px', background:'rgba(0,0,0,0.1)' }}>
        {['Pro','Self'].map(m=>(
          <button key={m} onClick={()=>s('ptst',m)} style={{ flex:1, padding:'3px', fontSize:10, border:'1px solid var(--border)', cursor:'pointer', fontWeight:f.ptst===m?700:400, background:f.ptst===m?'rgba(239,68,68,0.15)':'transparent', color:f.ptst===m?'#ef4444':'#7a7a8c' }}>{m} Trade</button>
        ))}
      </div>
      <div style={{ flex:1, overflow:'auto', padding:'6px 10px' }}>
        {isPro && (
          <div style={{ marginBottom:6, padding:'6px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', fontSize:9, color:'#ef4444' }}>
            ⚠ PRO TRADE: Orders will be placed from broker's proprietary account. SEBI margin rules apply separately.
          </div>
        )}
        {[['Exchange','exchange',['NSE','BSE']],['Symbol','symbol'],['Instrument','instrument',['OPTIDX','OPTSTK','FUTIDX','EQ']],
          ['Expiry','expiry',['24-APR-2026','01-MAY-2026']],['Strike','strike'],['Option Type','optType',['CE','PE']],
          ['Side','side',['BUY','SELL']],['Qty','qty'],['Price','price'],['Order Type','orderType',['LIMIT','MARKET','SL','SL-M']],
          ['Product','product',['MIS','NRML','CNC']]].map(([lbl,k,opts])=>(
          <div key={k} style={fS}>
            <span style={lS}>{lbl}</span>
            {opts ? <select value={f[k]} onChange={e=>s(k,e.target.value)} style={iS}>{opts.map(o=><option key={o}>{o}</option>)}</select>
             : <input value={f[k]} onChange={e=>s(k,e.target.value)} style={iS} />}
          </div>
        ))}
        <div style={{ height:1, background:'rgba(42,42,68,0.5)', margin:'6px 0' }} />
        <div style={{ fontSize:10, fontWeight:600, color:'#eab308', marginBottom:4 }}>── COMPLIANCE FIELDS ──</div>
        {[['Client Code','clientCode','Required for Client trade'],['CTCL ID','ctclId','CTCL Terminal ID'],['Pro Trade ID','proTradeId','Proprietary Trade Reference'],['Dealer Name','dealerName','Authorized dealer'],['Remarks','remarks','Order remarks for audit']].map(([lbl,k,ph])=>(
          <div key={k} style={fS}>
            <span style={lS}>{lbl}</span>
            <input value={f[k]} onChange={e=>s(k,e.target.value)} placeholder={ph} style={iS} />
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:6, padding:'8px 10px', borderTop:'1px solid var(--border)' }}>
        <button onClick={async () => {
          const addMessage = useAppStore.getState().addMessage
          const order = {
            transactionType: f.side, exchangeSegment: 'NSE_FNO', productType: f.product === 'MIS' ? 'INTRADAY' : f.product === 'CNC' ? 'CNC' : 'MARGIN',
            orderType: f.orderType, validity: 'DAY', securityId: f.symbol,
            quantity: parseInt(f.qty) || 0, price: parseFloat(f.price) || 0,
          }
          const res = await engineConnector.placeOrder(order)
          if (res.success) addMessage('order', `✓ ${f.ptst} ${f.side} placed: ${res.orderId}`)
          else addMessage('rejection', `✗ ${f.ptst} order failed: ${res.error}`)
        }} style={{ flex:1, height:28, background: isPro ? '#ef4444' : '#1565C0', color:'#fff', border:'none', fontSize:11, fontWeight:700, cursor:'pointer' }}>
          Submit {f.ptst} {f.side} Order
        </button>
      </div>
    </div>
  )
}
const fS={display:'flex',alignItems:'center',height:24,marginBottom:1,borderBottom:'1px solid rgba(255,255,255,0.04)'}
const lS={width:85,fontSize:10,color:'#9aa0b0',textAlign:'right',paddingRight:8,flexShrink:0}
const iS={height:20,background:'#0a0a1a',border:'1px solid #2a2a44',color:'#e0e0e8',padding:'0 6px',fontSize:11,fontFamily:'var(--grid-font)',outline:'none',flex:1}
