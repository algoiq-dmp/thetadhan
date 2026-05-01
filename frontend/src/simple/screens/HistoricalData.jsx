import { useState, useEffect } from 'react'
import useAppStore from '../stores/useAppStore'
import engineConnector from '../../services/engineConnector'
import InlineSettings, { SField, SSel, SChk, GearBtn } from '../components/InlineSettings'
import { exportGridCSV } from '../utils/gridUtils'
import ActionIcon from '../components/ActionIcons'

export default function HistoricalData() {
  const selectedSymbol = useAppStore(s => s.getSelectedSymbol())
  const symbols = useAppStore(s => s.symbols)
  const sym = selectedSymbol || symbols[0]
  const [view, setView] = useState('intraday')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [hdSettings, setHdSettings] = useState({
    bucketSize: '1 Min', dateRange: 'Today', includeOI: true, exportFormat: 'CSV', corpAdjust: false
  })
  const setHd = (k, v) => setHdSettings(p => ({ ...p, [k]: v }))

  // Load historical data
  useEffect(() => {
    if (!sym) return
    setLoading(true)
    const load = async () => {
      const isIntraday = view === 'intraday'
      const raw = isIntraday
        ? await engineConnector.getIntradayOHLC({ securityId: String(sym.securityId || sym.token), exchangeSegment: sym.exchange_segment || 'NSE_FNO', instrument: sym.type || 'OPTIDX' })
        : await engineConnector.getDailyOHLC({ securityId: String(sym.securityId || sym.token), exchangeSegment: sym.exchange_segment || 'NSE_FNO', instrument: sym.type || 'OPTIDX' })
      if (raw && raw.open && raw.open.length > 0) {
        const parsed = raw.open.map((_, i) => {
          const ts = raw.timestamp?.[i] ? new Date(raw.timestamp[i]) : new Date(Date.now() - (raw.open.length - i) * (isIntraday ? 60000 : 86400000))
          return {
            time: ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            date: ts.toLocaleDateString('en-IN'),
            open: raw.open[i]?.toFixed(2) || '0.00',
            high: raw.high[i]?.toFixed(2) || '0.00',
            low: raw.low[i]?.toFixed(2) || '0.00',
            close: raw.close[i]?.toFixed(2) || '0.00',
            volume: raw.volume?.[i] || 0,
            oi: 0, // Dhan chart API doesn't return OI
          }
        })
        setData(parsed)
      } else {
        setData([])
      }
      setLoading(false)
    }
    load()
  }, [sym?.token, view])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
        background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', fontSize: 10
      }}>
        <span style={{ fontWeight: 700, color: 'var(--text-bright)', fontSize: 11 }}>{sym?.symbol || 'Select Symbol'}</span>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        {['intraday', 'daily'].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '2px 8px', fontSize: 9, border: '1px solid var(--border)', cursor: 'pointer',
            background: view === v ? 'var(--bg-row-selected)' : 'transparent',
            color: view === v ? 'var(--accent)' : 'var(--text-secondary)',
          }}>{v === 'intraday' ? '1-Min OHLC' : 'Daily OHLC'}</button>
        ))}
        {loading && <span style={{ color: '#eab308', fontSize: 9 }}>⏳ Loading...</span>}
        <span style={{ marginLeft: 'auto', color: '#7a7a8c', fontSize: 9 }}>
          {data.length} candles loaded
        </span>
        <ActionIcon type="csv" tooltip="Export CSV" onClick={() => exportGridCSV(data, [{key:'time',label:'Time'},{key:'date',label:'Date'},{key:'open',label:'Open'},{key:'high',label:'High'},{key:'low',label:'Low'},{key:'close',label:'Close'},{key:'volume',label:'Volume'},{key:'oi',label:'OI'}], 'HistoricalData')} />
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
              <th style={{ ...thS, textAlign: 'right' }}>Chg</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && !loading && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20, color: '#7a7a8c' }}>No data — select a symbol from MarketWatch</td></tr>
            )}
            {data.map((d, i) => {
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
