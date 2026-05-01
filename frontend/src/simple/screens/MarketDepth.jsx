import { useState, useEffect } from 'react'
import useAppStore from '../stores/useAppStore'
import engineConnector from '../../services/engineConnector'

const EMPTY_DEPTH = { buy: Array(5).fill({qty:0,price:0}), sell: Array(5).fill({qty:0,price:0}) }

export default function MarketDepth() {
  const symbols = useAppStore(s => s.symbols)
  const selectedToken = useAppStore(s => s.selectedToken)
  const openWindow = useAppStore(s => s.openWindow)
  const sym = symbols.find(s => s.token === selectedToken) || symbols[0]
  const [depth, setDepth] = useState(EMPTY_DEPTH)

  // Load live depth
  useEffect(() => {
    if (!sym?.securityId && !sym?.token) return
    const loadDepth = async () => {
      const seg = sym.exchange_segment || 'NSE_FNO'
      const id = String(sym.securityId || sym.token)
      const data = await engineConnector.getFullQuote({ [seg]: [id] })
      if (data && data[seg] && data[seg][id]) {
        const q = data[seg][id]
        if (q.depth) {
          setDepth({
            buy: (q.depth.buy || []).slice(0,5).map(d => ({ qty: d.quantity || 0, price: d.price || 0 })),
            sell: (q.depth.sell || []).slice(0,5).map(d => ({ qty: d.quantity || 0, price: d.price || 0 })),
          })
        }
      }
    }
    loadDepth()
    const timer = setInterval(loadDepth, 3000)
    return () => clearInterval(timer)
  }, [sym?.token])

  const maxQty = Math.max(1, ...depth.buy.map(d => d.qty), ...depth.sell.map(d => d.qty))
  const totalBuy = depth.buy.reduce((a, b) => a + b.qty, 0)
  const totalSell = depth.sell.reduce((a, b) => a + b.qty, 0)
  const buyPercent = totalBuy + totalSell > 0 ? Math.round(totalBuy / (totalBuy + totalSell) * 100) : 50
  const spread = (depth.sell[0].price - depth.buy[0].price).toFixed(2)

  // Click depth price → open order pre-filled
  const onPriceClick = (price, side) => {
    openWindow({
      id: side === 'buy' ? 'buy' : 'sell',
      title: side === 'buy' ? 'Buy Order [F1]' : 'Sell Order [F2]',
      x: 50, y: 20, w: 380, h: 580
    })
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)' }}>
      {/* Header */}
      <div style={{
        padding: '5px 10px', background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10
      }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-bright)' }}>{sym.symbol}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sym.exchange}</span>
        <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 14 }}
          className={sym.chg >= 0 ? 'price-up' : 'price-down'}>
          {sym.ltp.toFixed(2)}
        </span>
        <span className={sym.chg >= 0 ? 'price-up' : 'price-down'} style={{ fontSize: 10 }}>
          {sym.chg >= 0 ? '+' : ''}{sym.chg.toFixed(2)} ({sym.chgP >= 0 ? '+' : ''}{sym.chgP.toFixed(2)}%)
        </span>
      </div>

      {/* Buy/Sell Pressure Bar */}
      <div style={{ display: 'flex', height: 14, margin: '0 10px', borderRadius: 2, overflow: 'hidden', fontSize: 8, fontWeight: 600 }}>
        <div style={{ width: `${buyPercent}%`, background: 'rgba(21,101,192,0.4)', color: '#4dabf7', textAlign: 'center', lineHeight: '14px' }}>
          BUY {buyPercent}%
        </div>
        <div style={{ width: `${100 - buyPercent}%`, background: 'rgba(198,40,40,0.4)', color: '#ff6b6b', textAlign: 'center', lineHeight: '14px' }}>
          SELL {100 - buyPercent}%
        </div>
      </div>

      {/* Depth Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--grid-font)', fontSize: 11 }}>
          <thead>
            <tr>
              <th colSpan={3} style={{ textAlign: 'center', padding: '4px', background: 'rgba(21,101,192,0.12)', color: '#4dabf7', fontSize: 10, fontWeight: 600, borderBottom: '2px solid #1565C0' }}>
                BUY SIDE
              </th>
              <th colSpan={3} style={{ textAlign: 'center', padding: '4px', background: 'rgba(198,40,40,0.12)', color: '#ff6b6b', fontSize: 10, fontWeight: 600, borderBottom: '2px solid #C62828' }}>
                SELL SIDE
              </th>
            </tr>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <th style={thS}>Orders</th>
              <th style={thS}>Qty</th>
              <th style={{ ...thS, color: '#4dabf7' }}>Price</th>
              <th style={{ ...thS, color: '#ff6b6b' }}>Price</th>
              <th style={thS}>Qty</th>
              <th style={thS}>Orders</th>
            </tr>
          </thead>
          <tbody>
            {depth.buy.map((b, i) => {
              const s = depth.sell[i]
              return (
                <tr key={i} style={{ borderBottom: '1px solid rgba(42,42,68,0.4)' }}>
                  <td style={{ textAlign: 'right', padding: '4px 6px', color: '#6a6a7a', fontSize: 9 }}>
                    {Math.floor(b.qty / 50)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '4px 8px', height: 28, position: 'relative' }}>
                    <div style={{
                      position: 'absolute', right: 0, top: 0, bottom: 0,
                      width: `${(b.qty / maxQty) * 100}%`, background: 'rgba(21,101,192,0.12)', zIndex: 0
                    }} />
                    <span style={{ position: 'relative', zIndex: 1, fontWeight: 600 }}>{b.qty}</span>
                  </td>
                  <td style={{ textAlign: 'right', padding: '4px 8px', color: '#4dabf7', fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => onPriceClick(b.price, 'buy')}
                    title={`Click to Buy at ${b.price.toFixed(2)}`}>
                    {b.price.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '4px 8px', color: '#ff6b6b', fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => onPriceClick(s.price, 'sell')}
                    title={`Click to Sell at ${s.price.toFixed(2)}`}>
                    {s.price.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '4px 8px', height: 28, position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: `${(s.qty / maxQty) * 100}%`, background: 'rgba(198,40,40,0.12)', zIndex: 0
                    }} />
                    <span style={{ position: 'relative', zIndex: 1, fontWeight: 600 }}>{s.qty}</span>
                  </td>
                  <td style={{ textAlign: 'right', padding: '4px 6px', color: '#6a6a7a', fontSize: 9 }}>
                    {Math.floor(s.qty / 50)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Stats Footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '4px 10px', fontSize: 10, background: 'rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ color: '#7a7a8c' }}>Total Buy: <b style={{ color: '#4dabf7' }}>{totalBuy.toLocaleString()}</b></span>
          <span style={{ color: '#7a7a8c' }}>Spread: <b style={{ color: '#eab308' }}>{spread}</b></span>
          <span style={{ color: '#7a7a8c' }}>Total Sell: <b style={{ color: '#ff6b6b' }}>{totalSell.toLocaleString()}</b></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#7a7a8c' }}>Open: <b>{sym.open.toFixed(2)}</b></span>
          <span style={{ color: '#7a7a8c' }}>H: <b style={{ color: '#22c55e' }}>{sym.high.toFixed(2)}</b></span>
          <span style={{ color: '#7a7a8c' }}>L: <b style={{ color: '#ef4444' }}>{sym.low.toFixed(2)}</b></span>
          <span style={{ color: '#7a7a8c' }}>Vol: <b>{sym.vol >= 100000 ? (sym.vol/100000).toFixed(1) + 'L' : sym.vol.toLocaleString()}</b></span>
        </div>
      </div>
      <div style={{ padding: '3px 10px', background: 'rgba(0,0,0,0.05)', borderTop: '1px solid rgba(42,42,68,0.3)', fontSize: 8, color: '#5a5a6a', textAlign: 'center' }}>
        Click price to open order │ Blue=Bid │ Red=Ask
      </div>
    </div>
  )
}

const thS = { textAlign: 'right', padding: '3px 6px', color: '#6a6a7a', fontSize: 9 }
