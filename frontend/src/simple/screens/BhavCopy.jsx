import { useState } from 'react'
import { exportGridCSV, sortGridData, SortTh } from '../utils/gridUtils'
import ActionIcon from '../components/ActionIcons'

const MOCK_BHAV = [
  { symbol:'NIFTY', series:'IDX', open:24120.50, high:24380.25, low:24090.00, close:24250.50, prevClose:24180.00, vol:0, turnover:0, trades:0, date:'2026-04-25' },
  { symbol:'RELIANCE', series:'EQ', open:2530.00, high:2555.00, low:2522.00, close:2540.50, prevClose:2525.00, vol:8520400, turnover:21635.2, trades:325000, date:'2026-04-25' },
  { symbol:'TCS', series:'EQ', open:3440.00, high:3468.00, low:3430.00, close:3450.00, prevClose:3460.00, vol:3210000, turnover:11065.8, trades:180000, date:'2026-04-25' },
  { symbol:'HDFCBANK', series:'EQ', open:1575.00, high:1592.00, low:1570.00, close:1580.00, prevClose:1565.00, vol:12450000, turnover:19727.4, trades:420000, date:'2026-04-25' },
  { symbol:'INFY', series:'EQ', open:1425.00, high:1435.00, low:1410.00, close:1420.00, prevClose:1435.00, vol:6800000, turnover:9656.0, trades:250000, date:'2026-04-25' },
  { symbol:'ICICIBANK', series:'EQ', open:1172.00, high:1195.00, low:1168.00, close:1180.00, prevClose:1170.00, vol:9250000, turnover:10920.0, trades:310000, date:'2026-04-25' },
  { symbol:'SBIN', series:'EQ', open:775.00, high:790.50, low:772.00, close:780.00, prevClose:770.00, vol:15800000, turnover:12324.0, trades:520000, date:'2026-04-25' },
  { symbol:'BHARTIARTL', series:'EQ', open:1615.00, high:1630.00, low:1608.00, close:1620.00, prevClose:1612.00, vol:4200000, turnover:6804.0, trades:145000, date:'2026-04-25' },
  { symbol:'ITC', series:'EQ', open:432.00, high:435.50, low:428.00, close:430.00, prevClose:433.00, vol:18500000, turnover:7955.0, trades:650000, date:'2026-04-25' },
  { symbol:'KOTAKBANK', series:'EQ', open:1845.00, high:1860.00, low:1835.00, close:1850.00, prevClose:1858.00, vol:3100000, turnover:5735.0, trades:120000, date:'2026-04-25' },
  { symbol:'LT', series:'EQ', open:3270.00, high:3295.00, low:3260.00, close:3280.00, prevClose:3265.00, vol:2400000, turnover:7872.0, trades:95000, date:'2026-04-25' },
  { symbol:'AXISBANK', series:'EQ', open:1115.00, high:1135.00, low:1110.00, close:1120.00, prevClose:1108.00, vol:7800000, turnover:8736.0, trades:280000, date:'2026-04-25' },
  { symbol:'HINDUNILVR', series:'EQ', open:2385.00, high:2395.00, low:2370.00, close:2380.00, prevClose:2390.00, vol:1800000, turnover:4284.0, trades:72000, date:'2026-04-25' },
  { symbol:'BAJFINANCE', series:'EQ', open:6920.00, high:6980.00, low:6900.00, close:6950.00, prevClose:6930.00, vol:1200000, turnover:8340.0, trades:65000, date:'2026-04-25' },
  { symbol:'TATAMOTORS', series:'EQ', open:675.00, high:690.00, low:672.00, close:680.00, prevClose:670.00, vol:22500000, turnover:15300.0, trades:780000, date:'2026-04-25' },
]

export default function BhavCopy() {
  const [date, setDate] = useState('2026-04-25')
  const [exchange, setExchange] = useState('NSE')
  const [series, setSeries] = useState('ALL')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortAsc, setSortAsc] = useState(true)
  const onSort = (k) => { if (sortKey === k) setSortAsc(!sortAsc); else { setSortKey(k); setSortAsc(true) } }

  let filtered = MOCK_BHAV.filter(b =>
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
