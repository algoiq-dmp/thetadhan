import { useState, useEffect } from 'react'
import useAppStore from '../stores/useAppStore'
import engineConnector from '../../services/engineConnector'
import InlineSettings, { SField, SSel, SChk, GearBtn } from '../components/InlineSettings'

export default function OrderForm({ side = 'buy' }) {
  const isBuy = side === 'buy'
  const color = isBuy ? '#1565C0' : '#C62828'
  const bgColor = isBuy ? '#0d2844' : '#3a0f0f'
  const selectedSymbol = useAppStore(s => s.getSelectedSymbol())
  const addMessage = useAppStore(s => s.addMessage)
  const refreshPortfolio = useAppStore(s => s.refreshPortfolio)

  const [formData, setFormData] = useState({
    exchange: 'NSE', exchangeSegment: 'NSE_FNO', instrument: 'OPTIDX', symbol: '', 
    expiry: '', strike: '', optionType: 'CE', product: 'INTRADAY', orderType: 'MARKET',
    qty: '50', price: '0', triggerPrice: '', disclosedQty: '', validity: 'DAY',
    securityId: '',
  })
  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }))

  // Auto-fill from selected symbol
  useEffect(() => {
    if (selectedSymbol) {
      setFormData(p => ({
        ...p,
        symbol: selectedSymbol.symbol,
        securityId: selectedSymbol.securityId || selectedSymbol.token,
        exchangeSegment: selectedSymbol.exchange_segment || 'NSE_FNO',
        qty: String(selectedSymbol.lotSize || 50),
        price: selectedSymbol.ltp > 0 ? selectedSymbol.ltp.toFixed(2) : p.price,
        strike: selectedSymbol.strikePrice || '',
        optionType: selectedSymbol.optionType || 'CE',
        expiry: selectedSymbol.expiry || '',
      }))
    }
  }, [selectedSymbol?.token])

  const [showSettings, setShowSettings] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // { success, orderId, error }
  const [ordSettings, setOrdSettings] = useState({
    defaultProduct: 'INTRADAY', defaultOrderType: 'MARKET', defaultValidity: 'DAY', qtyMultiplier: '1',
    showDepth: true, confirmSubmit: true, autoLotCalc: true
  })
  const setOs = (k, v) => setOrdSettings(p => ({ ...p, [k]: v }))

  // Depth data
  const [depth, setDepth] = useState({ buy: Array(5).fill({qty:0,price:0}), sell: Array(5).fill({qty:0,price:0}) })
  useEffect(() => {
    if (!formData.securityId) return
    const loadDepth = async () => {
      const seg = formData.exchangeSegment || 'NSE_FNO'
      const data = await engineConnector.getFullQuote({ [seg]: [String(formData.securityId)] })
      if (data && data[seg]) {
        const q = data[seg][String(formData.securityId)]
        if (q && q.depth) {
          setDepth({
            buy: (q.depth.buy || []).slice(0, 5).map(d => ({ qty: d.quantity || 0, price: d.price || 0 })),
            sell: (q.depth.sell || []).slice(0, 5).map(d => ({ qty: d.quantity || 0, price: d.price || 0 })),
          })
        }
      }
    }
    loadDepth()
    const timer = setInterval(loadDepth, 5000)
    return () => clearInterval(timer)
  }, [formData.securityId])

  const submitOrder = async () => {
    setSubmitting(true); setResult(null)
    try {
      const order = {
        side: isBuy ? 'BUY' : 'SELL',
        transactionType: isBuy ? 'BUY' : 'SELL',
        exchangeSegment: formData.exchangeSegment,
        productType: formData.product,
        orderType: formData.orderType,
        validity: formData.validity,
        securityId: formData.securityId,
        quantity: parseInt(formData.qty) || 0,
        price: formData.orderType === 'MARKET' || formData.orderType === 'SL-M' ? 0 : parseFloat(formData.price) || 0,
        triggerPrice: parseFloat(formData.triggerPrice) || 0,
        disclosedQuantity: parseInt(formData.disclosedQty) || 0,
      }
      const res = await engineConnector.placeOrder(order)
      if (res.success) {
        setResult({ success: true, orderId: res.orderId })
        addMessage('order', `✓ ${isBuy ? 'BUY' : 'SELL'} ${formData.symbol} ${formData.qty}@${formData.orderType === 'MARKET' ? 'MKT' : formData.price} placed (${res.orderId})`)
        setTimeout(() => refreshPortfolio(), 1000)
      } else {
        setResult({ success: false, error: res.error })
        addMessage('rejection', `✗ ${isBuy ? 'BUY' : 'SELL'} ${formData.symbol} rejected: ${res.error}`)
      }
    } catch (err) {
      setResult({ success: false, error: err.message })
      addMessage('rejection', `✗ Order failed: ${err.message}`)
    }
    setSubmitting(false)
    setShowConfirm(false)
  }

  const fieldStyle = {
    display: 'flex', alignItems: 'center', height: 24, marginBottom: 1,
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  }
  const labelStyle = {
    width: 85, fontSize: 10, color: '#9aa0b0', textAlign: 'right',
    paddingRight: 8, flexShrink: 0, fontFamily: 'var(--ui-font)'
  }
  const inputStyle = {
    height: 20, background: '#0a0a1a', border: '1px solid #2a2a44',
    color: '#e0e0e8', padding: '0 6px', fontFamily: 'var(--grid-font)',
    fontSize: 11, outline: 'none', width: '100%'
  }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: bgColor }}>
      {/* Header */}
      <div style={{
        height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: color, color: 'white', fontWeight: 700, fontSize: 12,
        letterSpacing: 2, textTransform: 'uppercase',
        fontFamily: 'var(--ui-font)', position: 'relative'
      }}>
        {isBuy ? '▲ BUY ORDER' : '▼ SELL ORDER'}
        <div style={{ position: 'absolute', right: 4, top: 4 }}>
          <GearBtn onClick={() => setShowSettings(s => !s)} />
        </div>
      </div>

      {/* Order Settings */}
      <InlineSettings show={showSettings} onClose={() => setShowSettings(false)} title="Order Settings">
        <SField label="Default Product"><SSel value={ordSettings.defaultProduct} options={['INTRADAY','CNC','MARGIN','CO','BO']} onChange={v => setOs('defaultProduct', v)} /></SField>
        <SField label="Default Type"><SSel value={ordSettings.defaultOrderType} options={['MARKET','LIMIT','STOP_LOSS','STOP_LOSS_MARKET']} onChange={v => setOs('defaultOrderType', v)} /></SField>
        <SField label="Default Validity"><SSel value={ordSettings.defaultValidity} options={['DAY','IOC']} onChange={v => setOs('defaultValidity', v)} /></SField>
        <SChk checked={ordSettings.showDepth} label="Show Depth" onChange={v => setOs('showDepth', v)} />
        <SChk checked={ordSettings.confirmSubmit} label="Confirm Before Submit" onChange={v => setOs('confirmSubmit', v)} />
      </InlineSettings>

      {/* Result banner */}
      {result && (
        <div style={{ padding: '4px 8px', fontSize: 10, fontWeight: 600, textAlign: 'center',
          background: result.success ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          color: result.success ? '#22c55e' : '#ef4444', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {result.success ? `✓ Order placed: ${result.orderId}` : `✗ ${result.error}`}
        </div>
      )}

      {/* Form Fields */}
      <div style={{ padding: '4px 8px', flex: 1, overflow: 'auto' }}>
        {/* Exchange Segment */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Segment</span>
          <select style={selectStyle} value={formData.exchangeSegment} onChange={e => set('exchangeSegment', e.target.value)}>
            <option value="NSE_FNO">NSE F&O</option><option value="NSE_EQ">NSE Equity</option>
            <option value="BSE_FNO">BSE F&O</option><option value="BSE_EQ">BSE Equity</option>
            <option value="MCX_COMM">MCX</option>
          </select>
        </div>

        {/* Symbol / Security ID */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Symbol</span>
          <input style={{ ...inputStyle, width: '60%' }} value={formData.symbol} onChange={e => set('symbol', e.target.value)} placeholder="Select from MarketWatch" />
        </div>
        <div style={fieldStyle}>
          <span style={labelStyle}>Security ID</span>
          <input style={{ ...inputStyle, width: 120 }} value={formData.securityId} onChange={e => set('securityId', e.target.value)} placeholder="Dhan ID" />
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }}/>

        {/* Product Type — Dhan format */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Product</span>
          <div style={{ display: 'flex', gap: 8, fontSize: 10 }}>
            {['INTRADAY','CNC','MARGIN'].map(p => (
              <label key={p} style={{ display:'flex', alignItems:'center', gap:3, color:'#d0d0d8', cursor:'pointer' }}>
                <input type="radio" name={`prod_${side}`} value={p} checked={formData.product===p}
                  onChange={() => set('product',p)} style={{ accentColor: color, width:12, height:12 }}/>{p}
              </label>
            ))}
          </div>
        </div>

        {/* Order Type — Dhan format */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Order Type</span>
          <div style={{ display: 'flex', gap: 8, fontSize: 10 }}>
            {['MARKET','LIMIT','STOP_LOSS','STOP_LOSS_MARKET'].map(t => (
              <label key={t} style={{ display:'flex', alignItems:'center', gap:3, color:'#d0d0d8', cursor:'pointer', fontSize: 9 }}>
                <input type="radio" name={`ot_${side}`} value={t} checked={formData.orderType===t}
                  onChange={() => set('orderType',t)} style={{ accentColor: color, width:12, height:12 }}/>{t.replace('_',' ')}
              </label>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Quantity</span>
          <input style={{ ...inputStyle, width: 80 }} type="number" value={formData.qty}
            onChange={e => set('qty', e.target.value)} />
        </div>

        {/* Price */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Price</span>
          <input style={{ ...inputStyle, width: 100, color: isBuy ? '#4dabf7' : '#ff6b6b', fontWeight: 600 }}
            value={formData.price} onChange={e => set('price', e.target.value)}
            disabled={formData.orderType === 'MARKET' || formData.orderType === 'STOP_LOSS_MARKET'} />
        </div>

        {/* Trigger Price */}
        {(formData.orderType === 'STOP_LOSS' || formData.orderType === 'STOP_LOSS_MARKET') && (
          <div style={fieldStyle}>
            <span style={labelStyle}>Trigger Price</span>
            <input style={{ ...inputStyle, width: 100 }} value={formData.triggerPrice}
              onChange={e => set('triggerPrice', e.target.value)} />
          </div>
        )}

        {/* Validity */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Validity</span>
          <div style={{ display: 'flex', gap: 12, fontSize: 10 }}>
            {['DAY','IOC'].map(v => (
              <label key={v} style={{ display:'flex', alignItems:'center', gap:3, color:'#d0d0d8', cursor:'pointer' }}>
                <input type="radio" name={`val_${side}`} value={v} checked={formData.validity===v}
                  onChange={() => set('validity',v)} style={{ accentColor: color, width:12, height:12 }}/>{v}
              </label>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }}/>

        {/* Market Depth */}
        {ordSettings.showDepth && (
          <>
            <div style={{ fontSize: 9, color: '#7a7a8c', padding: '2px 0', textTransform: 'uppercase', letterSpacing: 1 }}>
              ── Market Depth ─ {formData.symbol} ──
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--grid-font)', fontSize: 10 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <th style={{ textAlign:'right', padding:'2px 4px', color:'#6a6a7a', fontWeight:500, fontSize:9 }}>BID QTY</th>
                  <th style={{ textAlign:'right', padding:'2px 4px', color:'#1565C0', fontWeight:500, fontSize:9 }}>BID</th>
                  <th style={{ textAlign:'right', padding:'2px 4px', color:'#C62828', fontWeight:500, fontSize:9 }}>ASK</th>
                  <th style={{ textAlign:'right', padding:'2px 4px', color:'#6a6a7a', fontWeight:500, fontSize:9 }}>ASK QTY</th>
                </tr>
              </thead>
              <tbody>
                {depth.buy.map((b, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(42,42,68,0.3)' }}>
                    <td style={{ textAlign:'right', padding:'1px 4px', height:16, color:'#d0d0d8' }}>{b.qty}</td>
                    <td style={{ textAlign:'right', padding:'1px 4px', color:'#4dabf7', fontWeight:600 }}>{b.price > 0 ? b.price.toFixed(2) : '—'}</td>
                    <td style={{ textAlign:'right', padding:'1px 4px', color:'#ff6b6b', fontWeight:600 }}>{depth.sell[i]?.price > 0 ? depth.sell[i].price.toFixed(2) : '—'}</td>
                    <td style={{ textAlign:'right', padding:'1px 4px', color:'#d0d0d8' }}>{depth.sell[i]?.qty || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'#6a6a7a', padding:'3px 0', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
              <span>Total Bid: <b style={{color:'#4dabf7'}}>{depth.buy.reduce((a,b) => a + b.qty, 0).toLocaleString()}</b></span>
              <span>Total Ask: <b style={{color:'#ff6b6b'}}>{depth.sell.reduce((a,b) => a + b.qty, 0).toLocaleString()}</b></span>
            </div>
          </>
        )}
      </div>

      {/* Submit Buttons */}
      <div style={{
        display: 'flex', gap: 6, padding: '6px 8px',
        borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)'
      }}>
        <button style={{
          flex: 1, height: 28, background: submitting ? '#555' : color, color: 'white',
          border: 'none', fontWeight: 700, fontSize: 11, cursor: submitting ? 'wait' : 'pointer',
          letterSpacing: 1, fontFamily: 'var(--ui-font)'
        }} disabled={submitting} onClick={() => ordSettings.confirmSubmit ? setShowConfirm(true) : submitOrder()}>
          {submitting ? '⏳ Sending...' : `⚡ ${isBuy ? 'SUBMIT BUY' : 'SUBMIT SELL'}`}
        </button>
        <button onClick={() => setFormData(p => ({ ...p, qty: '50', price: '0', triggerPrice: '', disclosedQty: '' }))}
          style={{ width: 65, height: 28, background: '#2a2a44', color: '#d0d0d8', border: '1px solid #3a3a5a', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--ui-font)' }}>RESET</button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: isBuy ? '#4dabf7' : '#ff6b6b', marginBottom: 8 }}>
              CONFIRM {isBuy ? 'BUY' : 'SELL'} ORDER
            </div>
            <div style={{ fontSize: 10, color: '#d0d0d8', marginBottom: 6, lineHeight: 1.6 }}>
              <b>{formData.symbol}</b> ({formData.securityId})<br/>
              {formData.product} │ {formData.orderType} │ Qty: <b>{formData.qty}</b><br/>
              Price: <b>{formData.orderType === 'MARKET' ? 'MKT' : '₹' + formData.price}</b> │ Validity: {formData.validity}
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowConfirm(false)} style={{ height: 24, padding: '0 12px', background: '#2a2a44', color: '#d0d0d8', border: '1px solid #3a3a5a', fontSize: 10, cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitOrder} disabled={submitting} style={{ height: 24, padding: '0 16px', background: color, color: '#fff', border: 'none', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                {submitting ? '⏳...' : `Confirm ${isBuy ? 'Buy' : 'Sell'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
