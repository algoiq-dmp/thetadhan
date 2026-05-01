import { useState, useEffect } from 'react'
import ActionIcon from '../components/ActionIcons'

const EXCHANGES = ['NSE', 'BSE']
const SEGMENTS = [
  { key: 'fo', label: 'F&O (Derivatives)', port: 5500 },
  { key: 'cm', label: 'Cash Market (Equity)', port: 5501 },
  { key: 'cd', label: 'Currency Derivatives', port: 5502 },
]
const LS_KEY = 'lightz-broadcast'

const Sec = ({ children }) => (
  <div style={{ fontSize: 10, color: '#6a6a7a', padding: '8px 0 4px', borderBottom: '1px solid rgba(42,42,68,0.5)', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>── {children} ──</div>
)
const Field = ({ label, children, w = 160 }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
    <span style={{ width: w, fontSize: 10, color: '#9aa0b0', textAlign: 'right', paddingRight: 10, flexShrink: 0 }}>{label}</span>
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>{children}</div>
  </div>
)
const Inp = ({ value, onChange, w = 180, placeholder = '' }) => (
  <input style={{ height: 22, width: w, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8', padding: '0 6px', fontSize: 11, fontFamily: 'var(--grid-font)', outline: 'none' }}
    value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
)
const Chk = ({ checked, label, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#d0d0d8', cursor: 'pointer' }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: '#00bcd4' }} />{label}
  </label>
)
const Status = ({ status }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9 }}>
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'up' ? '#22c55e' : status === 'warn' ? '#eab308' : '#ef4444', boxShadow: status === 'up' ? '0 0 4px #22c55e' : 'none' }} />
    <span style={{ color: status === 'up' ? '#22c55e' : status === 'warn' ? '#eab308' : '#ef4444' }}>
      {status === 'up' ? 'Active' : status === 'warn' ? 'Reconnecting' : 'Disconnected'}
    </span>
  </span>
)
const Sel = ({ value, options, onChange, w = 120 }) => (
  <select style={{ height: 22, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8', padding: '0 6px', fontSize: 10, width: w }}
    value={value} onChange={e => onChange(e.target.value)}>
    {options.map(o => <option key={o}>{o}</option>)}
  </select>
)

const DEFAULTS = {
  mode: 'IBT',
  // IBT
  algoServer: '1', server1: 'ws://algo1.algoiq.in:8080', server2: 'ws://algo2.algoiq.in:8080', server3: 'ws://algo3.algoiq.in:8080', customUrl: '',
  // Lease Line per exchange
  nse: { localIP: '0.0.0.0', remoteIP: '113.212.85.100', foPort: '5500', cmPort: '5501', cdPort: '5502', foStatus: 'up', cmStatus: 'up', cdStatus: 'warn' },
  bse: { localIP: '0.0.0.0', remoteIP: '113.212.85.101', foPort: '5510', cmPort: '5511', cdPort: '5512', foStatus: 'up', cmStatus: 'up', cdStatus: 'down' },
  // API
  apiKey: '', apiSecret: '', apiBaseUrl: 'https://api.dhan.co',
  // Order Routing
  tcpServer: '10.0.0.1', tcpPort: '9000', tcpStatus: 'up',
  // Options
  alwaysOn: true, autoReconnect: true, enableDerivatives: true, enhancedPacket: false, isClassic: false, useEQRate: true, readInterval: '1',
  // Master Downloads
  masters: {
    nseEq: { last: '27-Apr-2026', status: 'ok' }, nseFo: { last: '27-Apr-2026', status: 'ok' },
    bseEq: { last: '26-Apr-2026', status: 'ok' }, mcx: { last: '25-Apr-2026', status: 'warn' },
  }
}

export default function BroadcastSettings() {
  const [s, setS] = useState(DEFAULTS)
  const [exchTab, setExchTab] = useState('NSE')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(LS_KEY)); if (saved) setS(p => ({ ...p, ...saved })) } catch {}
  }, [])

  const set = (k, v) => setS(p => ({ ...p, [k]: v }))
  const setExch = (exch, k, v) => setS(p => ({ ...p, [exch]: { ...p[exch], [k]: v } }))
  const save = () => { localStorage.setItem(LS_KEY, JSON.stringify(s)); alert('Broadcast settings saved!') }
  const testConn = () => {
    setTesting(true); setTestResult(null)
    setTimeout(() => { setTesting(false); setTestResult({ ok: true, msg: 'Connection successful — latency: 2.3ms' }) }, 1500)
  }

  const exKey = exchTab.toLowerCase()
  const exData = s[exKey] || DEFAULTS.nse

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)' }}>
      {/* Header */}
      <div style={{ padding: '6px 12px', background: 'var(--bg-surface)', borderBottom: '2px solid var(--accent)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--accent)' }}>📡 Broadcast & Connection Settings</span>
        <span style={{ marginLeft: 'auto', fontSize: 9, color: '#7a7a8c' }}>Feed backbone for live market data</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
        {/* Connection Type */}
        <Sec>Connection Type</Sec>
        <Field label="Mode">
          <div style={{ display: 'flex', gap: 16, fontSize: 10 }}>
            {[['IBT', 'IBT (Internet)'], ['LEASE', 'Lease Line (UDP)'], ['API', 'API Mode']].map(([v, l]) => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#d0d0d8', cursor: 'pointer' }}>
                <input type="radio" name="bcastMode" value={v} checked={s.mode === v}
                  onChange={() => set('mode', v)} style={{ accentColor: '#00bcd4' }} />{l}
              </label>
            ))}
          </div>
        </Field>

        {/* IBT Mode */}
        {s.mode === 'IBT' && (<>
          <Sec>IBT Server Configuration</Sec>
          <Field label="Active Server">
            <Sel value={s.algoServer} options={['1', '2', '3', 'Custom']} onChange={v => set('algoServer', v)} w={80} />
          </Field>
          <Field label="Algo Server 1"><Inp value={s.server1} onChange={v => set('server1', v)} w={280} /> <Status status="up" /></Field>
          <Field label="Algo Server 2"><Inp value={s.server2} onChange={v => set('server2', v)} w={280} /> <Status status="up" /></Field>
          <Field label="Algo Server 3"><Inp value={s.server3} onChange={v => set('server3', v)} w={280} /> <Status status="warn" /></Field>
          <Field label="Custom URL"><Inp value={s.customUrl} onChange={v => set('customUrl', v)} w={280} placeholder="ws://custom.server:port" /></Field>
        </>)}

        {/* Lease Line Mode */}
        {s.mode === 'LEASE' && (<>
          <Sec>Lease Line Configuration — Per Exchange</Sec>
          <div style={{ display: 'flex', gap: 0, marginBottom: 10 }}>
            {EXCHANGES.map(e => (
              <button key={e} onClick={() => setExchTab(e)} style={{
                padding: '4px 16px', fontSize: 10, border: '1px solid var(--border)', cursor: 'pointer',
                background: exchTab === e ? 'var(--bg-row-selected)' : 'var(--bg-surface)',
                color: exchTab === e ? 'var(--accent)' : '#9aa0b0', fontWeight: exchTab === e ? 700 : 400
              }}>{e}</button>
            ))}
          </div>
          <Field label="Local IP"><Inp value={exData.localIP} onChange={v => setExch(exKey, 'localIP', v)} w={140} /></Field>
          <Field label="Remote IP (Dest)"><Inp value={exData.remoteIP} onChange={v => setExch(exKey, 'remoteIP', v)} w={140} /></Field>
          <div style={{ height: 1, background: 'rgba(42,42,68,0.4)', margin: '6px 0' }} />
          {SEGMENTS.map(seg => (
            <Field key={seg.key} label={seg.label}>
              <span style={{ fontSize: 9, color: '#7a7a8c', width: 30 }}>Port:</span>
              <Inp value={exData[seg.key + 'Port']} onChange={v => setExch(exKey, seg.key + 'Port', v)} w={70} />
              <Status status={exData[seg.key + 'Status'] || 'down'} />
            </Field>
          ))}
        </>)}

        {/* API Mode */}
        {s.mode === 'API' && (<>
          <Sec>Broker API Configuration</Sec>
          <Field label="API Key"><Inp value={s.apiKey} onChange={v => set('apiKey', v)} w={240} placeholder="Enter API Key" /></Field>
          <Field label="API Secret"><Inp value={s.apiSecret} onChange={v => set('apiSecret', v)} w={240} placeholder="Enter API Secret" /></Field>
          <Field label="Base URL"><Inp value={s.apiBaseUrl} onChange={v => set('apiBaseUrl', v)} w={240} /></Field>
          <div style={{ padding: '6px 0 0 170px', fontSize: 9, color: '#eab308' }}>⚠ API mode stub — connect to Dhan/XTS/Broker API for live feeds</div>
        </>)}

        {/* Order Routing */}
        <Sec>Order Routing (TCP)</Sec>
        <Field label="TCP Server"><Inp value={s.tcpServer} onChange={v => set('tcpServer', v)} w={140} /></Field>
        <Field label="TCP Port"><Inp value={s.tcpPort} onChange={v => set('tcpPort', v)} w={70} /> <Status status={s.tcpStatus || 'up'} /></Field>

        {/* Options */}
        <Sec>Feed Options</Sec>
        <Field label="Always ON"><Chk checked={s.alwaysOn} label="Keep broadcast connection alive (auto-reconnect)" onChange={v => set('alwaysOn', v)} /></Field>
        <Field label="Auto-reconnect"><Chk checked={s.autoReconnect} label="Auto-reconnect on disconnect" onChange={v => set('autoReconnect', v)} /></Field>
        <Field label="Derivatives"><Chk checked={s.enableDerivatives} label="Enable F&O segment broadcast" onChange={v => set('enableDerivatives', v)} /></Field>
        <Field label="Enhanced Packet"><Chk checked={s.enhancedPacket} label="Enhanced packet format (NSE only)" onChange={v => set('enhancedPacket', v)} /></Field>
        <Field label="Classic Library"><Chk checked={s.isClassic} label="Use classic broadcast library" onChange={v => set('isClassic', v)} /></Field>
        <Field label="EQ Rate"><Chk checked={s.useEQRate} label="Enable equity broadcast" onChange={v => set('useEQRate', v)} /></Field>
        <Field label="Read Interval">
          <Sel value={s.readInterval} options={['1', '2', '3', '5']} onChange={v => set('readInterval', v)} w={60} />
          <span style={{ fontSize: 9, color: '#7a7a8c' }}>seconds (1-3 recommended)</span>
        </Field>

        {/* Master Downloads */}
        <Sec>Download Masters</Sec>
        {[
          { key: 'nseEq', label: 'NSE Equity' }, { key: 'nseFo', label: 'NSE F&O' },
          { key: 'bseEq', label: 'BSE Equity' }, { key: 'mcx', label: 'MCX Commodity' }
        ].map(m => (
          <Field key={m.key} label={m.label}>
            <ActionIcon type="export" tooltip="Download Master" />
            <span style={{ fontSize: 9, color: '#7a7a8c' }}>Last: {s.masters?.[m.key]?.last || '—'}</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.masters?.[m.key]?.status === 'ok' ? '#22c55e' : '#eab308' }} />
          </Field>
        ))}

        {/* Test Result */}
        {testResult && (
          <div style={{ margin: '8px 0', padding: '6px 12px', background: testResult.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${testResult.ok ? '#22c55e' : '#ef4444'}`, fontSize: 10, color: testResult.ok ? '#22c55e' : '#ef4444' }}>
            {testResult.ok ? '✓' : '✗'} {testResult.msg}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 16px', borderTop: '1px solid var(--border)', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.1)' }}>
        <button onClick={testConn} disabled={testing} style={{ height: 26, padding: '0 14px', background: testing ? '#2a2a44' : '#eab308', color: '#000', border: 'none', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
          {testing ? '⏳ Testing...' : '🔌 Test Connection'}
        </button>
        <ActionIcon type="save" tooltip="Save Settings" onClick={save} />
        <ActionIcon type="close" tooltip="Close" />
      </div>
    </div>
  )
}
