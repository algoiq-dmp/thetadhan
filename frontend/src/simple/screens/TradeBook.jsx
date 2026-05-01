import { useState } from 'react'
import { MOCK_TRADES } from '../mock/data'
import InlineSettings, { SField, SSel, SChk, GearBtn } from '../components/InlineSettings'
import { exportGridCSV, sortGridData, filterGridData, SortTh } from '../utils/gridUtils'
import ActionIcon from '../components/ActionIcons'

export default function TradeBook() {
  const [showSettings, setShowSettings] = useState(false)
  const [tbSettings, setTbSettings] = useState({
    autoRefresh: true, exportFormat: 'CSV', showOrderId: true, showProduct: true, highlightRecent: true
  })
  const setTb = (k, v) => setTbSettings(p => ({ ...p, [k]: v }))
  const [sortKey, setSortKey] = useState(null)
  const [sortAsc, setSortAsc] = useState(true)
  const [qFilter, setQFilter] = useState('')
  const onSort = (k) => { if (sortKey === k) setSortAsc(!sortAsc); else { setSortKey(k); setSortAsc(true) } }

  let data = filterGridData(MOCK_TRADES, qFilter, ['symbol','exchange','side','product','orderId','tradeId'])
  data = sortGridData(data, sortKey, sortAsc)
  const buyTrades = data.filter(t => t.side === 'BUY')
  const sellTrades = data.filter(t => t.side === 'SELL')
  const totalValue = data.reduce((a, t) => a + (t.qty * t.price), 0)
  const buyValue = buyTrades.reduce((a, t) => a + (t.qty * t.price), 0)
  const sellValue = sellTrades.reduce((a, t) => a + (t.qty * t.price), 0)

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      {/* Toolbar */}
      <div style={{ display:'flex', gap:6, padding:'3px 6px', background:'var(--bg-surface)', borderBottom:'1px solid var(--border)', fontSize:10, alignItems:'center' }}>
        <span style={{ color:'var(--text-secondary)' }}>Trades: <b style={{ color: 'var(--text-bright)' }}>{MOCK_TRADES.length}</b></span>
        <span style={{ color:'var(--text-muted)' }}>│</span>
        <span style={{ color:'#4dabf7', fontSize: 9 }}>Buy: {buyTrades.length}</span>
        <span style={{ color:'#ff6b6b', fontSize: 9 }}>Sell: {sellTrades.length}</span>
        <span style={{ marginLeft:'auto', color:'var(--text-muted)', fontSize: 9 }}>Export:</span>
        <select value={tbSettings.exportFormat} onChange={e => setTb('exportFormat', e.target.value)}
          style={{ height: 18, background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: 9 }}>
          <option>CSV</option><option>Excel</option><option>TXT (Pipe)</option><option>NSE Format</option>
        </select>
        <ActionIcon type="csv" tooltip="Export" onClick={() => exportGridCSV(data, [{key:'time',label:'Time'},{key:'symbol',label:'Symbol'},{key:'exchange',label:'Exch'},{key:'side',label:'B/S'},{key:'product',label:'Product'},{key:'qty',label:'Qty'},{key:'price',label:'Price'}], 'TradeBook')} />
        <input value={qFilter} onChange={e => setQFilter(e.target.value)} placeholder="Filter..." style={{ height: 18, width: 100, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8', padding: '0 6px', fontSize: 9, outline: 'none' }} />
        <GearBtn onClick={() => setShowSettings(s => !s)} />
      </div>

      {/* Settings */}
      <InlineSettings show={showSettings} onClose={() => setShowSettings(false)} title="Trade Book Settings">
        <SChk checked={tbSettings.autoRefresh} label="Auto-refresh" onChange={v => setTb('autoRefresh', v)} />
        <SField label="Export"><SSel value={tbSettings.exportFormat} options={['CSV','Excel','TXT (Pipe)','NSE Format']} onChange={v => setTb('exportFormat', v)} /></SField>
        <SChk checked={tbSettings.showOrderId} label="Show Order ID" onChange={v => setTb('showOrderId', v)} />
        <SChk checked={tbSettings.showProduct} label="Show Product" onChange={v => setTb('showProduct', v)} />
        <SChk checked={tbSettings.highlightRecent} label="Highlight Recent" onChange={v => setTb('highlightRecent', v)} />
      </InlineSettings>

      {/* Grid */}
      <div style={{ flex:1, overflow:'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--grid-font)', fontSize: 10 }}>
          <thead>
            <tr>
              <th style={{ textAlign:'center', padding:'3px 6px', background:'linear-gradient(180deg,#2a2a44,#1e1e38)', border:'1px solid var(--border)', color:'#7a7a8c', fontWeight:500, fontSize:9, position:'sticky', top:0, zIndex:5 }}>#</th>
              {[{k:'time',l:'Time'},{k:'symbol',l:'Symbol',a:'left'},{k:'exchange',l:'Exch'},{k:'side',l:'B/S'},{k:'product',l:'Product'},{k:'qty',l:'Qty'},{k:'price',l:'Price'},{k:'value',l:'Value'},{k:'orderId',l:'Order ID'},{k:'tradeId',l:'Trade ID'}].map(c => (
                <SortTh key={c.k} colKey={c.k} label={c.l} sortKey={sortKey} sortAsc={sortAsc} onSort={onSort} align={c.a} />
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((t, i) => (
              <tr key={t.id} style={{ borderBottom: '1px solid rgba(42,42,68,0.3)' }}>
                <td style={{ ...tdR, textAlign: 'center', color: '#5a5a6a', fontSize: 9 }}>{i + 1}</td>
                <td style={{ ...tdR, color: 'var(--text-muted)' }}>{t.time}</td>
                <td style={{ ...tdR, textAlign: 'left', fontWeight: 600, color: 'var(--text-bright)' }}>{t.symbol}</td>
                <td style={{ ...tdR, color: 'var(--text-muted)' }}>{t.exchange}</td>
                <td style={tdR}><span style={{ color: t.side==='BUY'?'#4dabf7':'#ff6b6b', fontWeight:700 }}>{t.side}</span></td>
                <td style={{ ...tdR, fontSize:9, color:'var(--text-secondary)' }}>{t.product}</td>
                <td style={{ ...tdR, fontWeight: 600 }}>{t.qty}</td>
                <td style={{ ...tdR, fontWeight: 600 }}>{t.price.toFixed(2)}</td>
                <td style={{ ...tdR, fontSize: 9, color: 'var(--text-secondary)' }}>₹{(t.qty * t.price).toLocaleString()}</td>
                <td style={{ ...tdR, fontSize: 9, color: 'var(--text-muted)' }}>{t.orderId}</td>
                <td style={{ ...tdR, fontSize: 9, color: 'var(--text-muted)' }}>{t.tradeId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with totals */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px',
        background: 'rgba(0,0,0,0.15)', borderTop: '1px solid var(--border)', fontSize: 9
      }}>
        <span style={{ color: '#7a7a8c' }}>Total Trades: <b style={{ color: '#d0d0d8' }}>{data.length}</b></span>
        <span style={{ color: '#7a7a8c' }}>Buy: <b style={{ color: '#4dabf7' }}>{buyTrades.length}</b> (₹{buyValue.toLocaleString()})</span>
        <span style={{ color: '#7a7a8c' }}>Sell: <b style={{ color: '#ff6b6b' }}>{sellTrades.length}</b> (₹{sellValue.toLocaleString()})</span>
        <span style={{ marginLeft: 'auto', color: '#7a7a8c' }}>Total Value: <b style={{ color: 'var(--accent)' }}>₹{totalValue.toLocaleString()}</b></span>
      </div>
    </div>
  )
}

const tdR = { textAlign: 'right', padding: '2px 6px', height: 22, color: '#d0d0d8' }
