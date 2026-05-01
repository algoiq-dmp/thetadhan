import { useState } from 'react'
import { exportGridCSV } from '../utils/gridUtils'
import ActionIcon, { ActionIconRow } from '../components/ActionIcons'

const SAMPLE_ALERTS = [
  { id:1, symbol:'NIFTY 24200CE', type:'price', condition:'above', value:'150.00', status:'active', triggered:false },
  { id:2, symbol:'RELIANCE', type:'price', condition:'below', value:'2500.00', status:'active', triggered:true, trigTime:'14:22:15' },
  { id:3, symbol:'BANKNIFTY FUT', type:'volume', condition:'above', value:'500000', status:'active', triggered:false },
  { id:4, symbol:'NIFTY 24200PE', type:'oi', condition:'above', value:'5000000', status:'paused', triggered:false },
]

export default function AlertsManager() {
  const [alerts, setAlerts] = useState(SAMPLE_ALERTS)
  const [showAdd, setShowAdd] = useState(false)
  const [newAlert, setNewAlert] = useState({ symbol:'', type:'price', condition:'above', value:'', sound:true, popup:true })
  const sNA = (k,v) => setNewAlert(p=>({...p,[k]:v}))
  const toggleStatus = (id) => setAlerts(prev => prev.map(a => a.id===id ? { ...a, status: a.status==='active' ? 'paused' : 'active' } : a))
  const doExport = () => exportGridCSV(alerts, [{key:'symbol',label:'Symbol'},{key:'type',label:'Type'},{key:'condition',label:'Condition'},{key:'value',label:'Value'},{key:'status',label:'Status'}], 'Alerts')
  const removeAlert = (id) => setAlerts(prev => prev.filter(a => a.id !== id))
  const addAlert = () => {
    if (!newAlert.symbol || !newAlert.value) return
    setAlerts(prev => [...prev, { ...newAlert, id: Date.now(), status:'active', triggered:false }])
    setNewAlert({ symbol:'', type:'price', condition:'above', value:'', sound:true, popup:true })
    setShowAdd(false)
  }
  const activeCount = alerts.filter(a => a.status==='active').length
  const triggeredCount = alerts.filter(a => a.triggered).length

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--bg-panel)' }}>
      <div style={{ padding:'6px 12px', background:'var(--bg-surface)', borderBottom:'2px solid #eab308', display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontWeight:700, fontSize:12, color:'#eab308' }}>🔔 Price / Volume / OI Alerts</span>
        <span style={{ marginLeft:'auto', fontSize:9, color:'#7a7a8c' }}>
          Active: <b style={{ color:'#22c55e' }}>{activeCount}</b> │ Triggered: <b style={{ color:'#eab308' }}>{triggeredCount}</b>
        </span>
        <ActionIcon type="add" tooltip="New Alert" onClick={()=>setShowAdd(s=>!s)} />
        <ActionIcon type="csv" tooltip="Export CSV" onClick={doExport} />
      </div>

      {showAdd && (
        <div style={{ padding:'8px 12px', background:'rgba(234,179,8,0.06)', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontSize:9, fontWeight:600, color:'#eab308', marginBottom:6 }}>── CREATE NEW ALERT ──</div>
          <div style={{ display:'flex', gap:6, alignItems:'flex-end', flexWrap:'wrap' }}>
            <div style={colS}><span style={lblS}>Symbol</span><input value={newAlert.symbol} onChange={e=>sNA('symbol',e.target.value)} placeholder="NIFTY, RELIANCE..." style={iS} /></div>
            <div style={colS}><span style={lblS}>Alert Type</span>
              <select value={newAlert.type} onChange={e=>sNA('type',e.target.value)} style={iS}>
                <option value="price">Price</option><option value="volume">Volume</option><option value="oi">Open Interest</option>
                <option value="chgP">% Change</option><option value="52high">52W High</option><option value="52low">52W Low</option>
              </select>
            </div>
            <div style={colS}><span style={lblS}>Condition</span>
              <select value={newAlert.condition} onChange={e=>sNA('condition',e.target.value)} style={iS}>
                <option value="above">Crosses Above ▲</option><option value="below">Crosses Below ▼</option>
                <option value="equals">Equals =</option><option value="range">In Range ↔</option>
              </select>
            </div>
            <div style={colS}><span style={lblS}>Value</span><input value={newAlert.value} onChange={e=>sNA('value',e.target.value)} style={iS} /></div>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <label style={{ fontSize:8, color:'#d0d0d8', display:'flex', alignItems:'center', gap:2 }}>
                <input type="checkbox" checked={newAlert.sound} onChange={e=>sNA('sound',e.target.checked)} style={{ accentColor:'#00bcd4' }} />🔊 Sound
              </label>
              <label style={{ fontSize:8, color:'#d0d0d8', display:'flex', alignItems:'center', gap:2 }}>
                <input type="checkbox" checked={newAlert.popup} onChange={e=>sNA('popup',e.target.checked)} style={{ accentColor:'#00bcd4' }} />💬 Popup
              </label>
            </div>
            <ActionIcon type="submit" tooltip="Add Alert" onClick={addAlert} />
          </div>
        </div>
      )}

      <div style={{ flex:1, overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'var(--grid-font)', fontSize:10 }}>
          <thead>
            <tr style={{ background:'rgba(255,255,255,0.04)' }}>
              <th style={thS}>Status</th><th style={{...thS, textAlign:'left'}}>Symbol</th><th style={thS}>Type</th>
              <th style={thS}>Condition</th><th style={thS}>Value</th><th style={thS}>Triggered</th><th style={thS}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a, i) => (
              <tr key={a.id} style={{ borderBottom:'1px solid rgba(42,42,68,0.3)', background: a.triggered ? 'rgba(234,179,8,0.06)' : i%2===0 ? 'var(--bg-row-even)' : 'var(--bg-row-odd)' }}>
                <td style={tdS}>
                  <span style={{ width:8, height:8, borderRadius:'50%', display:'inline-block', background: a.status==='active' ? '#22c55e' : '#eab308', boxShadow: a.status==='active' ? '0 0 4px #22c55e' : 'none' }} />
                </td>
                <td style={{...tdS, textAlign:'left', fontWeight:600}}>{a.symbol}</td>
                <td style={{...tdS, textTransform:'capitalize'}}>{a.type}</td>
                <td style={tdS}>{a.condition === 'above' ? '▲ Above' : a.condition === 'below' ? '▼ Below' : a.condition === 'equals' ? '= Equals' : '↔ Range'}</td>
                <td style={{...tdS, fontWeight:600, color:'var(--accent)'}}>{a.value}</td>
                <td style={tdS}>{a.triggered ? <span style={{ color:'#eab308' }}>✓ {a.trigTime || 'Yes'}</span> : <span style={{ color:'#5a5a6a' }}>—</span>}</td>
                <td style={tdS}>
                  <button onClick={()=>toggleStatus(a.id)} style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontSize:8, marginRight:4 }}>
                    {a.status==='active' ? '⏸' : '▶'}
                  </button>
                  <ActionIconRow type="remove" tooltip="Delete Alert" onClick={()=>removeAlert(a.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {alerts.length === 0 && (
          <div style={{ padding:30, textAlign:'center', color:'#5a5a6a', fontSize:11 }}>
            No alerts set. Click "+ New Alert" to create one.
          </div>
        )}
      </div>
    </div>
  )
}
const colS = { display:'flex', flexDirection:'column', gap:1 }
const lblS = { fontSize:7, color:'#5a5a6a', textTransform:'uppercase' }
const iS = { height:22, background:'#0a0a1a', border:'1px solid #2a2a44', color:'#d0d0d8', padding:'0 6px', fontSize:10, outline:'none', minWidth:100 }
const thS = { padding:'3px 6px', color:'#6a6a7a', fontSize:9, fontWeight:600, textAlign:'center', borderBottom:'1px solid var(--border)' }
const tdS = { padding:'3px 6px', height:24, textAlign:'center', color:'#d0d0d8' }
