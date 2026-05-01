import { useState, useEffect } from 'react'
import useAppStore from '../stores/useAppStore'
import engineConnector from '../../services/engineConnector'

const EMPTY_DEPTH = { buy: Array(5).fill({qty:0,price:0}), sell: Array(5).fill({qty:0,price:0}) }

export default function MarketPicture() {
  const symbols = useAppStore(s => s.symbols)
  const selectedToken = useAppStore(s => s.selectedToken)
  const sym = symbols.find(s => s.token === selectedToken) || symbols[0] || { symbol:'—', ltp:0, chg:0, chgP:0, open:0, high:0, low:0, close:0, vol:0, atp:0, oi:0, oiChg:0, totalBuyQty:0, totalSellQty:0, w52High:0, w52Low:0, upperCkt:0, lowerCkt:0, turnover:0 }
  const [depth, setDepth] = useState(EMPTY_DEPTH)

  // Load live depth
  useEffect(() => {
    if (!sym?.securityId && !sym?.token) return
    const loadDepth = async () => {
      const seg = sym.exchange_segment || 'NSE_FNO'
      const id = String(sym.securityId || sym.token)
      const data = await engineConnector.getFullQuote({ [seg]: [id] })
      if (data && data[seg] && data[seg][id] && data[seg][id].depth) {
        const q = data[seg][id]
        setDepth({
          buy: (q.depth.buy || []).slice(0,5).map(d => ({ qty: d.quantity || 0, price: d.price || 0 })),
          sell: (q.depth.sell || []).slice(0,5).map(d => ({ qty: d.quantity || 0, price: d.price || 0 })),
        })
      }
    }
    loadDepth()
    const timer = setInterval(loadDepth, 5000)
    return () => clearInterval(timer)
  }, [sym?.token])

  const chgClass = sym.chg >= 0 ? 'price-up' : 'price-down'
  const totalBuy = depth.buy.reduce((a, b) => a + b.qty, 0)
  const totalSell = depth.sell.reduce((a, b) => a + b.qty, 0)
  const tradedVal = (sym.vol || 0) * (sym.atp || 0)

  const rowStyle = {
    display: 'flex', justifyContent: 'space-between', padding: '3px 10px',
    borderBottom: '1px solid rgba(42,42,68,0.4)', fontSize: 11
  }
  const labelStyle = { color: '#7a7a8c', fontSize: 10 }
  const valStyle = { color: '#d0d0d8', fontWeight: 600, fontFamily: 'var(--grid-font)' }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)' }}>
      {/* Symbol Header */}
      <div style={{
        padding: '6px 12px', background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12
      }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-bright)' }}>{sym.symbol}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sym.exchange}</span>
        {sym.expiry && <span style={{ fontSize: 9, color: '#eab308' }}>{sym.expiry}</span>}
        <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 16 }} className={chgClass}>
          {sym.ltp.toFixed(2)}
        </span>
        <span className={chgClass} style={{ fontSize: 11 }}>
          {sym.chg >= 0 ? '+' : ''}{sym.chg.toFixed(2)} ({sym.chg >= 0 ? '+' : ''}{sym.chgP.toFixed(2)}%)
        </span>
      </div>

      {/* OHLC Grid */}
      <div style={{ padding: '2px 0' }}>
        <div style={rowStyle}>
          <span><span style={labelStyle}>Open: </span><span style={valStyle}>{sym.open.toFixed(2)}</span></span>
          <span><span style={labelStyle}>High: </span><span style={{ ...valStyle, color: '#22c55e' }}>{sym.high.toFixed(2)}</span></span>
        </div>
        <div style={rowStyle}>
          <span><span style={labelStyle}>Low: </span><span style={{ ...valStyle, color: '#ef4444' }}>{sym.low.toFixed(2)}</span></span>
          <span><span style={labelStyle}>Prev Close: </span><span style={valStyle}>{sym.close.toFixed(2)}</span></span>
        </div>
        <div style={rowStyle}>
          <span><span style={labelStyle}>Volume: </span><span style={valStyle}>{sym.vol >= 100000 ? (sym.vol/100000).toFixed(2) + ' L' : sym.vol.toLocaleString()}</span></span>
          <span><span style={labelStyle}>ATP: </span><span style={valStyle}>{sym.atp.toFixed(2)}</span></span>
        </div>
        <div style={rowStyle}>
          <span><span style={labelStyle}>LTQ: </span><span style={valStyle}>{sym.ltq?.toLocaleString() || '—'}</span></span>
          <span><span style={labelStyle}>Lot Size: </span><span style={valStyle}>{sym.lotSize?.toLocaleString() || '—'}</span></span>
        </div>
        <div style={rowStyle}>
          <span><span style={labelStyle}>52W High: </span><span style={{ ...valStyle, color: '#22c55e' }}>{sym.w52High > 0 ? sym.w52High.toFixed(2) : '—'}</span></span>
          <span><span style={labelStyle}>52W Low: </span><span style={{ ...valStyle, color: '#ef4444' }}>{sym.w52Low > 0 ? sym.w52Low.toFixed(2) : '—'}</span></span>
        </div>
        <div style={rowStyle}>
          <span><span style={labelStyle}>Upper Ckt: </span><span style={valStyle}>{sym.upperCkt > 0 ? sym.upperCkt.toFixed(2) : '—'}</span></span>
          <span><span style={labelStyle}>Lower Ckt: </span><span style={valStyle}>{sym.lowerCkt > 0 ? sym.lowerCkt.toFixed(2) : '—'}</span></span>
        </div>
        <div style={rowStyle}>
          <span><span style={labelStyle}>Tot Buy Qty: </span><span style={{ ...valStyle, color: '#4dabf7' }}>{sym.totalBuyQty >= 100000 ? (sym.totalBuyQty / 100000).toFixed(1) + 'L' : sym.totalBuyQty?.toLocaleString()}</span></span>
          <span><span style={labelStyle}>Tot Sell Qty: </span><span style={{ ...valStyle, color: '#ff6b6b' }}>{sym.totalSellQty >= 100000 ? (sym.totalSellQty / 100000).toFixed(1) + 'L' : sym.totalSellQty?.toLocaleString()}</span></span>
        </div>
        {sym.oi > 0 && (
          <div style={rowStyle}>
            <span><span style={labelStyle}>Open Int: </span><span style={valStyle}>{(sym.oi/100000).toFixed(1)} L</span></span>
            <span><span style={labelStyle}>OI Chg: </span><span style={{ ...valStyle, color: sym.oiChg >= 0 ? '#22c55e' : '#ef4444' }}>{sym.oiChg >= 0 ? '+' : ''}{(sym.oiChg/100000).toFixed(1)} L</span></span>
          </div>
        )}
        {sym.expiry && (
          <div style={rowStyle}>
            <span><span style={labelStyle}>Expiry: </span><span style={{ ...valStyle, color: '#eab308' }}>{sym.expiry}</span></span>
            <span><span style={labelStyle}>Strike: </span><span style={valStyle}>{sym.strikePrice || '—'} {sym.optionType || ''}</span></span>
          </div>
        )}
      </div>

      {/* Depth Section */}
      <div style={{ fontSize: 9, color: '#6a6a7a', padding: '4px 10px', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: 1 }}>
        ── Market Depth ──
      </div>
      <div style={{ flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--grid-font)', fontSize: 10 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              <th style={{ textAlign: 'center', padding: '3px', color: '#1565C0', fontSize: 9, fontWeight: 600 }} colSpan={2}>BUY SIDE</th>
              <th style={{ textAlign: 'center', padding: '3px', color: '#C62828', fontSize: 9, fontWeight: 600 }} colSpan={2}>SELL SIDE</th>
            </tr>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ textAlign: 'right', padding: '2px 6px', color: '#6a6a7a', fontSize: 9 }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '2px 6px', color: '#6a6a7a', fontSize: 9 }}>Price</th>
              <th style={{ textAlign: 'right', padding: '2px 6px', color: '#6a6a7a', fontSize: 9 }}>Price</th>
              <th style={{ textAlign: 'right', padding: '2px 6px', color: '#6a6a7a', fontSize: 9 }}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {depth.buy.map((b, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(42,42,68,0.3)' }}>
                <td style={{ textAlign: 'right', padding: '2px 6px', height: 20 }}>{b.qty}</td>
                <td style={{ textAlign: 'right', padding: '2px 6px', color: '#4dabf7', fontWeight: 600 }}>{b.price > 0 ? b.price.toFixed(2) : '—'}</td>
                <td style={{ textAlign: 'right', padding: '2px 6px', color: '#ff6b6b', fontWeight: 600 }}>{depth.sell[i]?.price > 0 ? depth.sell[i].price.toFixed(2) : '—'}</td>
                <td style={{ textAlign: 'right', padding: '2px 6px' }}>{depth.sell[i]?.qty || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ padding: '4px 10px', borderTop: '1px solid var(--border)', fontSize: 10, display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.1)' }}>
        <span style={{ color: '#7a7a8c' }}>Total Buy: <b style={{ color: '#4dabf7' }}>{totalBuy.toLocaleString()}</b></span>
        <span style={{ color: '#7a7a8c' }}>Total Sell: <b style={{ color: '#ff6b6b' }}>{totalSell.toLocaleString()}</b></span>
      </div>
      <div style={{ padding: '4px 10px', borderTop: '1px solid rgba(42,42,68,0.3)', fontSize: 10, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#7a7a8c' }}>Traded Val: <b style={{ color: 'var(--accent)' }}>₹{tradedVal >= 10000000 ? (tradedVal / 10000000).toFixed(2) + 'Cr' : (tradedVal / 100000).toFixed(2) + 'L'}</b></span>
        <span style={{ color: '#7a7a8c' }}>Turnover: <b style={{ color: '#d0d0d8' }}>₹{sym.turnover >= 100000 ? (sym.turnover / 100000).toFixed(1) + 'L' : sym.turnover?.toLocaleString()}</b></span>
      </div>
    </div>
  )
}
