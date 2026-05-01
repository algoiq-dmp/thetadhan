import { useState } from 'react'
import useAppStore from '../stores/useAppStore'
import { exportGridCSV, sortGridData, SortTh } from '../utils/gridUtils'
import ActionIcon from '../components/ActionIcons'




export default function BhavCopy() {
  const symbols = useAppStore(s => s.symbols)
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [exchange, setExchange] = useState('NSE')
  const [series, setSeries] = useState('ALL')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortAsc, setSortAsc] = useState(true)
  const onSort = (k) => { if (sortKey === k) setSortAsc(!sortAsc); else { setSortKey(k); setSortAsc(true) } }

  // Map live symbols to BhavCopy format
  const bhavData = symbols.map(s => ({
    symbol: s.symbol, series: s.type || 'EQ',
    open: s.open || 0, high: s.high || 0, low: s.low || 0, close: s.ltp || 0,
    prevClose: s.close || 0, vol: s.vol || 0, turnover: s.turnover || 0, trades: 0, date
  }))

  let filtered = bhavData.filter(b =>
    (series === 'ALL' || b.series === series) &&
    (!search || b.symbol.toLowerCase().includes(search.toLowerCase()))
  )
  filtered = sortGridData(filtered, sortKey, sortAsc)

  const advancers = filtered.filter(b => b.close > b.prevClose).length
  const decliners = filtered.filter(b => b.close < b.prevClose).length
  const unchanged = filtered.filter(b => b.close === b.prevClose).length

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--bg-panel)' }}>
      <div style={{ padding:'6px 10px', background:'var(--bg-surface)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        <span style={{ fontWeight:700, fontSize:12, color:'var(--accent)' }}>📊 Bhav Copy</span>
        <select value={exchange} onChange={e=>setExchange(e.target.value)} style={selS}><option>NSE</option><option>BSE</option><option>MCX</option></select>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{...selS, width:120}} />
        <select value={series} onChange={e=>setSeries(e.target.value)} style={selS}><option>ALL</option><option>EQ</option><option>IDX</option><option>BE</option></select>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search symbol..." style={{...selS, width:120}} />
        <span style={{ marginLeft:'auto', fontSize:9 }}>
          <span style={{ color:'#22c55e' }}>▲{advancers}</span> <span style={{ color:'#ef4444' }}>▼{decliners}</span> <span style={{ color:'#7a7a8c' }}>─{unchanged}</span>
        </span>
        <ActionIcon type="csv" tooltip="Export CSV" onClick={() => exportGridCSV(filtered.map(b => ({ ...b, chg: (b.close-b.prevClose).toFixed(2), chgP: (b.prevClose>0 ? ((b.close-b.prevClose)/b.prevClose*100).toFixed(2) : '0') })), [{key:'symbol',label:'Symbol'},{key:'series',label:'Series'},{key:'open',label:'Open'},{key:'high',label:'High'},{key:'low',label:'Low'},{key:'close',label:'Close'},{key:'prevClose',label:'Prev Close'},{key:'chg',label:'Chg'},{key:'chgP',label:'Chg%'},{key:'vol',label:'Volume'},{key:'turnover',label:'Turnover'}], 'BhavCopy')} />
      </div>
      <div style={{ flex:1, overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'var(--grid-font)', fontSize:10 }}>
          <thead>
            <tr>
              <th style={{ textAlign:'center', padding:'3px 6px', background:'linear-gradient(180deg,#2a2a44,#1e1e38)', border:'1px solid var(--border)', color:'#7a7a8c', fontWeight:500, fontSize:9, position:'sticky', top:0, zIndex:5 }}>#</th>
              {[{k:'symbol',l:'Symbol',a:'left'},{k:'series',l:'Series',a:'left'},{k:'open',l:'Open'},{k:'high',l:'High'},{k:'low',l:'Low'},{k:'close',l:'Close'},{k:'prevClose',l:'Prev Close'},{k:'chg',l:'Chg'},{k:'chgP',l:'Chg%'},{k:'vol',l:'Volume'},{k:'turnover',l:'Turnover (Cr)'},{k:'trades',l:'Trades'}].map(c => (
                <SortTh key={c.k} colKey={c.k} label={c.l} sortKey={sortKey} sortAsc={sortAsc} onSort={onSort} align={c.a} />
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((b,i)=>{
              const chg = b.close - b.prevClose
              const chgP = b.prevClose > 0 ? (chg/b.prevClose*100) : 0
              const color = chg > 0 ? '#22c55e' : chg < 0 ? '#ef4444' : '#d0d0d8'
              return (
                <tr key={i} style={{ borderBottom:'1px solid rgba(42,42,68,0.3)', background: i%2===0 ? 'var(--bg-row-even)' : 'var(--bg-row-odd)' }}>
                  <td style={tdR}>{i+1}</td>
                  <td style={{...tdR, textAlign:'left', fontWeight:600, color:'var(--text-bright)'}}>{b.symbol}</td>
                  <td style={{...tdR, textAlign:'left', color:'#7a7a8c'}}>{b.series}</td>
                  <td style={tdR}>{b.open.toFixed(2)}</td>
                  <td style={{...tdR, color:'#22c55e'}}>{b.high.toFixed(2)}</td>
                  <td style={{...tdR, color:'#ef4444'}}>{b.low.toFixed(2)}</td>
                  <td style={{...tdR, fontWeight:700, color}}>{b.close.toFixed(2)}</td>
                  <td style={tdR}>{b.prevClose.toFixed(2)}</td>
                  <td style={{...tdR, color, fontWeight:600}}>{chg > 0 ? '+' : ''}{chg.toFixed(2)}</td>
                  <td style={{...tdR, color, fontWeight:600}}>{chgP > 0 ? '+' : ''}{chgP.toFixed(2)}%</td>
                  <td style={tdR}>{b.vol > 0 ? (b.vol/100000).toFixed(1)+'L' : '—'}</td>
                  <td style={tdR}>{b.turnover > 0 ? b.turnover.toFixed(1) : '—'}</td>
                  <td style={tdR}>{b.trades > 0 ? (b.trades/1000).toFixed(0)+'K' : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding:'4px 10px', background:'rgba(0,0,0,0.15)', borderTop:'1px solid var(--border)', fontSize:9, display:'flex', gap:12, color:'#7a7a8c' }}>
        <span>Total: <b style={{ color:'#d0d0d8' }}>{filtered.length}</b></span>
        <span>Date: <b style={{ color:'var(--accent)' }}>{date}</b></span>
        <span>Exchange: <b style={{ color:'#d0d0d8' }}>{exchange}</b></span>
        <span style={{ marginLeft:'auto' }}>Source: NSE EOD Data</span>
      </div>
    </div>
  )
}
const selS = { height:20, background:'var(--bg-input)', color:'var(--text-primary)', border:'1px solid var(--border)', fontSize:9, padding:'0 4px' }
const tdR = { textAlign:'right', padding:'2px 6px', height:22, color:'#d0d0d8' }
