import { useState } from 'react'
import useAppStore from '../stores/useAppStore'

export default function SnapQuote() {
  const symbols = useAppStore(s => s.symbols)
  const selectedToken = useAppStore(s => s.selectedToken)
  const sym = symbols.find(s => s.token === selectedToken) || symbols[0] || {}

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--bg-panel)' }}>
      <div style={{ padding:'6px 10px', background:'var(--bg-surface)', borderBottom:'2px solid var(--accent)', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontWeight:700, fontSize:13, color:'var(--text-bright)' }}>{sym.symbol || 'Select Symbol'}</span>
        <span style={{ fontSize:10, color:'#7a7a8c' }}>{sym.exchange} │ {sym.instrument || sym.type}</span>
        <span style={{ marginLeft:'auto', fontWeight:700, fontSize:16, color: sym.chg >= 0 ? '#22c55e' : '#ef4444' }}>
          ₹{sym.ltp?.toFixed(2)}
        </span>
        <span style={{ fontSize:11, color: sym.chg >= 0 ? '#22c55e' : '#ef4444', fontWeight:600 }}>
          {sym.chg >= 0 ? '+' : ''}{sym.chg?.toFixed(2)} ({sym.chgP?.toFixed(2)}%)
        </span>
      </div>
      <div style={{ flex:1, overflow:'auto', padding:'6px 10px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px' }}>
          {[['Open', sym.open],['High', sym.high, '#22c55e'],['Low', sym.low, '#ef4444'],['Prev Close', sym.close],
            ['Volume', sym.vol],['ATP', sym.atp],['LTQ', sym.ltq],['Total Buy Qty', sym.totalBuyQty],
            ['Total Sell Qty', sym.totalSellQty],['Upper Circuit', sym.upperCkt, '#eab308'],['Lower Circuit', sym.lowerCkt, '#eab308'],
            ['OI', sym.oi],['OI Change', sym.oiChg],['52W High', sym.w52High],['52W Low', sym.w52Low],['Lot Size', sym.lotSize],
            ['Turnover', sym.turnover],['Expiry', sym.expiry]
          ].map(([label, value, color], i) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'3px 8px', background: i%4<2 ? 'rgba(0,0,0,0.1)' : 'transparent', borderBottom:'1px solid rgba(42,42,68,0.2)' }}>
              <span style={{ fontSize:9, color:'#7a7a8c' }}>{label}</span>
              <span style={{ fontSize:10, fontWeight:600, color: color || '#d0d0d8', fontFamily:'var(--grid-font)' }}>
                {typeof value === 'number' ? value >= 100000 ? (value/100000).toFixed(1)+'L' : value.toFixed(2) : value || '—'}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:6, padding:'4px 8px', background:'rgba(0,188,212,0.04)', border:'1px solid var(--border)', fontSize:8, color:'#5a5a6a' }}>
          ISIN: {sym.isin || 'INE001A01036'} │ Series: EQ │ Tick Size: 0.05 │ Board Lot: {sym.lotSize || 1}
        </div>
        {(sym.expiry || sym.optionType) && (
          <div style={{ marginTop:4, padding:'4px 8px', background:'rgba(234,179,8,0.04)', border:'1px solid rgba(234,179,8,0.15)', fontSize:8 }}>
            <div style={{ fontSize:8, color:'#eab308', fontWeight:600, marginBottom:3 }}>── CONTRACT INFO (Shift+F8) ──</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px' }}>
              {[['Expiry', sym.expiry || '24-Apr-2026'],['Strike Price', sym.strikePrice || sym.strike || '—'],
                ['Option Type', sym.optionType || '—'],['Lot Size', sym.lotSize || 75],
                ['Freeze Qty', ((sym.lotSize || 75) * 40).toLocaleString()],['Tick Size', '0.05'],
                ['Instrument', sym.instrument || 'OPTIDX'],['Underlying', 'NIFTY']
              ].map(([l,v],i) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'2px 6px', background: i%4<2 ? 'rgba(0,0,0,0.06)' : 'transparent' }}>
                  <span style={{ color:'#7a7a8c' }}>{l}</span>
                  <span style={{ color:'#eab308', fontWeight:600, fontFamily:'var(--grid-font)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
