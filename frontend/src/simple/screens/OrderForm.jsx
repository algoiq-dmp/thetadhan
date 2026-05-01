import { useState } from 'react'
import { MOCK_DEPTH } from '../mock/data'
import InlineSettings, { SField, SSel, SChk, GearBtn } from '../components/InlineSettings'

const LOT_SIZES = { NIFTY: 75, BANKNIFTY: 30, RELIANCE: 250, TCS: 175, INFY: 300, HDFCBANK: 550, SBIN: 1500 }

export default function OrderForm({ side = 'buy' }) {
  const isBuy = side === 'buy'
  const color = isBuy ? '#1565C0' : '#C62828'
  const bgColor = isBuy ? '#0d2844' : '#3a0f0f'
  const [formData, setFormData] = useState({
    exchange: 'NSE', instrument: 'OPTIDX', symbol: 'NIFTY', expiry: '24-APR-2025',
    strike: '24200', optionType: 'CE', product: 'MIS', orderType: 'LIMIT',
    qty: '50', price: '142.00', triggerPrice: '', disclosedQty: '', validity: 'DAY'
  })
  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }))
  const [showSettings, setShowSettings] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [ordSettings, setOrdSettings] = useState({
    defaultProduct: 'MIS', defaultOrderType: 'LMT', defaultValidity: 'DAY', qtyMultiplier: '1',
    showDepth: true, confirmSubmit: true, autoLotCalc: true
  })
  const setOs = (k, v) => setOrdSettings(p => ({ ...p, [k]: v }))

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
        <SField label="Default Product"><SSel value={ordSettings.defaultProduct} options={['MIS','NRML','CNC']} onChange={v => setOs('defaultProduct', v)} /></SField>
        <SField label="Default Type"><SSel value={ordSettings.defaultOrderType} options={['MKT','LMT','SL','SL-M']} onChange={v => setOs('defaultOrderType', v)} /></SField>
        <SField label="Default Validity"><SSel value={ordSettings.defaultValidity} options={['DAY','IOC','GTD']} onChange={v => setOs('defaultValidity', v)} /></SField>
        <SField label="Qty Multiplier"><SSel value={ordSettings.qtyMultiplier} options={['1','2','5','10','25']} onChange={v => setOs('qtyMultiplier', v)} /></SField>
        <SChk checked={ordSettings.showDepth} label="Show Depth" onChange={v => setOs('showDepth', v)} />
        <SChk checked={ordSettings.confirmSubmit} label="Confirm Before Submit" onChange={v => setOs('confirmSubmit', v)} />
        <SChk checked={ordSettings.autoLotCalc} label="Auto Lot Calc" onChange={v => setOs('autoLotCalc', v)} />
      </InlineSettings>

      {/* Form Fields */}
      <div style={{ padding: '4px 8px', flex: 1, overflow: 'auto' }}>
        {/* Exchange */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Exchange</span>
          <select style={selectStyle} value={formData.exchange} onChange={e => set('exchange', e.target.value)}>
            <option>NSE</option><option>BSE</option><option>MCX</option>
          </select>
        </div>

        {/* Instrument */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Instrument</span>
          <select style={selectStyle} value={formData.instrument} onChange={e => set('instrument', e.target.value)}>
            <option value="OPTIDX">OPTIDX</option><option value="FUTIDX">FUTIDX</option>
            <option value="OPTSTK">OPTSTK</option><option value="FUTSTK">FUTSTK</option>
            <option value="EQ">EQUITY</option>
          </select>
        </div>

        {/* Symbol */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Symbol</span>
          <input style={inputStyle} value={formData.symbol} onChange={e => set('symbol', e.target.value)} />
        </div>

        {/* Expiry */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Expiry</span>
          <select style={selectStyle} value={formData.expiry} onChange={e => set('expiry', e.target.value)}>
            <option>24-APR-2025</option><option>01-MAY-2025</option><option>29-MAY-2025</option><option>26-JUN-2025</option>
          </select>
        </div>

        {/* Strike Price + Option Type */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Strike Price</span>
          <select style={{ ...selectStyle, width: 90 }} value={formData.strike} onChange={e => set('strike', e.target.value)}>
            {[23800,23900,24000,24100,24200,24300,24400,24500,24600].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span style={{ width: 6 }}></span>
          <span style={labelStyle}>Opt Type</span>
          <select style={{ ...selectStyle, width: 60 }} value={formData.optionType} onChange={e => set('optionType', e.target.value)}>
            <option>CE</option><option>PE</option>
          </select>
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }}/>

        {/* Product Type */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Product</span>
          <div style={{ display: 'flex', gap: 12, fontSize: 10 }}>
            {['MIS','NRML','CNC'].map(p => (
              <label key={p} style={{ display:'flex', alignItems:'center', gap:3, color:'#d0d0d8', cursor:'pointer' }}>
                <input type="radio" name={`prod_${side}`} value={p} checked={formData.product===p}
                  onChange={() => set('product',p)} style={{ accentColor: color, width:12, height:12 }}/>{p}
              </label>
            ))}
          </div>
        </div>

        {/* Order Type */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Order Type</span>
          <div style={{ display: 'flex', gap: 10, fontSize: 10 }}>
            {['LIMIT','MARKET','SL','SL-M'].map(t => (
              <label key={t} style={{ display:'flex', alignItems:'center', gap:3, color:'#d0d0d8', cursor:'pointer' }}>
                <input type="radio" name={`ot_${side}`} value={t} checked={formData.orderType===t}
                  onChange={() => set('orderType',t)} style={{ accentColor: color, width:12, height:12 }}/>{t}
              </label>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Quantity</span>
          <input style={{ ...inputStyle, width: 80 }} type="number" value={formData.qty}
            onChange={e => set('qty', e.target.value)} />
          <span style={{ fontSize: 9, color: '#6a6a7a', marginLeft: 6 }}>
            Lots: {Math.ceil(parseInt(formData.qty || 0) / (LOT_SIZES[formData.symbol] || 75))}
            <span style={{ color: '#5a5a6a' }}> (Lot={LOT_SIZES[formData.symbol] || 75})</span>
          </span>
        </div>

        {/* Price */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Price</span>
          <input style={{ ...inputStyle, width: 100, color: isBuy ? '#4dabf7' : '#ff6b6b', fontWeight: 600 }}
            value={formData.price} onChange={e => set('price', e.target.value)}
            disabled={formData.orderType === 'MARKET' || formData.orderType === 'SL-M'} />
        </div>

        {/* Trigger Price */}
        {(formData.orderType === 'SL' || formData.orderType === 'SL-M') && (
          <div style={fieldStyle}>
            <span style={labelStyle}>Trigger Price</span>
            <input style={{ ...inputStyle, width: 100 }} value={formData.triggerPrice}
              onChange={e => set('triggerPrice', e.target.value)} />
          </div>
        )}

        {/* Disclosed Qty */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Disclosed Qty</span>
          <input style={{ ...inputStyle, width: 80 }} value={formData.disclosedQty}
            onChange={e => set('disclosedQty', e.target.value)} placeholder="0" />
        </div>

        {/* Validity */}
        <div style={fieldStyle}>
          <span style={labelStyle}>Validity</span>
          <div style={{ display: 'flex', gap: 12, fontSize: 10 }}>
            {['DAY','IOC','GTD'].map(v => (
              <label key={v} style={{ display:'flex', alignItems:'center', gap:3, color:'#d0d0d8', cursor:'pointer' }}>
                <input type="radio" name={`val_${side}`} value={v} checked={formData.validity===v}
                  onChange={() => set('validity',v)} style={{ accentColor: color, width:12, height:12 }}/>{v}
              </label>
            ))}
          </div>
          {formData.validity === 'GTD' && (
            <input type="date" style={{ ...inputStyle, width: 110, marginLeft: 8, fontSize: 9 }}
              onChange={e => set('gtdDate', e.target.value)} />
          )}
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }}/>

        {/* Market Depth */}
        <div style={{ fontSize: 9, color: '#7a7a8c', padding: '2px 0', textTransform: 'uppercase', letterSpacing: 1 }}>
          ── Market Depth ─ {formData.symbol} {formData.strike}{formData.optionType} ──
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
            {MOCK_DEPTH.buy.map((b, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(42,42,68,0.3)' }}>
                <td style={{ textAlign:'right', padding:'1px 4px', height:16, color:'#d0d0d8' }}>{b.qty}</td>
                <td style={{ textAlign:'right', padding:'1px 4px', color:'#4dabf7', fontWeight:600 }}>{b.price.toFixed(2)}</td>
                <td style={{ textAlign:'right', padding:'1px 4px', color:'#ff6b6b', fontWeight:600 }}>{MOCK_DEPTH.sell[i].price.toFixed(2)}</td>
                <td style={{ textAlign:'right', padding:'1px 4px', color:'#d0d0d8' }}>{MOCK_DEPTH.sell[i].qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'#6a6a7a', padding:'3px 0', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <span>Total Bid: <b style={{color:'#4dabf7'}}>{MOCK_DEPTH.buy.reduce((a,b) => a + b.qty, 0).toLocaleString()}</b></span>
          <span>Total Ask: <b style={{color:'#ff6b6b'}}>{MOCK_DEPTH.sell.reduce((a,b) => a + b.qty, 0).toLocaleString()}</b></span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#9aa0b0', padding:'2px 0' }}>
          <span>LTP: <b style={{color:'#22c55e'}}>142.00</b></span>
          <span>Chg: <b style={{color:'#22c55e'}}>+8.50 (+6.37%)</b></span>
        </div>
      </div>

      {/* Submit Buttons */}
      <div style={{
        display: 'flex', gap: 6, padding: '6px 8px',
        borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)'
      }}>
        <button style={{
          flex: 1, height: 28, background: color, color: 'white',
          border: 'none', fontWeight: 700, fontSize: 11, cursor: 'pointer',
          letterSpacing: 1, fontFamily: 'var(--ui-font)'
        }} onClick={() => ordSettings.confirmSubmit ? setShowConfirm(true) : null}>
          ⚡ {isBuy ? 'SUBMIT BUY' : 'SUBMIT SELL'}
        </button>
        <button onClick={() => setFormData(p => ({ ...p, qty: '50', price: '142.00', triggerPrice: '', disclosedQty: '' }))}
          style={{ width: 65, height: 28, background: '#2a2a44', color: '#d0d0d8', border: '1px solid #3a3a5a', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--ui-font)' }}>RESET</button>
        <button style={{ width: 65, height: 28, background: '#2a2a44', color: '#d0d0d8', border: '1px solid #3a3a5a', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--ui-font)' }}>CLOSE</button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: isBuy ? '#4dabf7' : '#ff6b6b', marginBottom: 8 }}>
              CONFIRM {isBuy ? 'BUY' : 'SELL'} ORDER
            </div>
            <div style={{ fontSize: 10, color: '#d0d0d8', marginBottom: 6, lineHeight: 1.6 }}>
              <b>{formData.symbol}</b> {formData.strike}{formData.optionType}<br/>
              {formData.product} │ {formData.orderType} │ Qty: <b>{formData.qty}</b><br/>
              Price: <b>{formData.orderType === 'MARKET' ? 'MKT' : '₹' + formData.price}</b> │ Validity: {formData.validity}
              {formData.disclosedQty && <><br/>Disclosed: {formData.disclosedQty}</>}
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowConfirm(false)} style={{ height: 24, padding: '0 12px', background: '#2a2a44', color: '#d0d0d8', border: '1px solid #3a3a5a', fontSize: 10, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { setShowConfirm(false); /* submit */ }} style={{ height: 24, padding: '0 16px', background: color, color: '#fff', border: 'none', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Confirm {isBuy ? 'Buy' : 'Sell'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
