import { useState, useEffect } from 'react'
import useAppStore from '../stores/useAppStore'
import InlineSettings, { SField, SSel, SChk, GearBtn } from '../components/InlineSettings'
import { exportGridCSV } from '../utils/gridUtils'
import ActionIcon, { ActionIconRow } from '../components/ActionIcons'

export default function PortfolioAnalysis() {
  const livePositions = useAppStore(s => s.positions)
  const refreshPortfolio = useAppStore(s => s.refreshPortfolio)
  useEffect(() => { refreshPortfolio() }, [])
  const mappedPositions = livePositions.map(p => ({
    symbol: p.symbol, type: p.optionType || 'FUT', qty: p.netQty || 0,
    avg: p.avgPrice || 0, ltp: p.ltp || 0, delta: 0, gamma: 0, theta: 0, vega: 0,
    iv: 0, pnl: p.pnl || 0
  }))
  const [positions, setPositions] = useState(mappedPositions)
  useEffect(() => { setPositions(mappedPositions) }, [livePositions])
  const [showAdd, setShowAdd] = useState(false)
  const [newPos, setNewPos] = useState({ symbol: '', type: 'CE', qty: '', avg: '' })
  const [showSettings, setShowSettings] = useState(false)
  const [paSettings, setPaSettings] = useState({
    greeksModel: 'Black-Scholes', refreshInterval: '3s', showIV: true, showRho: false, deltaNeutralThreshold: '5', liveGreeks: true
  })
  const setPa = (k, v) => setPaSettings(p => ({ ...p, [k]: v }))

  const totals = positions.reduce((acc, p) => ({
    delta: acc.delta + (p.delta * Math.abs(p.qty)),
    gamma: acc.gamma + (p.gamma * Math.abs(p.qty)),
    theta: acc.theta + (p.theta * Math.abs(p.qty)),
    vega: acc.vega + (p.vega * Math.abs(p.qty)),
    pnl: acc.pnl + p.pnl,
  }), { delta: 0, gamma: 0, theta: 0, vega: 0, pnl: 0 })

  const addPosition = () => {
    if (!newPos.symbol || !newPos.qty) return
    setPositions([...positions, {
      ...newPos, qty: parseInt(newPos.qty), avg: parseFloat(newPos.avg) || 0,
      ltp: parseFloat(newPos.avg) || 0, delta: 0.50, gamma: 0.003, theta: -10, vega: 8, iv: 15, pnl: 0
    }])
    setNewPos({ symbol: '', type: 'CE', qty: '', avg: '' })
    setShowAdd(false)
  }

  const removePosition = (i) => setPositions(positions.filter((_, idx) => idx !== i))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
        background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', fontSize: 10
      }}>
        <span style={{ color: '#7a7a8c' }}>Positions: <b style={{ color: 'var(--text-bright)' }}>{positions.length}</b></span>
        <ActionIcon type="addPos" tooltip="Add Position" onClick={() => setShowAdd(!showAdd)} />
        <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 12, color: totals.pnl >= 0 ? '#22c55e' : '#ef4444' }}>
          Total P&L: ₹{totals.pnl.toLocaleString()}
        </span>
        <ActionIcon type="csv" tooltip="Export CSV" onClick={() => exportGridCSV(positions, [{key:'symbol',label:'Symbol'},{key:'type',label:'Type'},{key:'qty',label:'Qty'},{key:'avg',label:'Avg'},{key:'ltp',label:'LTP'},{key:'iv',label:'IV'},{key:'delta',label:'Delta'},{key:'gamma',label:'Gamma'},{key:'theta',label:'Theta'},{key:'vega',label:'Vega'},{key:'pnl',label:'P&L'}], 'Portfolio')} />
        <GearBtn onClick={() => setShowSettings(s => !s)} />
      </div>

      {/* PA Settings */}
      <InlineSettings show={showSettings} onClose={() => setShowSettings(false)} title="Portfolio Settings">
        <SField label="Greeks Model"><SSel value={paSettings.greeksModel} options={['Black-Scholes','Binomial','Monte Carlo']} onChange={v => setPa('greeksModel', v)} /></SField>
        <SField label="Refresh"><SSel value={paSettings.refreshInterval} options={['1s','3s','5s','10s']} onChange={v => setPa('refreshInterval', v)} /></SField>
        <SChk checked={paSettings.showIV} label="Show IV" onChange={v => setPa('showIV', v)} />
        <SChk checked={paSettings.showRho} label="Show Rho" onChange={v => setPa('showRho', v)} />
        <SField label="Δ Neutral Alert"><SSel value={paSettings.deltaNeutralThreshold} options={['3','5','10','20']} onChange={v => setPa('deltaNeutralThreshold', v)} /></SField>
        <SChk checked={paSettings.liveGreeks} label="Live Greeks" onChange={v => setPa('liveGreeks', v)} />
      </InlineSettings>

      {/* Add Position Form */}
      {showAdd && (
        <div style={{ display: 'flex', gap: 6, padding: '4px 8px', background: 'rgba(0,188,212,0.05)', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
          <input placeholder="Symbol" value={newPos.symbol} onChange={e => setNewPos(p=>({...p,symbol:e.target.value}))}
            style={{ height: 20, width: 120, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8', padding: '0 4px', fontSize: 10, fontFamily: 'var(--grid-font)' }} />
          <select value={newPos.type} onChange={e => setNewPos(p=>({...p,type:e.target.value}))}
            style={{ height: 20, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8', fontSize: 10 }}>
            <option>CE</option><option>PE</option><option>FUT</option><option>EQ</option>
          </select>
          <input placeholder="Qty (±)" value={newPos.qty} onChange={e => setNewPos(p=>({...p,qty:e.target.value}))} type="number"
            style={{ height: 20, width: 60, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8', padding: '0 4px', fontSize: 10, fontFamily: 'var(--grid-font)' }} />
          <input placeholder="Avg" value={newPos.avg} onChange={e => setNewPos(p=>({...p,avg:e.target.value}))}
            style={{ height: 20, width: 70, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8', padding: '0 4px', fontSize: 10, fontFamily: 'var(--grid-font)' }} />
          <ActionIcon type="submit" tooltip="Add Position" onClick={addPosition} />
          <ActionIcon type="close" tooltip="Cancel" onClick={() => setShowAdd(false)} />
        </div>
      )}

      {/* Grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--grid-font)', fontSize: 10 }}>
          <thead>
            <tr>
              {['Symbol','Type','Qty','Avg','LTP','IV','Delta','Gamma','Theta','Vega','P&L',''].map(h => (
                <th key={h} style={{
                  textAlign: h === 'Symbol' ? 'left' : 'right', padding: '3px 6px',
                  background: 'linear-gradient(180deg, #2a2a44, #1e1e38)', border: '1px solid var(--border)',
                  color: '#7a7a8c', fontWeight: 500, fontSize: 9, position: 'sticky', top: 0, zIndex: 5,
                  textTransform: 'uppercase'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {positions.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(42,42,68,0.4)' }}>
                <td style={{ padding: '3px 6px', fontWeight: 600, color: 'var(--text-bright)' }}>{p.symbol}</td>
                <td style={{ textAlign: 'right', padding: '3px 6px', color: p.type === 'CE' ? '#4dabf7' : '#ff6b6b' }}>{p.type}</td>
                <td style={{ textAlign: 'right', padding: '3px 6px', fontWeight: 700, color: p.qty > 0 ? '#4dabf7' : '#ff6b6b' }}>{p.qty > 0 ? `+${p.qty}` : p.qty}</td>
                <td style={{ textAlign: 'right', padding: '3px 6px' }}>{p.avg.toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '3px 6px', fontWeight: 600 }}>{p.ltp.toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '3px 6px', color: '#eab308' }}>{p.iv.toFixed(1)}</td>
                <td style={{ textAlign: 'right', padding: '3px 6px', color: '#4dabf7' }}>{(p.delta * p.qty).toFixed(1)}</td>
                <td style={{ textAlign: 'right', padding: '3px 6px', color: '#a78bfa' }}>{(p.gamma * Math.abs(p.qty)).toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '3px 6px', color: '#ef4444' }}>{(p.theta * Math.abs(p.qty)).toFixed(0)}</td>
                <td style={{ textAlign: 'right', padding: '3px 6px', color: '#22c55e' }}>{(p.vega * Math.abs(p.qty)).toFixed(0)}</td>
                <td style={{ textAlign: 'right', padding: '3px 6px', fontWeight: 700, color: p.pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                  {p.pnl >= 0 ? '+' : ''}₹{p.pnl.toLocaleString()}
                </td>
                <td style={{ textAlign: 'center', padding: '3px 4px' }}>
                  <ActionIconRow type="remove" tooltip="Remove Position" onClick={() => removePosition(i)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Bar */}
      <div style={{
        display: 'flex', gap: 16, padding: '5px 10px',
        background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', fontSize: 10
      }}>
        <span style={{ color: '#7a7a8c' }}>Net Δ: <b style={{ color: '#4dabf7' }}>{totals.delta.toFixed(1)}</b></span>
        <span style={{ color: '#7a7a8c' }}>Net Γ: <b style={{ color: '#a78bfa' }}>{totals.gamma.toFixed(2)}</b></span>
        <span style={{ color: '#7a7a8c' }}>Net Θ: <b style={{ color: '#ef4444' }}>{totals.theta.toFixed(0)}</b></span>
        <span style={{ color: '#7a7a8c' }}>Net ν: <b style={{ color: '#22c55e' }}>{totals.vega.toFixed(0)}</b></span>
        <span style={{ marginLeft: 'auto', color: '#7a7a8c' }}>Portfolio: <b style={{ color: totals.delta > 0 ? '#4dabf7' : '#ff6b6b' }}>{totals.delta > 0 ? 'BULLISH' : 'BEARISH'}</b></span>
      </div>
    </div>
  )
}
