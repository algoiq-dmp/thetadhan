import { useState } from 'react'
import { MOCK_POSITIONS } from '../mock/data'
import InlineSettings, { SField, SSel, SChk, GearBtn } from '../components/InlineSettings'
import { ConfirmDialog } from '../components/ContextMenu'
import { exportGridCSV, sortGridData, filterGridData, SortTh } from '../utils/gridUtils'
import ActionIcon, { ActionIconRow } from '../components/ActionIcons'

export default function NetPosition() {
  const [sortKey, setSortKey] = useState(null)
  const [sortAsc, setSortAsc] = useState(true)
  const [qFilter, setQFilter] = useState('')
  const onSort = (k) => { if (sortKey === k) setSortAsc(!sortAsc); else { setSortKey(k); setSortAsc(true) } }
  let posData = filterGridData(MOCK_POSITIONS, qFilter, ['symbol','exchange','product'])
  posData = sortGridData(posData, sortKey, sortAsc)
  const totalMtm = posData.reduce((a, p) => a + p.pnl, 0)
  const totalRealized = posData.reduce((a, p) => a + p.realizedPnl, 0)
  const totalPnl = totalMtm + totalRealized
  const [showSettings, setShowSettings] = useState(false)
  const [confirmSqOff, setConfirmSqOff] = useState(false)
  const [npSettings, setNpSettings] = useState({
    refreshInterval: '3s', autoSquareOff: '15:20', m2mMode: 'Intraday (Live)', confirmSquareOff: true, showRealized: true, showBuySelVal: true
  })
  const setNp = (k, v) => setNpSettings(p => ({ ...p, [k]: v }))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
        background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', fontSize: 10, flexWrap: 'wrap'
      }}>
        <span style={{ color: '#7a7a8c' }}>Positions: <b style={{ color: 'var(--text-bright)' }}>{posData.length}</b></span>
        <span style={{ color: '#7a7a8c' }}>│</span>
        <span style={{ color: '#7a7a8c' }}>MTM: <b style={{ color: totalMtm >= 0 ? '#22c55e' : '#ef4444' }}>₹{totalMtm.toLocaleString()}</b></span>
        <span style={{ color: '#7a7a8c' }}>Realized: <b style={{ color: totalRealized >= 0 ? '#22c55e' : '#ef4444' }}>₹{totalRealized.toLocaleString()}</b></span>
        <span style={{ fontWeight: 700, color: totalPnl >= 0 ? '#22c55e' : '#ef4444' }}>
          Total: ₹{totalPnl.toLocaleString()}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <ActionIcon type="squareOff" tooltip="Square Off All" shortcut="Ctrl+Shift+X" onClick={() => setConfirmSqOff(true)} />
          <ActionIcon type="convert" tooltip="Convert Product" shortcut="Alt+F8" />
          <ActionIcon type="refresh" tooltip="Refresh" />
          <input value={qFilter} onChange={e => setQFilter(e.target.value)} placeholder="Filter..." style={{ height: 18, width: 100, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8', padding: '0 6px', fontSize: 9, outline: 'none' }} />
          <ActionIcon type="csv" tooltip="Export CSV" onClick={() => exportGridCSV(posData, [{key:'symbol',label:'Symbol'},{key:'exchange',label:'Exch'},{key:'product',label:'Product'},{key:'netQty',label:'Net Qty'},{key:'buyQty',label:'Buy Qty'},{key:'buyAvg',label:'Buy Avg'},{key:'sellQty',label:'Sell Qty'},{key:'sellAvg',label:'Sell Avg'},{key:'ltp',label:'LTP'},{key:'pnl',label:'MTM PnL'},{key:'realizedPnl',label:'Realized'}], 'NetPosition')} />
          <GearBtn onClick={() => setShowSettings(s => !s)} />
        </div>
      </div>

      {/* NP Settings */}
      <InlineSettings show={showSettings} onClose={() => setShowSettings(false)} title="Position Settings">
        <SField label="Refresh"><SSel value={npSettings.refreshInterval} options={['1s','3s','5s','10s']} onChange={v => setNp('refreshInterval', v)} /></SField>
        <SField label="Auto Sq-off"><SSel value={npSettings.autoSquareOff} options={['15:10','15:15','15:20','15:25','OFF']} onChange={v => setNp('autoSquareOff', v)} /></SField>
        <SField label="M2M Mode"><SSel value={npSettings.m2mMode} options={['Intraday (Live)','Yesterday Close','Month-to-Date']} onChange={v => setNp('m2mMode', v)} /></SField>
        <SChk checked={npSettings.confirmSquareOff} label="Confirm Sq-off" onChange={v => setNp('confirmSquareOff', v)} />
        <SChk checked={npSettings.showRealized} label="Show Realized" onChange={v => setNp('showRealized', v)} />
        <SChk checked={npSettings.showBuySelVal} label="Buy/Sell Value" onChange={v => setNp('showBuySelVal', v)} />
      </InlineSettings>

      {/* Grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--grid-font)', fontSize: 10 }}>
          <thead>
            <tr>
              <th style={{ textAlign:'center', padding:'3px 6px', background:'linear-gradient(180deg,#2a2a44,#1e1e38)', border:'1px solid var(--border)', color:'#7a7a8c', fontWeight:500, fontSize:9, position:'sticky', top:0, zIndex:5 }}>#</th>
              {[{k:'symbol',l:'Symbol',a:'left'},{k:'exchange',l:'Exch'},{k:'product',l:'Product'},{k:'netQty',l:'Net Qty'},{k:'buyQty',l:'Buy Qty'},{k:'buyAvg',l:'Buy Avg'},{k:'sellQty',l:'Sell Qty'},{k:'sellAvg',l:'Sell Avg'},{k:'ltp',l:'LTP'},{k:'pnl',l:'MTM P&L'},{k:'realizedPnl',l:'Realized'},{k:'totalPnl',l:'Total P&L'},{k:'buyVal',l:'Buy Val'},{k:'sellVal',l:'Sell Val'},{k:'action',l:'Action'}].map(c => (
                <SortTh key={c.k} colKey={c.k} label={c.l} sortKey={sortKey} sortAsc={sortAsc} onSort={onSort} align={c.a} />
              ))}
            </tr>
          </thead>
          <tbody>
            {posData.map((p, i) => {
              const total = p.pnl + p.realizedPnl
              return (
                <tr key={i} style={{ borderBottom: '1px solid rgba(42,42,68,0.3)' }}>
                  <td style={{ ...tdR, textAlign: 'center', color: '#5a5a6a', fontSize: 9 }}>{i + 1}</td>
                  <td style={{ ...tdR, textAlign: 'left', fontWeight: 600, color: 'var(--text-bright)' }}>{p.symbol}</td>
                  <td style={tdR}>{p.exchange}</td>
                  <td style={tdR}>{p.product}</td>
                  <td style={{ ...tdR, fontWeight: 700, color: p.netQty > 0 ? '#4dabf7' : p.netQty < 0 ? '#ff6b6b' : '#d0d0d8' }}>
                    {p.netQty > 0 ? `+${p.netQty}` : p.netQty}
                  </td>
                  <td style={{ ...tdR, color: '#4dabf7' }}>{p.buyQty}</td>
                  <td style={tdR}>{p.buyAvg > 0 ? p.buyAvg.toFixed(2) : '—'}</td>
                  <td style={{ ...tdR, color: '#ff6b6b' }}>{p.sellQty}</td>
                  <td style={tdR}>{p.sellAvg > 0 ? p.sellAvg.toFixed(2) : '—'}</td>
                  <td style={{ ...tdR, fontWeight: 600 }}>{p.ltp.toFixed(2)}</td>
                  <td style={{ ...tdR, fontWeight: 700 }} className={p.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>
                    {p.pnl >= 0 ? '+' : ''}₹{p.pnl.toLocaleString()}
                  </td>
                  <td style={{ ...tdR, color: p.realizedPnl >= 0 ? '#22c55e' : '#ef4444' }}>
                    {p.realizedPnl > 0 ? `+₹${p.realizedPnl.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ ...tdR, fontWeight: 700, color: total >= 0 ? '#22c55e' : '#ef4444' }}>
                    {total >= 0 ? '+' : ''}₹{total.toLocaleString()}
                  </td>
                  <td style={{ ...tdR, fontSize: 9, color: '#7a7a8c' }}>{p.buyVal > 0 ? `₹${p.buyVal.toLocaleString()}` : '—'}</td>
                  <td style={{ ...tdR, fontSize: 9, color: '#7a7a8c' }}>{p.sellVal > 0 ? `₹${p.sellVal.toLocaleString()}` : '—'}</td>
                  <td style={{ textAlign: 'center', padding: '2px 4px' }}>
                    {p.netQty !== 0 && (
                      <div style={{ display:'flex', gap:2, justifyContent:'center' }}>
                        <ActionIconRow type="squareOff" tooltip="Square Off" />
                        <ActionIconRow type="addPos" tooltip="Add to Position" />
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Totals Footer */}
      <div style={{
        display: 'flex', gap: 16, padding: '5px 10px',
        background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', fontSize: 10
      }}>
        <span style={{ color: '#7a7a8c' }}>Total MTM: <b style={{ color: totalMtm >= 0 ? '#22c55e' : '#ef4444' }}>₹{totalMtm.toLocaleString()}</b></span>
        <span style={{ color: '#7a7a8c' }}>Realized: <b style={{ color: totalRealized >= 0 ? '#22c55e' : '#ef4444' }}>₹{totalRealized.toLocaleString()}</b></span>
        <span style={{ fontWeight: 700, color: totalPnl >= 0 ? '#22c55e' : '#ef4444' }}>
          Total P&L: ₹{totalPnl.toLocaleString()}
        </span>
        <span style={{ marginLeft: 'auto', color: '#5a5a6a', fontSize: 9 }}>✕ Ctrl+Shift+X = Square Off All │ ⇄ Alt+F8 = Convert</span>
      </div>

      {/* Square Off All Confirmation */}
      {confirmSqOff && (
        <ConfirmDialog
          title="Square Off All Positions"
          message={`Are you sure you want to square off ALL ${MOCK_POSITIONS.filter(p => p.netQty !== 0).length} open positions at market price? This will send market orders for each position.`}
          confirmLabel="Square Off All"
          danger={true}
          onConfirm={() => setConfirmSqOff(false)}
          onCancel={() => setConfirmSqOff(false)}
        />
      )}
    </div>
  )
}

const tdR = { textAlign: 'right', padding: '2px 6px', height: 22, color: '#d0d0d8' }
