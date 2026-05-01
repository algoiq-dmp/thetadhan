import { useState, useEffect } from 'react'
import { THEME_NAMES, THEME_META, applyTheme } from '../themes'
import { playTradeBeep, playRejectBeep, playAlertBeep, playOrderBeep } from '../utils/sounds'
import { createBackup, getBackupList, restoreBackup, deleteBackup } from '../utils/backup'
import ActionIcon from '../components/ActionIcons'

const TABS = [
  { id: 'theme', label: '⭐ Theme' },
  { id: 'general', label: 'General' },
  { id: 'trading', label: 'Trading' },
  { id: 'display', label: 'Display' },
  { id: 'mw', label: 'Market Watch' },
  { id: 'columns', label: 'Columns' },
  { id: 'charts', label: 'Charts' },
  { id: 'risk', label: 'Risk' },
  { id: 'connect', label: 'Connection' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'about', label: 'About' },
]

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 7 }}>
    <span style={{ width: 160, fontSize: 10, color: '#9aa0b0', textAlign: 'right', paddingRight: 12, flexShrink: 0 }}>{label}</span>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
)
const Sel = ({ value, options, onChange, w = 180 }) => (
  <select style={{ height: 22, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8', padding: '0 6px', fontSize: 10, fontFamily: 'var(--grid-font)', width: w }}
    value={value} onChange={e => onChange(e.target.value)}>
    {options.map(o => <option key={o}>{o}</option>)}
  </select>
)
const Chk = ({ checked, label, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#d0d0d8', cursor: 'pointer' }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: '#00bcd4' }} />{label}
  </label>
)
const Rad = ({ name, value, options, onChange }) => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
    {options.map(o => (
      <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#d0d0d8', cursor: 'pointer' }}>
        <input type="radio" name={name} value={o} checked={value === o} onChange={() => onChange(o)} style={{ accentColor: '#00bcd4', width: 12, height: 12 }} />{o}
      </label>
    ))}
  </div>
)
const Inp = ({ value, onChange, w = 180, type = 'text' }) => (
  <input type={type} style={{ height: 22, width: w, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8', padding: '0 6px', fontSize: 11, fontFamily: 'var(--grid-font)', outline: 'none' }}
    value={value} onChange={e => onChange(e.target.value)} />
)
const Sec = ({ children }) => (
  <div style={{ fontSize: 10, color: '#6a6a7a', padding: '6px 0 4px', borderBottom: '1px solid rgba(42,42,68,0.5)', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>── {children} ──</div>
)
const Indicator = ({ status, label }) => (
  <span style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'up' ? '#22c55e' : status === 'warn' ? '#eab308' : '#ef4444' }} />
    <span style={{ color: '#d0d0d8' }}>{label}</span>
  </span>
)
const ColorBox = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <div style={{ width: 24, height: 18, background: color, border: '1px solid #3a3a5a' }} />
    <span style={{ fontSize: 10, color: '#d0d0d8', fontFamily: 'var(--grid-font)' }}>{color}</span>
    <span style={{ fontSize: 9, color: '#7a7a8c' }}>({label})</span>
  </div>
)

// All 28 MW columns for Column Profile Manager
const ALL_COLUMNS = [
  { key: 'symbol', label: 'Symbol/Scrip', locked: true },
  { key: 'exchange', label: 'Exchange' },
  { key: 'instrument', label: 'Instrument' },
  { key: 'ltp', label: 'LTP', locked: true },
  { key: 'chg', label: 'Change' },
  { key: 'chgP', label: '% Change' },
  { key: 'open', label: 'Open' },
  { key: 'high', label: 'High' },
  { key: 'low', label: 'Low' },
  { key: 'close', label: 'Close/Prev Close' },
  { key: 'bidPrice', label: 'Bid Price' },
  { key: 'bidQty', label: 'Bid Qty' },
  { key: 'askPrice', label: 'Ask Price' },
  { key: 'askQty', label: 'Ask Qty' },
  { key: 'vol', label: 'Volume' },
  { key: 'oi', label: 'Open Interest' },
  { key: 'oiChg', label: 'OI Change' },
  { key: 'atp', label: 'ATP' },
  { key: 'ltq', label: 'LTQ' },
  { key: 'totalBuyQty', label: 'Total Buy Qty' },
  { key: 'totalSellQty', label: 'Total Sell Qty' },
  { key: 'upperCkt', label: 'Upper Circuit' },
  { key: 'lowerCkt', label: 'Lower Circuit' },
  { key: 'w52High', label: '52W High' },
  { key: 'w52Low', label: '52W Low' },
  { key: 'expiry', label: 'Expiry' },
  { key: 'strikePrice', label: 'Strike Price' },
  { key: 'optionType', label: 'Option Type' },
  { key: 'lotSize', label: 'Lot Size' },
  { key: 'turnover', label: 'Turnover' },
]

export default function SettingsScreen() {
  const [tab, setTab] = useState('theme')
  const [s, setS] = useState({
    // Master Theme
    themePreset: 'ODIN Classic', buyColor: '#1565C0', sellColor: '#C62828', gridFont: 'Tahoma 11px', windowChrome: 'ODIN Classic', menuStyle: 'ODIN Classic',
    // General
    theme: 'Dark', language: 'English', timezone: 'IST', autoLogin: false, defaultWorkspace: 'Last used', fullscreenStart: false, confirmExit: true, autoSaveWorkspace: true,
    // Trading
    defaultProduct: 'MIS', defaultOrderType: 'LMT', defaultValidity: 'DAY', confirmSubmit: true, qtyMultiplier: '1', showDepthInOrder: true, autoSquareOffTime: '15:20', posRefreshInterval: '3s',
    // Display
    fontSize: '11px', fontFamily: 'Tahoma', rowHeight: 'Compact', flashDuration: '500ms', numberFormat: 'Indian (1,00,000)', decimalPrecision: '2', colorScheme: 'Classic ODIN', showGridlines: true,
    // Market Watch
    defaultSector: 'All', defaultSort: 'Symbol', autoRefresh: true, refreshInterval: '3s', maxRows: '220', showSeparators: true, freezeSymbol: true, flashOnTick: true,
    // Connection
    adminUrl: 'ws://192.168.1.100:8080', connProtocol: 'WebSocket', autoReconnect: true, reconnectInterval: '3s', connTimeout: '30', keepAlive: '10s', dataCompression: true, fallbackUrl: '', connEncryption: 'WSS (SSL)',
    // Alerts
    tradeSound: true, rejectionSound: true, alertSound: true, desktopNotif: true, msgFlashDuration: '5s', soundVolume: 70,
  })
  const set = (k, v) => setS(p => ({ ...p, [k]: v }))

  // Persist settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('lightz-settings', JSON.stringify(s))
    localStorage.setItem('lightz-col-profile', JSON.stringify({ active: activeProfile, visible: visibleCols, order: colOrder }))
  }
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('lightz-settings'))
      if (saved) setS(p => ({ ...p, ...saved }))
      const colSaved = JSON.parse(localStorage.getItem('lightz-col-profile'))
      if (colSaved) { setActiveProfile(colSaved.active || 'All Columns'); setVisibleCols(colSaved.visible || ALL_COLUMNS.map(c => c.key)); setColOrder(colSaved.order || ALL_COLUMNS.map(c => c.key)) }
    } catch {}
  }, [])

  // Column Profile state
  const [activeProfile, setActiveProfile] = useState('All Columns')
  const [visibleCols, setVisibleCols] = useState(ALL_COLUMNS.map(c => c.key))
  const [colOrder, setColOrder] = useState(ALL_COLUMNS.map(c => c.key))
  const toggleCol = (key) => {
    const col = ALL_COLUMNS.find(c => c.key === key)
    if (col?.locked) return
    setVisibleCols(v => v.includes(key) ? v.filter(k => k !== key) : [...v, key])
  }
  const moveColUp = (key) => setColOrder(prev => {
    const idx = prev.indexOf(key); if (idx <= 0) return prev
    const arr = [...prev]; [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]; return arr
  })
  const moveColDown = (key) => setColOrder(prev => {
    const idx = prev.indexOf(key); if (idx < 0 || idx >= prev.length - 1) return prev
    const arr = [...prev]; [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]; return arr
  })

  const renderTab = () => {
    switch (tab) {
      case 'theme': return (<>
        <Sec>⭐ Terminal Theme</Sec>
        <div style={{ padding: '6px 8px', background: 'rgba(0,188,212,0.06)', border: '1px solid rgba(0,188,212,0.2)', marginBottom: 12, fontSize: 10, color: '#9aa0b0' }}>
          ONE-CLICK theme switch — instantly changes entire UI. Colors, backgrounds, borders, and accents all update live. No restart needed.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {THEME_NAMES.map(name => {
            const meta = THEME_META[name]
            const active = s.themePreset === name
            return (
              <button key={name} onClick={() => { set('themePreset', name); applyTheme(name) }} style={{
                padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
                background: active ? 'rgba(0,188,212,0.08)' : 'rgba(255,255,255,0.02)',
                border: active ? '2px solid var(--accent)' : '1px solid var(--border)',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{meta.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? 'var(--accent)' : 'var(--text-primary)' }}>{name}</span>
                  {active && <span style={{ marginLeft: 'auto', fontSize: 8, padding: '1px 6px', background: 'var(--accent)', color: '#000', fontWeight: 700 }}>ACTIVE</span>}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginBottom: 8 }}>{meta.desc}</div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {meta.colors.map((c, ci) => (
                    <div key={ci} style={{ width: 28, height: 14, background: c, border: '1px solid rgba(255,255,255,0.1)' }}
                      title={['Background','Accent','Buy','Sell'][ci]} />
                  ))}
                  <span style={{ fontSize: 7, color: 'var(--text-muted)', marginLeft: 4, alignSelf: 'center' }}>BG • Accent • Buy • Sell</span>
                </div>
              </button>
            )
          })}
        </div>
        <Sec>Typography & Chrome</Sec>
        <Field label="Grid Font"><Sel value={s.gridFont} options={['Tahoma 11px','Inter 12px','Segoe UI 11px','Consolas 11px']} onChange={v => set('gridFont',v)} /></Field>
        <Field label="Window Chrome"><Sel value={s.windowChrome} options={['ODIN Classic','Modern (dark)']} onChange={v => set('windowChrome',v)} /></Field>
        <Field label="Menu Style"><Sel value={s.menuStyle} options={['ODIN Classic (Win32)','Modern (flat)']} onChange={v => set('menuStyle',v)} /></Field>
      </>)
      case 'general': return (<>
        <Sec>Display</Sec>
        <Field label="Theme"><Sel value={s.themePreset} options={THEME_NAMES} onChange={v => { set('themePreset', v); applyTheme(v) }} /></Field>
        <Field label="Language"><Sel value={s.language} options={['English','Hindi','Gujarati','Marathi']} onChange={v => set('language',v)} /></Field>
        <Field label="Timezone"><Sel value={s.timezone} options={['IST','UTC']} onChange={v => set('timezone',v)} /></Field>
        <Sec>Startup</Sec>
        <Field label="Auto Login"><Chk checked={s.autoLogin} label="Remember credentials" onChange={v => set('autoLogin',v)} /></Field>
        <Field label="Default Workspace"><Sel value={s.defaultWorkspace} options={['Last used','Default','My Trading','Scalping','Options']} onChange={v => set('defaultWorkspace',v)} /></Field>
        <Field label="Fullscreen on Start"><Chk checked={s.fullscreenStart} label="Auto-enter fullscreen" onChange={v => set('fullscreenStart',v)} /></Field>
        <Sec>Exit Behavior</Sec>
        <Field label="Confirm on Exit"><Chk checked={s.confirmExit} label="Ask before closing" onChange={v => set('confirmExit',v)} /></Field>
        <Field label="Auto-save Workspace"><Chk checked={s.autoSaveWorkspace} label="Save layout on exit" onChange={v => set('autoSaveWorkspace',v)} /></Field>
        <Sec>💾 Backup & Restore</Sec>
        <Field label="Auto-backup on Exit"><Chk checked={s.autoBackup !== false} label="Save all settings when closing" onChange={v => set('autoBackup',v)} /></Field>
        <Field label="Manual Backup">
          <button onClick={() => { createBackup('manual'); alert('Backup created!') }} style={{ padding: '3px 12px', fontSize: 9, background: 'var(--accent)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700 }}>📦 Backup Now</button>
        </Field>
        <Field label="Restore">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {getBackupList().length === 0 ? <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>No backups found</span> :
              getBackupList().slice(0, 5).map(b => (
                <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, padding: '2px 4px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 8, fontFamily: 'var(--grid-font)' }}>{new Date(b.timestamp).toLocaleString()}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{b.label}</span>
                  <span style={{ fontSize: 7, color: 'var(--text-muted)' }}>{b.stateKeys} keys</span>
                  <button onClick={() => { if (confirm('Restore this backup? Current settings will be overwritten.')) { restoreBackup(b.key); window.location.reload() } }} style={{ marginLeft: 'auto', padding: '1px 6px', fontSize: 8, background: 'var(--buy)', color: '#fff', border: 'none', cursor: 'pointer' }}>Restore</button>
                  <button onClick={() => { deleteBackup(b.key); set('_tick', Date.now()) }} style={{ padding: '1px 6px', fontSize: 8, background: 'var(--sell)', color: '#fff', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
              ))
            }
          </div>
        </Field>
      </>)
      case 'trading': return (<>
        <Sec>Default Order Settings</Sec>
        <Field label="Default Product"><Rad name="dp" value={s.defaultProduct} options={['MIS','NRML','CNC']} onChange={v => set('defaultProduct',v)} /></Field>
        <Field label="Default Order Type"><Rad name="dot" value={s.defaultOrderType} options={['MKT','LMT','SL','SL-M']} onChange={v => set('defaultOrderType',v)} /></Field>
        <Field label="Default Validity"><Rad name="dv" value={s.defaultValidity} options={['DAY','IOC','GTD']} onChange={v => set('defaultValidity',v)} /></Field>
        <Sec>Order Confirmation</Sec>
        <Field label="Confirm Before Submit"><Chk checked={s.confirmSubmit} label="Show confirmation dialog" onChange={v => set('confirmSubmit',v)} /></Field>
        <Sec>Quantity</Sec>
        <Field label="Default Qty Multiplier"><Inp value={s.qtyMultiplier} onChange={v => set('qtyMultiplier',v)} w={60} type="number" /></Field>
        <Field label="Show Depth in Order"><Chk checked={s.showDepthInOrder} label="Display Best 5 in Buy/Sell" onChange={v => set('showDepthInOrder',v)} /></Field>
        <Sec>Auto Square-off</Sec>
        <Field label="Auto Square-off Time"><Inp value={s.autoSquareOffTime} onChange={v => set('autoSquareOffTime',v)} w={80} /></Field>
        <Field label="Position Refresh"><Sel value={s.posRefreshInterval} options={['1s','3s','5s','10s']} onChange={v => set('posRefreshInterval',v)} w={80} /></Field>
      </>)
      case 'display': return (<>
        <Sec>Font & Grid</Sec>
        <Field label="Font Size"><Sel value={s.fontSize} options={['9px','10px','11px','12px','13px','14px']} onChange={v => set('fontSize',v)} /></Field>
        <Field label="Font Family"><Sel value={s.fontFamily} options={['Tahoma','Inter','Segoe UI','Arial','Consolas']} onChange={v => set('fontFamily',v)} /></Field>
        <Field label="Row Height"><Rad name="rh" value={s.rowHeight} options={['Compact','Normal','Comfortable']} onChange={v => set('rowHeight',v)} /></Field>
        <Sec>Animation & Format</Sec>
        <Field label="LTP Flash Duration"><Sel value={s.flashDuration} options={['200ms','500ms','1000ms']} onChange={v => set('flashDuration',v)} /></Field>
        <Field label="Number Format"><Sel value={s.numberFormat} options={['Indian (1,00,000)','International (100,000)']} onChange={v => set('numberFormat',v)} /></Field>
        <Field label="Decimal Precision"><Sel value={s.decimalPrecision} options={['2','4']} onChange={v => set('decimalPrecision',v)} w={60} /></Field>
        <Sec>Appearance</Sec>
        <Field label="Color Scheme"><Rad name="cs" value={s.colorScheme} options={['Classic ODIN','Bloomberg','Custom']} onChange={v => set('colorScheme',v)} /></Field>
        <Field label="Show Gridlines"><Chk checked={s.showGridlines} label="Grid lines in Market Watch" onChange={v => set('showGridlines',v)} /></Field>
      </>)
      case 'mw': return (<>
        <Sec>Data Feed</Sec>
        <Field label="Auto-refresh Data"><Chk checked={s.autoRefresh} label="Enable real-time streaming" onChange={v => set('autoRefresh',v)} /></Field>
        <Field label="Refresh Interval"><Sel value={s.refreshInterval} options={['500ms','1s','3s','5s','10s']} onChange={v => set('refreshInterval',v)} w={80} /></Field>
        <Field label="Flash on Tick"><Chk checked={s.flashOnTick} label="Green/red flash on LTP change" onChange={v => set('flashOnTick',v)} /></Field>
        <Sec>Layout</Sec>
        <Field label="Default Sector"><Sel value={s.defaultSector} options={['All','NIFTY50','Bank','IT','Pharma','Auto','Metal','FMCG']} onChange={v => set('defaultSector',v)} /></Field>
        <Field label="Default Sort"><Sel value={s.defaultSort} options={['Symbol','LTP','Change%','Volume','OI']} onChange={v => set('defaultSort',v)} /></Field>
        <Field label="Max Rows"><Inp value={s.maxRows} onChange={v => set('maxRows',v)} w={60} type="number" /></Field>
        <Sec>Features</Sec>
        <Field label="Separator Rows"><Chk checked={s.showSeparators} label="Allow Shift+Enter spacers" onChange={v => set('showSeparators',v)} /></Field>
        <Field label="Freeze Symbol Col"><Chk checked={s.freezeSymbol} label="Pin symbol column" onChange={v => set('freezeSymbol',v)} /></Field>
      </>)
      case 'columns': return (<>
        <Sec>Column Profile Manager</Sec>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#7a7a8c' }}>Active Profile:</span>
          <Sel value={activeProfile} options={['All Columns','Basic','Equity View','FnO View','Custom']} onChange={setActiveProfile} w={140} />
          <ActionIcon type="save" tooltip="Save Profile" />
          <ActionIcon type="add" tooltip="New Profile" />
          <ActionIcon type="remove" tooltip="Delete Profile" />
        </div>
        <div style={{ fontSize: 9, color: '#7a7a8c', marginBottom: 8 }}>
          Toggle columns ON/OFF. Use ▲/▼ to reorder. Locked columns (Symbol, LTP) cannot be hidden. {visibleCols.length}/{ALL_COLUMNS.length} visible.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px' }}>
          {colOrder.map(k => ALL_COLUMNS.find(c => c.key === k)).filter(Boolean).map((c, i) => (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 4px', fontSize: 10, color: visibleCols.includes(c.key) ? '#d0d0d8' : '#5a5a6a', background: visibleCols.includes(c.key) ? 'rgba(0,188,212,0.04)' : 'transparent', borderBottom: '1px solid rgba(42,42,68,0.2)' }}>
              <button onClick={() => moveColUp(c.key)} style={{ fontSize: 8, padding: '0 2px', background: 'transparent', border: 'none', color: '#7a7a8c', cursor: 'pointer' }} title="Move Up">▲</button>
              <button onClick={() => moveColDown(c.key)} style={{ fontSize: 8, padding: '0 2px', background: 'transparent', border: 'none', color: '#7a7a8c', cursor: 'pointer' }} title="Move Down">▼</button>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: c.locked ? 'not-allowed' : 'pointer', flex: 1 }}>
                <input type="checkbox" checked={visibleCols.includes(c.key)} onChange={() => toggleCol(c.key)} disabled={c.locked} style={{ accentColor: '#00bcd4' }} />
                <span style={{ fontSize: 9, color: '#5a5a6a', minWidth: 12 }}>{i + 1}.</span>
                {c.label}
                {c.locked && <span style={{ fontSize: 8, color: '#eab308', marginLeft: 4 }}>🔒</span>}
              </label>
            </div>
          ))}
        </div>
      </>)
      case 'connect': return (<>
        <Sec>Admin Server (Client → Admin)</Sec>
        <Field label="Admin Server URL"><Inp value={s.adminUrl} onChange={v => set('adminUrl',v)} w={220} /></Field>
        <Field label="Protocol"><Rad name="cp" value={s.connProtocol} options={['WebSocket','TCP']} onChange={v => set('connProtocol',v)} /></Field>
        <Field label="Encryption"><Rad name="ce" value={s.connEncryption} options={['WSS (SSL)','WS (Plain)']} onChange={v => set('connEncryption',v)} /></Field>
        <Sec>Reconnection</Sec>
        <Field label="Auto-reconnect"><Chk checked={s.autoReconnect} label="Reconnect on disconnect" onChange={v => set('autoReconnect',v)} /></Field>
        <Field label="Reconnect Interval"><Sel value={s.reconnectInterval} options={['1s','3s','5s','10s']} onChange={v => set('reconnectInterval',v)} w={80} /></Field>
        <Field label="Connection Timeout"><Inp value={s.connTimeout} onChange={v => set('connTimeout',v)} w={60} /> <span style={{ fontSize: 9, color: '#7a7a8c', marginLeft: 4 }}>sec</span></Field>
        <Field label="Keep-Alive Interval"><Sel value={s.keepAlive} options={['5s','10s','30s']} onChange={v => set('keepAlive',v)} w={80} /></Field>
        <Field label="Data Compression"><Chk checked={s.dataCompression} label="perMessageDeflate" onChange={v => set('dataCompression',v)} /></Field>
        <Field label="Fallback Server"><Inp value={s.fallbackUrl} onChange={v => set('fallbackUrl',v)} w={220} /></Field>
        <Sec>Exchange Status (Read-Only)</Sec>
        <Field label="NSE"><Indicator status="up" label="Connected — 2ms" /></Field>
        <Field label="BSE"><Indicator status="up" label="Connected — 3ms" /></Field>
        <Field label="MCX"><Indicator status="warn" label="Reconnecting..." /></Field>
        <Field label="Feed Latency"><span style={{ fontSize: 11, fontFamily: 'var(--grid-font)', color: '#22c55e' }}>1.2ms</span></Field>
        <Field label="Connection Mode"><span style={{ fontSize: 10, color: '#d0d0d8' }}>Lease Line (Primary)</span></Field>
        <Sec>📄 Contract & Security Masters</Sec>
        <Field label="Auto-load on Connect"><Chk checked={s.autoLoadContracts !== false} label="Download contract master on login" onChange={v => set('autoLoadContracts',v)} /></Field>
        <Field label="Auto-load Security"><Chk checked={s.autoLoadSecurity !== false} label="Download security master at BOD" onChange={v => set('autoLoadSecurity',v)} /></Field>
        <Field label="Master File Path">
          <Inp value={s.masterFilePath || 'data/masters/'} onChange={v => set('masterFilePath',v)} w={200} />
        </Field>
        <Field label="Last Updated">
          <span style={{ fontSize: 10, fontFamily: 'var(--grid-font)', color: '#22c55e' }}>27-Apr-2026 09:00:05 IST</span>
        </Field>
        <Field label="Status">
          <div style={{ display: 'flex', gap: 8, fontSize: 9 }}>
            <span style={{ color: '#22c55e' }}>✓ NSE F&O: 8,542 contracts</span>
            <span style={{ color: '#22c55e' }}>✓ BSE: 5,218 securities</span>
            <span style={{ color: '#eab308' }}>⟳ MCX: Loading...</span>
          </div>
        </Field>
      </>)
      case 'alerts': return (<>
        <Sec>🔊 Sound Alerts</Sec>
        <Field label="Trade Execution">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Chk checked={s.tradeSound} label="Play sound on trade" onChange={v => set('tradeSound',v)} />
            <button onClick={playTradeBeep} style={{ padding: '2px 8px', fontSize: 8, background: 'var(--bg-input)', color: 'var(--profit)', border: '1px solid var(--border)', cursor: 'pointer' }}>▶ Test</button>
          </div>
        </Field>
        <Field label="Order Rejection">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Chk checked={s.rejectionSound} label="Play sound on rejection" onChange={v => set('rejectionSound',v)} />
            <button onClick={playRejectBeep} style={{ padding: '2px 8px', fontSize: 8, background: 'var(--bg-input)', color: 'var(--loss)', border: '1px solid var(--border)', cursor: 'pointer' }}>▶ Test</button>
          </div>
        </Field>
        <Field label="Alert Trigger">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Chk checked={s.alertSound} label="Play on price/volume alert" onChange={v => set('alertSound',v)} />
            <button onClick={playAlertBeep} style={{ padding: '2px 8px', fontSize: 8, background: 'var(--bg-input)', color: '#eab308', border: '1px solid var(--border)', cursor: 'pointer' }}>▶ Test</button>
          </div>
        </Field>
        <Field label="Order Placed">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Chk checked={s.orderSound !== false} label="Soft click on order submit" onChange={v => set('orderSound',v)} />
            <button onClick={playOrderBeep} style={{ padding: '2px 8px', fontSize: 8, background: 'var(--bg-input)', color: 'var(--accent)', border: '1px solid var(--border)', cursor: 'pointer' }}>▶ Test</button>
          </div>
        </Field>
        <Sec>Notifications</Sec>
        <Field label="Desktop Notifications"><Chk checked={s.desktopNotif} label="Browser notifications" onChange={v => set('desktopNotif',v)} /></Field>
        <Field label="Message Flash"><Sel value={s.msgFlashDuration} options={['2s','5s','10s','Persistent']} onChange={v => set('msgFlashDuration',v)} w={100} /></Field>
        <Sec>Volume</Sec>
        <Field label="Sound Volume">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="range" min="0" max="100" value={s.soundVolume} onChange={e => set('soundVolume', parseInt(e.target.value))} style={{ width: 140, accentColor: 'var(--accent)' }} />
            <span style={{ fontSize: 10, fontFamily: 'var(--grid-font)', color: 'var(--text-primary)', width: 30 }}>{s.soundVolume}%</span>
          </div>
        </Field>
      </>)
      case 'risk': return (<>
        <Sec>Exposure & Position Limits</Sec>
        <Field label="Max Open Positions"><Inp value={s.maxPositions || '20'} onChange={v => set('maxPositions', v)} w={80} /></Field>
        <Field label="Max Order Value (₹)"><Inp value={s.maxOrderValue || '5000000'} onChange={v => set('maxOrderValue', v)} w={120} /></Field>
        <Field label="Max Day Turnover (₹)"><Inp value={s.maxDayTurnover || '50000000'} onChange={v => set('maxDayTurnover', v)} w={120} /></Field>
        <Field label="Max Single Order Qty"><Inp value={s.maxSingleQty || '5000'} onChange={v => set('maxSingleQty', v)} w={80} /></Field>
        <Sec>Margin & Square-Off</Sec>
        <Field label="Margin Display"><Rad name="marginDisp" value={s.marginDisplay || 'Available'} options={['Available', 'Used', 'Both']} onChange={v => set('marginDisplay', v)} /></Field>
        <Field label="MIS Square-Off Time"><Inp value={s.autoSquareOffTime || '15:20'} onChange={v => set('autoSquareOffTime', v)} w={80} /></Field>
        <Field label="Square-Off Warning (min)"><Inp value={s.sqOffWarning || '10'} onChange={v => set('sqOffWarning', v)} w={60} /></Field>
        <Field label="Auto Square-Off"><Chk checked={s.autoSquareOff !== false} label="Auto square-off MIS at configured time" onChange={v => set('autoSquareOff', v)} /></Field>
        <Sec>Kill Switch & Protection</Sec>
        <Field label="Max Loss Limit (₹)"><Inp value={s.maxLoss || '25000'} onChange={v => set('maxLoss', v)} w={100} /></Field>
        <Field label="Kill Switch"><Chk checked={s.killSwitch || false} label="Kill switch — halt all orders when max loss hit" onChange={v => set('killSwitch', v)} /></Field>
        <Field label="Price Band Check"><Chk checked={s.priceBandCheck !== false} label="Reject orders outside circuit limits" onChange={v => set('priceBandCheck', v)} /></Field>
        <Field label="Duplicate Check"><Chk checked={s.duplicateCheck !== false} label="Warn on duplicate orders within 5 sec" onChange={v => set('duplicateCheck', v)} /></Field>
        <Sec>Exchange Limits (Read Only)</Sec>
        <Field label="NSE Freeze Qty"><Indicator status="up" label="NIFTY: 1800 | BANKNIFTY: 1200 | EQ: 500000" /></Field>
        <Field label="Max Orders/Sec"><Indicator status="up" label="<10 OPS (SEBI)" /></Field>
      </>)
      case 'charts': return (<>
        <Sec>Chart Defaults</Sec>
        <Field label="Default Timeframe"><Sel value={s.chartTimeframe || '5m'} options={['1m','5m','15m','30m','1H','4H','1D','1W']} onChange={v => set('chartTimeframe', v)} /></Field>
        <Field label="Chart Type"><Sel value={s.chartType || 'Candlestick'} options={['Candlestick','Line','Area','Bar','Heikin-Ashi']} onChange={v => set('chartType', v)} /></Field>
        <Field label="Color Scheme"><Sel value={s.chartColors || 'ODIN Classic'} options={['ODIN Classic','Bloomberg','Light','Dark Pro']} onChange={v => set('chartColors', v)} /></Field>
        <Sec>Default Indicators</Sec>
        <Field label="SMA"><Chk checked={s.chartSMA !== false} label="Show SMA (20) by default" onChange={v => set('chartSMA', v)} /></Field>
        <Field label="EMA"><Chk checked={s.chartEMA || false} label="Show EMA (9, 21) by default" onChange={v => set('chartEMA', v)} /></Field>
        <Field label="Bollinger Bands"><Chk checked={s.chartBB || false} label="Show Bollinger Bands (20,2)" onChange={v => set('chartBB', v)} /></Field>
        <Field label="RSI Panel"><Chk checked={s.chartRSI || false} label="Show RSI (14) sub-panel" onChange={v => set('chartRSI', v)} /></Field>
        <Field label="MACD Panel"><Chk checked={s.chartMACD || false} label="Show MACD (12,26,9) sub-panel" onChange={v => set('chartMACD', v)} /></Field>
        <Field label="VWAP"><Chk checked={s.chartVWAP || false} label="Show VWAP overlay" onChange={v => set('chartVWAP', v)} /></Field>
        <Sec>Chart Display</Sec>
        <Field label="Show Volume"><Chk checked={s.chartVolume !== false} label="Volume bars at bottom" onChange={v => set('chartVolume', v)} /></Field>
        <Field label="Show Grid"><Chk checked={s.chartGrid !== false} label="Grid lines" onChange={v => set('chartGrid', v)} /></Field>
        <Field label="Crosshair"><Chk checked={s.chartCrosshair !== false} label="Show crosshair on hover" onChange={v => set('chartCrosshair', v)} /></Field>
        <Field label="Auto Scale"><Chk checked={s.chartAutoScale !== false} label="Auto-fit price range" onChange={v => set('chartAutoScale', v)} /></Field>
        <Field label="Last Price Line"><Chk checked={s.chartLastLine !== false} label="Dashed line at LTP" onChange={v => set('chartLastLine', v)} /></Field>
      </>)
      case 'about': return (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)', letterSpacing: 2 }}>⚡ LIGHT Z</div>
          <div style={{ fontSize: 11, color: '#7a7a8c', marginTop: 4 }}>ALGO IQ • Trading Terminal</div>
          <div style={{ fontSize: 12, color: '#d0d0d8', marginTop: 16 }}>Version 1.0.0</div>
          <div style={{ fontSize: 10, color: '#7a7a8c', marginTop: 4 }}>CTCL Terminal • Electron + React + Zustand</div>
          <div style={{ height: 1, background: 'rgba(42,42,68,0.5)', margin: '16px 40px' }} />
          <div style={{ fontSize: 10, color: '#7a7a8c' }}>Build: 2025.04.27 • React 18 • Vite 5</div>
          <div style={{ fontSize: 10, color: '#7a7a8c', marginTop: 8 }}>© 2025 AlgoIQ Technologies Pvt. Ltd.</div>
        </div>
      )
      default: return null
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      <div style={{ width: 105, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '4px 0', overflow: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '6px 8px', fontSize: 10, textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'var(--ui-font)',
            background: tab === t.id ? 'var(--bg-row-selected)' : 'transparent',
            color: tab === t.id ? 'var(--accent)' : '#9aa0b0',
            borderLeft: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent'
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, padding: '8px 16px', overflow: 'auto' }}>{renderTab()}</div>
        {tab !== 'about' && (
          <div style={{ display: 'flex', gap: 6, padding: '6px 16px', borderTop: '1px solid var(--border)', justifyContent: 'flex-end' }}>
            <ActionIcon type="submit" tooltip="Apply Settings" onClick={saveSettings} />
            <ActionIcon type="save" tooltip="Save & Close" onClick={() => { saveSettings(); alert('Settings saved!') }} />
            <ActionIcon type="reset" tooltip="Cancel" />
          </div>
        )}
      </div>
    </div>
  )
}
