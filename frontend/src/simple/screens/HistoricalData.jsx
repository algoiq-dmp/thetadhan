import { useState } from 'react'
import InlineSettings, { SField, SSel, SChk, GearBtn } from '../components/InlineSettings'
import { exportGridCSV } from '../utils/gridUtils'
import ActionIcon from '../components/ActionIcons'

const MOCK_HISTORICAL = Array.from({ length: 50 }, (_, i) => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - (50 - i))
  const base = 24200 + Math.sin(i * 0.3) * 50
  return {
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString('en-IN'),
    open: (base + Math.random() * 10).toFixed(2),
    high: (base + 15 + Math.random() * 10).toFixed(2),
    low: (base - 10 - Math.random() * 8).toFixed(2),
    close: (base + 5 + Math.random() * 8).toFixed(2),
    volume: Math.floor(2000 + Math.random() * 8000),
    oi: Math.floor(40000000 + Math.random() * 10000000),
  }
})

export default function HistoricalData() {
  const [view, setView] = useState('intraday')
  const [symbol] = useState('NIFTY FUT')
  const [showSettings, setShowSettings] = useState(false)
  const [hdSettings, setHdSettings] = useState({
    bucketSize: '1 Min', dateRange: 'Today', includeOI: true, exportFormat: 'CSV', corpAdjust: false
  })
  const setHd = (k, v) => setHdSettings(p => ({ ...p, [k]: v }))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
        background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', fontSize: 10
      }}>
        <span style={{ fontWeight: 700, color: 'var(--text-bright)', fontSize: 11 }}>{symbol}</span>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        {['intraday', 'daily'].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '2px 8px', fontSize: 9, border: '1px solid var(--border)', cursor: 'pointer',
            background: view === v ? 'var(--bg-row-selected)' : 'transparent',
            color: view === v ? 'var(--accent)' : 'var(--text-secondary)',
          }}>{v === 'intraday' ? '1-Min OHLC' : 'Daily OHLC'}</button>
        ))}
        <span style={{ marginLeft: 'auto', color: '#7a7a8c', fontSize: 9 }}>
          {view === 'intraday' ? 'Last 50 candles' : 'Last 5 years data available'}
        </span>
        <ActionIcon type="csv" tooltip="Export CSV" onClick={() => exportGridCSV(MOCK_HISTORICAL, [{key:'time',label:'Time'},{key:'date',label:'Date'},{key:'open',label:'Open'},{key:'high',label:'High'},{key:'low',label:'Low'},{key:'close',label:'Close'},{key:'volume',label:'Volume'},{key:'oi',label:'OI'}], 'HistoricalData')} />
        <GearBtn onClick={() => setShowSettings(s => !s)} />
      </div>

      {/* HD Settings */}
      <InlineSettings show={showSettings} onClose={() => setShowSettings(false)} title="Historical Data Settings">
        <SField label="Bucket"><SSel value={hdSettings.bucketSize} options={['1 Min','5 Min','15 Min','30 Min','1 Hour','Daily']} onChange={v => setHd('bucketSize', v)} /></SField>
        <SField label="Range"><SSel value={hdSettings.dateRange} options={['Today','Last 7 Days','Last 30 Days','Custom']} onChange={v => setHd('dateRange', v)} /></SField>
        <SChk checked={hdSettings.includeOI} label="Include OI" onChange={v => setHd('includeOI', v)} />
        <SField label="Export"><SSel value={hdSettings.exportFormat} options={['CSV','Excel','JSON']} onChange={v => setHd('exportFormat', v)} /></SField>
        <SChk checked={hdSettings.corpAdjust} label="Corp Action Adjust" onChange={v => setHd('corpAdjust', v)} />
      </InlineSettings>

      {/* Grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--grid-font)', fontSize: 10 }}>
          <thead>
            <tr>
              <th style={thS}>Time</th>
              {view === 'daily' && <th style={thS}>Date</th>}
              <th style={{ ...thS, textAlign: 'right' }}>Open</th>
              <th style={{ ...thS, textAlign: 'right' }}>High</th>
              <th style={{ ...thS, textAlign: 'right' }}>Low</th>
              <th style={{ ...thS, textAlign: 'right' }}>Close</th>
              <th style={{ ...thS, textAlign: 'right' }}>Volume</th>
              <th style={{ ...thS, textAlign: 'right' }}>OI</th>
              <th style={{ ...thS, textAlign: 'right' }}>Chg</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_HISTORICAL.map((d, i) => {
              const chg = parseFloat(d.close) - parseFloat(d.open)
              return (
                <tr key={i} style={{ borderBottom: '1px solid rgba(42,42,68,0.3)' }}>
                  <td style={tdS}>{d.time}</td>
                  {view === 'daily' && <td style={tdS}>{d.date}</td>}
                  <td style={{ ...tdS, textAlign: 'right' }}>{d.open}</td>
                  <td style={{ ...tdS, textAlign: 'right', color: '#22c55e' }}>{d.high}</td>
                  <td style={{ ...tdS, textAlign: 'right', color: '#ef4444' }}>{d.low}</td>
                  <td style={{ ...tdS, textAlign: 'right', fontWeight: 600 }}>{d.close}</td>
                  <td style={{ ...tdS, textAlign: 'right' }}>{d.volume.toLocaleString()}</td>
                  <td style={{ ...tdS, textAlign: 'right' }}>{(d.oi / 100000).toFixed(1)}L</td>
                  <td style={{ ...tdS, textAlign: 'right', color: chg >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                    {chg >= 0 ? '+' : ''}{chg.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const thS = { textAlign: 'left', padding: '3px 6px', background: 'linear-gradient(180deg, #2a2a44, #1e1e38)', border: '1px solid var(--border)', color: '#7a7a8c', fontWeight: 500, fontSize: 9, position: 'sticky', top: 0, zIndex: 5, textTransform: 'uppercase' }
const tdS = { padding: '2px 6px', height: 20, color: '#d0d0d8' }
