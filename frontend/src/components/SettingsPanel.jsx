import { useState, lazy, Suspense } from 'react';
import useMarketStore from '../store/useMarketStore';
import useBrokerStore from '../store/useBrokerStore';

const TABS = ['General', 'Keyboard', 'Mkt Watch', 'OMS', 'RMS', 'Brackets', 'QF Macros', 'AI', 'Connector', 'Alerts', 'Layout'];
const ICONS = { General: '📋', Keyboard: '⌨️', 'Mkt Watch': '📊', OMS: '📝', RMS: '🛡️', Brackets: '📌', 'QF Macros': '⚡', AI: '🤖', Connector: '🔌', Alerts: '🔊', Layout: '🎛️' };

function Toggle({ value, onChange, disabled }) {
  return (
    <label className="toggle" style={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />
      <div className="toggle-track" />
      <div className="toggle-thumb" />
    </label>
  );
}

function SettingRow({ label, hint, children }) {
  return (
    <div className="setting-row">
      <div><div className="setting-label">{label}</div>{hint && <div className="setting-hint">{hint}</div>}</div>
      {children}
    </div>
  );
}

function SectionHeader({ title, icon }) {
  return (
    <div style={{ padding: '10px 0 6px', fontWeight: 700, fontSize: 12, color: 'var(--cyan)', borderTop: '1px solid var(--border)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
      {icon && <span>{icon}</span>}{title}
    </div>
  );
}

function SelectInput({ value, options, onChange, width = 110 }) {
  return (
    <select className="filter-select" value={value} onChange={e => onChange(e.target.value)} style={{ width }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function NumberInput({ value, onChange, width = 70, min, max, step }) {
  return <input className="filter-select" type="number" value={value} onChange={e => onChange(+e.target.value)} style={{ width }} min={min} max={max} step={step} />;
}

/** ConnectorTab — Full multi-broker login and status UI */
function ConnectorTab({ s, update, simulatedFeeds, toggleSimulatedFeeds, setSimulatedFeeds }) {
  const { activeBroker, brokerStatus, feedConnected, brokerProfile, lastError, availableBrokers, loginBroker, logoutBroker } = useBrokerStore();
  const [creds, setCreds] = useState({ clientId: '', accessToken: '', apiKey: '', secretKey: '' });
  const [loading, setLoading] = useState(false);

  const selectedBroker = s.connector || 'paper';
  const statusColor = brokerStatus === 'connected' ? '#10b981' : brokerStatus === 'connecting' ? '#f59e0b' : brokerStatus === 'error' ? '#ef4444' : '#475569';
  const statusLabel = brokerStatus === 'connected' ? `✓ Connected to ${activeBroker?.toUpperCase()}` : brokerStatus === 'connecting' ? 'Connecting...' : brokerStatus === 'error' ? `✗ Error: ${lastError}` : 'Not Connected';

  const handleLogin = async () => {
    setLoading(true);
    await loginBroker(selectedBroker, creds);
    setLoading(false);
  };

  return (
    <>
      <SectionHeader title="Broker Selection" icon="🔌" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
        {[{ id: 'paper', name: 'Paper', icon: '📄' }, ...availableBrokers].map(b => (
          <button key={b.id} onClick={() => update('connector', b.id)}
            disabled={b.disabled}
            style={{
              padding: '8px 6px', borderRadius: 8, cursor: b.disabled ? 'not-allowed' : 'pointer',
              border: `2px solid ${selectedBroker === b.id ? '#06b6d4' : 'var(--border)'}`,
              background: selectedBroker === b.id ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.02)',
              color: b.disabled ? 'var(--text-muted)' : 'var(--text-heading)', fontSize: 11, fontWeight: 600,
              opacity: b.disabled ? 0.4 : 1, textAlign: 'center',
            }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>{b.icon}</div>
            {b.name}
            {b.disabled && <div style={{ fontSize: 8, color: '#64748b' }}>Coming Soon</div>}
          </button>
        ))}
      </div>

      {/* Connection Status */}
      <div style={{
        padding: '8px 12px', borderRadius: 8, marginBottom: 10,
        background: `rgba(${brokerStatus === 'connected' ? '16,185,129' : '255,255,255'},0.05)`,
        border: `1px solid ${statusColor}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, boxShadow: brokerStatus === 'connected' ? `0 0 8px ${statusColor}` : 'none' }} />
          <span style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
        </span>
        {feedConnected && <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 600 }}>📡 Feed Live</span>}
      </div>

      {/* Dhan Login Form */}
      {selectedBroker === 'dhan' && brokerStatus !== 'connected' && (
        <>
          <SectionHeader title="Dhan API Login" icon="🟢" />

          {/* Mode Toggle */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {['totp', 'manual'].map(mode => (
              <button key={mode} onClick={() => setCreds(p => ({ ...p, loginMode: mode }))}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${(creds.loginMode || 'totp') === mode ? '#06b6d4' : 'var(--border)'}`,
                  background: (creds.loginMode || 'totp') === mode ? 'rgba(6,182,212,0.12)' : 'transparent',
                  color: (creds.loginMode || 'totp') === mode ? '#06b6d4' : 'var(--text-muted)',
                }}>
                {mode === 'totp' ? '🔄 Auto (TOTP)' : '🔑 Manual Token'}
              </button>
            ))}
          </div>

          <SettingRow label="Client ID" hint="From Dhan API Console">
            <input className="filter-select" value={creds.clientId} onChange={e => setCreds(p => ({ ...p, clientId: e.target.value }))} placeholder="1100XXXXXX" style={{ width: 160 }} />
          </SettingRow>

          {(creds.loginMode || 'totp') === 'totp' ? (
            <>
              <SettingRow label="PIN" hint="Your 6-digit Dhan login PIN">
                <input className="filter-select" type="password" value={creds.pin || ''} onChange={e => setCreds(p => ({ ...p, pin: e.target.value }))} placeholder="••••••" style={{ width: 100 }} maxLength={6} />
              </SettingRow>
              <div style={{ fontSize: 9, color: '#10b981', padding: '4px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', marginBottom: 8 }}>
                ✅ TOTP secret is configured in .env — token will auto-generate. No daily manual work needed.
              </div>
            </>
          ) : (
            <SettingRow label="Access Token" hint="JWT from Dhan API Console (24h)">
              <input className="filter-select" type="password" value={creds.accessToken} onChange={e => setCreds(p => ({ ...p, accessToken: e.target.value }))} placeholder="eyJ..." style={{ width: 200 }} />
            </SettingRow>
          )}

          <button className="btn-buy" onClick={handleLogin}
            disabled={loading || !creds.clientId || ((creds.loginMode || 'totp') === 'manual' && !creds.accessToken) || ((creds.loginMode || 'totp') === 'totp' && !creds.pin)}
            style={{ width: '100%', height: 34, fontSize: 12, marginTop: 8 }}>
            {loading ? '⏳ Connecting to Dhan...' : (creds.loginMode || 'totp') === 'totp' ? '🔄 Auto-Login via TOTP' : '🔐 Login with Token'}
          </button>
        </>
      )}

      {/* Connected — Show Funds & Actions */}
      {brokerStatus === 'connected' && (
        <>
          <SectionHeader title={`${activeBroker?.toUpperCase()} Account`} icon="💰" />
          {brokerProfile?.funds && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
              {[
                ['Available', brokerProfile.funds.availableBalance],
                ['Used Margin', brokerProfile.funds.usedMargin],
                ['Total', brokerProfile.funds.totalBalance],
                ['Realized P&L', brokerProfile.funds.realizedPnl],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>₹{(val || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
          <button className="sector-pill" onClick={logoutBroker} style={{ fontSize: 10, color: '#ef4444', width: '100%', marginTop: 4 }}>
            🔌 Disconnect {activeBroker?.toUpperCase()}
          </button>
        </>
      )}

      {/* XTS / GETS */}
      {(selectedBroker === 'xts' || selectedBroker === 'gets') && brokerStatus !== 'connected' && (
        <>
          <SectionHeader title={`${selectedBroker.toUpperCase()} Configuration`} icon="🔑" />
          <SettingRow label="API Key"><input className="filter-select" type="password" value={creds.apiKey} onChange={e => setCreds(p => ({ ...p, apiKey: e.target.value }))} placeholder="Enter API Key" style={{ width: 200 }} /></SettingRow>
          <SettingRow label="Secret Key"><input className="filter-select" type="password" value={creds.secretKey} onChange={e => setCreds(p => ({ ...p, secretKey: e.target.value }))} placeholder="Enter Secret" style={{ width: 200 }} /></SettingRow>
          <button className="btn-buy" onClick={handleLogin} disabled={loading} style={{ width: '100%', height: 34, fontSize: 12, marginTop: 8 }}>
            {loading ? '⏳ Connecting...' : `🔐 Login to ${selectedBroker.toUpperCase()}`}
          </button>
        </>
      )}

      {/* Paper Trading */}
      {selectedBroker === 'paper' && (
        <>
          <SectionHeader title="Paper Trading Settings" icon="📄" />
          <SettingRow label="Starting Capital (₹)"><NumberInput value={s.paperCapital || 1000000} onChange={v => update('paperCapital', v)} width={120} /></SettingRow>
          <SettingRow label="Brokerage Model"><SelectInput value={s.paperBrokerage || 'flat'} options={['flat', 'per_lot', 'percentage']} onChange={v => update('paperBrokerage', v)} width={100} /></SettingRow>
          <SettingRow label="Flat Brokerage (₹)"><NumberInput value={s.paperFlat || 20} onChange={v => update('paperFlat', v)} /></SettingRow>
        </>
      )}

      {/* Vega AlgoEngines */}
      {selectedBroker === 'vega' && (
        <>
          <SectionHeader title="AlgoEngines Vega (Port 3007)" icon="⚙️" />
          <SettingRow label="Server URL"><input className="filter-select" value="localhost:3007" readOnly style={{ width: 160 }} /></SettingRow>
          <SettingRow label="Shield Token" hint="Auto via handshake"><span className="kbd">Auto</span></SettingRow>
        </>
      )}

      {/* Simulated Feeds */}
      <SectionHeader title="Simulated Market Feeds" icon="📡" />
      <div style={{
        padding: 10, borderRadius: 8, marginBottom: 8,
        background: simulatedFeeds.enabled ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.06))' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${simulatedFeeds.enabled ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: simulatedFeeds.enabled ? '#10b981' : 'var(--text-muted)' }}>
            {simulatedFeeds.enabled ? '● Simulated Feed Active' : '○ Off'}
          </span>
          <button onClick={toggleSimulatedFeeds} style={{
            padding: '4px 14px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer',
            border: `1px solid ${simulatedFeeds.enabled ? '#ef4444' : '#10b981'}`,
            background: simulatedFeeds.enabled ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
            color: simulatedFeeds.enabled ? '#ef4444' : '#10b981',
          }}>{simulatedFeeds.enabled ? '■ Stop' : '▶ Start'}</button>
        </div>
      </div>
    </>
  );
}

export default function SettingsPanel({ onClose, inline }) {
  const [tab, setTab] = useState('General');
  const [showConfigurator, setShowConfigurator] = useState(false);
  const simulatedFeeds = useMarketStore(s => s.simulatedFeeds);
  const setSimulatedFeeds = useMarketStore(s => s.setSimulatedFeeds);
  const toggleSimulatedFeeds = useMarketStore(s => s.toggleSimulatedFeeds);
  const [s, setS] = useState({
    // General
    theme: 'dark', fontSize: '11', rowHeight: 'normal', autoRefresh: 2, fullscreenStart: false,
    rememberView: true, doubleClick: 'optionChain', language: 'en',
    // MarketWatch
    defaultSector: 'All', defaultSort: 'symbol', sortDir: 'asc', flashAnimation: true,
    smaBorder: true, ivPulse: true, columnPreset: 'standard',
    // MW Columns
    colSymbol: true, colLTP: true, colChange: true, colChangePct: true, colHigh: true, colLow: true,
    colVolume: true, colOI: true, col7DHL: true, colSMA30: true, colSMA100: true, colSMA200: true,
    colIV: true, colIV5D: true, colCEDelta: true, colPEDelta: true, colSynF: true,
    // OMS
    defaultOrderType: 'LIMIT', defaultProduct: 'MIS', defaultValidity: 'DAY',
    autoConfirm: true, soundOnFill: true, soundOnReject: true, soundOnCancel: false,
    autoConfirmTimer: 3, freezeCheck: true, defaultQtyMultiplier: 1,
    quickSizes: '1,2,5,10', closedOrders: false,
    // RMS
    maxOrderValue: 500000, maxPositionValue: 2000000, maxDayLoss: 25000,
    maxProfitTarget: 0, autoSquareOff: '15:15', killSwitch: 50000,
    maxLots: 20, maxOrdersPerMin: 10, marginBuffer: 10, lockAfterLimit: true, unlockPIN: '1234',
    // Brackets
    bracketTarget: 8, bracketSL: 4, trailingSL: true, trailStep: 2,
    breakevenSL: false, breakevenTrigger: 5, partialExit: 50, partialExitAt: 4,
    timeExit: '15:15', reEntryAfterSL: false, reEntryDelay: 30,
    // QuickFire
    qfProduct: 'MIS', qfExecMode: 'confirm', qfDefaultSymbols: 'NIFTY,BANKNIFTY',
    // AI
    aiInsights: true, haAlerts: true, haTimeframe: '5m',
    positionMonitor: true, m2mAnalyzer: true, m2mThreshold1: 5000, m2mThreshold2: 15000,
    newsAnalyzer: false, voiceAlerts: false, voiceVolume: 80,
    marketScanner: true, volMonitor: false, orderValidator: true, patternRecog: false,
    smartStrikePicker: 'delta',
    // Connections
    autoReconnect: true, reconnectInterval: 5, heartbeatInterval: 5, staleThreshold: 5,
    // Alerts
    desktopNotifs: true, soundEnabled: true, voiceEnabled: false, alertThrottle: 5,
  });

  const update = (key, val) => setS(p => ({ ...p, [key]: val }));

  const SHORTCUTS = [
    ['F1 / +', 'Buy Order Window', 'ODIN F1'], ['F2 / -', 'Sell Order Window', 'ODIN F2'],
    ['F3', 'Order Book', 'ODIN F3'], ['F4', 'Focus Market Watch', 'ODIN F4'],
    ['F5', 'Refresh All Data', 'ODIN F5'], ['F6', 'Market Depth (Best 5)', 'ODIN F6'],
    ['F7', 'Net Position', 'Custom'], ['F8', 'Trade Book', 'ODIN F8'],
    ['F9', 'Market Snapshot', 'Custom'], ['F11', 'Fast Order / Fullscreen', 'ODIN F11'],
    ['F12', 'Settings Panel', 'Custom'],
    ['Alt+F6', 'P&L View', 'ODIN Alt+F6'],
    ['Shift+F1', 'Cancel Selected Order', 'ODIN Shift+F1'],
    ['Shift+F2', 'Modify Selected Order', 'ODIN Shift+F2'],
    ['Shift+F3', 'Cancel ALL Pending', 'ODIN Shift+F3'],
    ['Shift+F6', 'Net Position Alt', 'ODIN Shift+F6'],
    ['Shift+F7', 'Security Info', 'ODIN Shift+F7'],
    ['Enter', 'Open Option Chain', 'Custom'], ['Insert', 'Add Scrip', 'ODIN Insert'],
    ['Delete', 'Remove Row', 'ODIN Delete'], ['Space', 'Insert Separator', 'Custom'],
    ['C', 'Chart Popup', 'Custom'], ['T', 'Technical Indicators', 'Custom'],
    ['D', 'Toggle Theme', 'Custom'], ['Ctrl+F', 'Search', 'Custom'],
    ['Ctrl+1–9', 'Quick Fire Macro #1–9', 'Custom'],
    ['Ctrl+Shift+S', 'Quick Short Straddle', 'Custom'],
    ['Ctrl+Shift+L', 'Quick Long Straddle', 'Custom'],
    ['Ctrl+Shift+X', 'Exit All Positions', 'Custom'],
    ['Ctrl+Shift+H', 'Hedge All', 'Custom'],
    ['Ctrl+Space', 'Quick Search Dialog', 'Custom'],
    ['↑/↓', 'Navigate Rows', 'ODIN'], ['Escape', 'Close Popup', 'ODIN'],
  ];

  const MW_COLUMNS = [
    ['Symbol', 'colSymbol'], ['LTP', 'colLTP'], ['Change', 'colChange'], ['Change%', 'colChangePct'],
    ['High', 'colHigh'], ['Low', 'colLow'], ['Volume', 'colVolume'], ['OI', 'colOI'],
    ['7D H/L', 'col7DHL'], ['30 SMA', 'colSMA30'], ['100 SMA', 'colSMA100'], ['200 SMA', 'colSMA200'],
    ['IV', 'colIV'], ['IV 5D', 'colIV5D'], ['CE .1Δ', 'colCEDelta'], ['PE .1Δ', 'colPEDelta'], ['Syn.F', 'colSynF'],
  ];

  const tabStyle = (t) => ({
    padding: '8px 12px', border: 'none', background: tab === t ? 'var(--border)' : 'transparent',
    color: tab === t ? 'var(--text-heading)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 12
  });

  const PanelConfigurator = lazy(() => import('./PanelConfigurator'));

  return (
    <div className={inline ? '' : 'modal-overlay'} onClick={inline ? undefined : onClose}>
      <div className={inline ? '' : 'modal-content'} onClick={e => e.stopPropagation()} style={inline ? {} : { width: 740, maxHeight: '88vh' }}>
        {!inline && (
          <div className="modal-header">
            <div className="modal-title">⚙️ Settings — ODIN+ Configuration</div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        )}
        <div className="settings-tabs" style={{ overflowX: 'auto', display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', padding: '0 8px' }}>
          {TABS.map(t => (
            <button key={t} className={`settings-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)} style={{ whiteSpace: 'nowrap', ...tabStyle(t) }}>
              {ICONS[t]} {t === 'MarketWatch' ? 'Mkt Watch' : t === 'QuickFire' ? 'QF Macros' : t}
            </button>
          ))}
        </div>
        <div className="settings-body">

          {/* ====== GENERAL ====== */}
          {tab === 'General' && (
            <>
              <SettingRow label="Theme" hint="Dark recommended for trading hours">
                <SelectInput value={s.theme} options={['dark', 'light', 'auto']} onChange={v => update('theme', v)} />
              </SettingRow>
              <SettingRow label="Font Size (px)">
                <SelectInput value={s.fontSize} options={['10', '11', '12', '13']} onChange={v => update('fontSize', v)} width={70} />
              </SettingRow>
              <SettingRow label="Row Height">
                <SelectInput value={s.rowHeight} options={['compact', 'normal', 'comfortable']} onChange={v => update('rowHeight', v)} />
              </SettingRow>
              <SettingRow label="Auto-refresh Interval">
                <SelectInput value={`${s.autoRefresh}`} options={['1', '2', '3', '5']} onChange={v => update('autoRefresh', +v)} width={60} /> sec
              </SettingRow>
              <SettingRow label="Fullscreen on Start"><Toggle value={s.fullscreenStart} onChange={v => update('fullscreenStart', v)} /></SettingRow>
              <SettingRow label="Remember Last View/Panel"><Toggle value={s.rememberView} onChange={v => update('rememberView', v)} /></SettingRow>
              <SettingRow label="Double-click Action">
                <SelectInput value={s.doubleClick} options={['optionChain', 'buy', 'chart', 'technical']} onChange={v => update('doubleClick', v)} />
              </SettingRow>
              <SettingRow label="Language">
                <SelectInput value={s.language} options={['en']} onChange={v => update('language', v)} width={80} />
              </SettingRow>
            </>
          )}

          {/* ====== KEYBOARD ====== */}
          {tab === 'Keyboard' && (
            <>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 8 }}>All shortcuts are configurable. ODIN-compatible by default. Click any key to remap.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0', fontSize: 10 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-muted)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>Action</div>
                <div style={{ fontWeight: 600, color: 'var(--text-muted)', padding: '4px 8px', borderBottom: '1px solid var(--border)' }}>Shortcut</div>
                <div style={{ fontWeight: 600, color: 'var(--text-muted)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>Source</div>
                {SHORTCUTS.map(([key, action, src]) => (
                  <div key={key} style={{ display: 'contents' }}>
                    <div style={{ padding: '5px 0', borderBottom: '1px solid var(--border)' }}>{action}</div>
                    <div style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)' }}><span className="kbd" style={{ cursor: 'pointer' }}>{key}</span></div>
                    <div style={{ padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 8, color: src.startsWith('ODIN') ? '#f59e0b' : '#06b6d4' }}>{src}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button className="sector-pill" style={{ fontSize: 9 }}>📥 Export as JSON</button>
                <button className="sector-pill" style={{ fontSize: 9 }}>📤 Import JSON</button>
                <button className="sector-pill" style={{ fontSize: 9, color: '#f59e0b' }}>🔄 Reset to ODIN Defaults</button>
              </div>
            </>
          )}

          {/* ====== MARKET WATCH ====== */}
          {tab === 'Mkt Watch' && (
            <>
              <SectionHeader title="Display Settings" icon="📊" />
              <SettingRow label="Default Sector Filter">
                <SelectInput value={s.defaultSector} options={['All', 'INDICES', 'BANK', 'IT', 'PHARMA', 'AUTO', 'METAL', 'ENERGY', 'FMCG', 'FINANCE']} onChange={v => update('defaultSector', v)} />
              </SettingRow>
              <SettingRow label="Default Sort Column">
                <SelectInput value={s.defaultSort} options={['symbol', 'ltp', 'changePct', 'volume', 'oi', 'iv']} onChange={v => update('defaultSort', v)} />
              </SettingRow>
              <SettingRow label="Sort Direction">
                <SelectInput value={s.sortDir} options={['asc', 'desc']} onChange={v => update('sortDir', v)} width={70} />
              </SettingRow>
              <SettingRow label="Column Width Preset">
                <SelectInput value={s.columnPreset} options={['compact', 'standard', 'wide']} onChange={v => update('columnPreset', v)} />
              </SettingRow>
              <SettingRow label="Flash Animation on Price Change"><Toggle value={s.flashAnimation} onChange={v => update('flashAnimation', v)} /></SettingRow>
              <SettingRow label="SMA Bias Border (green/red left border)"><Toggle value={s.smaBorder} onChange={v => update('smaBorder', v)} /></SettingRow>
              <SettingRow label="IV Pulse Highlight"><Toggle value={s.ivPulse} onChange={v => update('ivPulse', v)} /></SettingRow>

              <SectionHeader title="Column Visibility" icon="📋" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                {MW_COLUMNS.map(([name, key]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, cursor: 'pointer', padding: '3px 0' }}>
                    <input type="checkbox" checked={s[key]} onChange={e => update(key, e.target.checked)} />
                    {name}
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button className="sector-pill" style={{ fontSize: 9 }}>💾 Save Preset</button>
                <button className="sector-pill" style={{ fontSize: 9 }}>📂 Load Preset</button>
              </div>
            </>
          )}

          {/* ====== OMS ====== */}
          {tab === 'OMS' && (
            <>
              <SectionHeader title="Order Defaults" icon="📝" />
              <SettingRow label="Default Order Type">
                <SelectInput value={s.defaultOrderType} options={['LIMIT', 'MARKET', 'SL', 'SL-M']} onChange={v => update('defaultOrderType', v)} />
              </SettingRow>
              <SettingRow label="Default Product">
                <SelectInput value={s.defaultProduct} options={['MIS', 'NRML', 'CNC']} onChange={v => update('defaultProduct', v)} />
              </SettingRow>
              <SettingRow label="Default Validity">
                <SelectInput value={s.defaultValidity} options={['DAY', 'IOC']} onChange={v => update('defaultValidity', v)} width={70} />
              </SettingRow>
              <SettingRow label="Confirm Before Order" hint="Show confirmation dialog"><Toggle value={s.autoConfirm} onChange={v => update('autoConfirm', v)} /></SettingRow>
              <SettingRow label="Auto-confirm Timer (sec)" hint="0 = manual confirm only">
                <SelectInput value={`${s.autoConfirmTimer}`} options={['0', '2', '3', '5']} onChange={v => update('autoConfirmTimer', +v)} width={60} />
              </SettingRow>

              <SectionHeader title="Sounds" icon="🔊" />
              <SettingRow label="Sound on Fill"><Toggle value={s.soundOnFill} onChange={v => update('soundOnFill', v)} /></SettingRow>
              <SettingRow label="Sound on Reject"><Toggle value={s.soundOnReject} onChange={v => update('soundOnReject', v)} /></SettingRow>
              <SettingRow label="Sound on Cancel"><Toggle value={s.soundOnCancel} onChange={v => update('soundOnCancel', v)} /></SettingRow>

              <SectionHeader title="Quantity" icon="📦" />
              <SettingRow label="Default Lot Multiplier"><NumberInput value={s.defaultQtyMultiplier} onChange={v => update('defaultQtyMultiplier', v)} min={1} /></SettingRow>
              <SettingRow label="Quick Order Sizes (lots)" hint="Comma separated">
                <input className="filter-select" value={s.quickSizes} onChange={e => update('quickSizes', e.target.value)} style={{ width: 110 }} />
              </SettingRow>
              <SettingRow label="Freeze Qty Check" hint="Warn if qty > exchange freeze"><Toggle value={s.freezeCheck} onChange={v => update('freezeCheck', v)} /></SettingRow>
              <SettingRow label="Allow Orders When Market Closed"><Toggle value={s.closedOrders} onChange={v => update('closedOrders', v)} /></SettingRow>
            </>
          )}

          {/* ====== RMS ====== */}
          {tab === 'RMS' && (
            <>
              <SectionHeader title="Position Limits" icon="🛡️" />
              <SettingRow label="Max Single Order Value (₹)"><NumberInput value={s.maxOrderValue} onChange={v => update('maxOrderValue', v)} width={110} /></SettingRow>
              <SettingRow label="Max Position Value (₹)"><NumberInput value={s.maxPositionValue} onChange={v => update('maxPositionValue', v)} width={110} /></SettingRow>
              <SettingRow label="Max Lots per Order"><NumberInput value={s.maxLots} onChange={v => update('maxLots', v)} /></SettingRow>
              <SettingRow label="Max Orders per Minute"><NumberInput value={s.maxOrdersPerMin} onChange={v => update('maxOrdersPerMin', v)} /></SettingRow>
              <SettingRow label="Margin Buffer %"><NumberInput value={s.marginBuffer} onChange={v => update('marginBuffer', v)} /> %</SettingRow>

              <SectionHeader title="P&L Limits" icon="💰" />
              <SettingRow label="Max Day Loss / M2M (₹)" hint="Auto-disable trading if breached"><NumberInput value={s.maxDayLoss} onChange={v => update('maxDayLoss', v)} width={110} /></SettingRow>
              <SettingRow label="Max Profit Target (₹)" hint="Optional auto-lock at profit"><NumberInput value={s.maxProfitTarget} onChange={v => update('maxProfitTarget', v)} width={110} /></SettingRow>
              <SettingRow label="Auto Square-off Time"><input className="filter-select" type="time" value={s.autoSquareOff} onChange={e => update('autoSquareOff', e.target.value)} style={{ width: 90 }} /></SettingRow>

              <SectionHeader title="Emergency Controls" icon="🚨" />
              <SettingRow label="Kill Switch Threshold (₹)" hint="Emergency kill at this loss"><NumberInput value={s.killSwitch} onChange={v => update('killSwitch', v)} width={110} /></SettingRow>
              <SettingRow label="Lock Trading After Limits Hit"><Toggle value={s.lockAfterLimit} onChange={v => update('lockAfterLimit', v)} /></SettingRow>
              <SettingRow label="Unlock PIN" hint="Required to re-enable trading">
                <input className="filter-select" type="password" value={s.unlockPIN} onChange={e => update('unlockPIN', e.target.value)} style={{ width: 70 }} />
              </SettingRow>
              <div style={{ marginTop: 12 }}>
                <button style={{
                  width: '100%', padding: '12px', border: '2px solid #ef4444', borderRadius: 8,
                  background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  letterSpacing: 2, animation: 'pulse 2s infinite',
                }}>🚨 EMERGENCY KILL SWITCH — SQUARE OFF ALL 🚨</button>
              </div>
            </>
          )}

          {/* ====== BRACKETS ====== */}
          {tab === 'Brackets' && (
            <>
              <SectionHeader title="Default Bracket Settings" icon="📌" />
              <SettingRow label="Default Target (pts)"><NumberInput value={s.bracketTarget} onChange={v => update('bracketTarget', v)} /></SettingRow>
              <SettingRow label="Default Stop Loss (pts)"><NumberInput value={s.bracketSL} onChange={v => update('bracketSL', v)} /></SettingRow>

              <SectionHeader title="Trailing Stop Loss" icon="📈" />
              <SettingRow label="Enable Trailing SL"><Toggle value={s.trailingSL} onChange={v => update('trailingSL', v)} /></SettingRow>
              <SettingRow label="Trail Step (pts)" hint="SL moves by this step"><NumberInput value={s.trailStep} onChange={v => update('trailStep', v)} /></SettingRow>

              <SectionHeader title="Breakeven SL" icon="🎯" />
              <SettingRow label="Enable Breakeven"><Toggle value={s.breakevenSL} onChange={v => update('breakevenSL', v)} /></SettingRow>
              <SettingRow label="Breakeven Trigger (pts)" hint="Move SL to entry after this profit"><NumberInput value={s.breakevenTrigger} onChange={v => update('breakevenTrigger', v)} /></SettingRow>

              <SectionHeader title="Partial Exit" icon="✂️" />
              <SettingRow label="Partial Exit %">
                <SelectInput value={`${s.partialExit}`} options={['0', '25', '50', '75']} onChange={v => update('partialExit', +v)} width={60} /> %
              </SettingRow>
              <SettingRow label="Partial Exit At (pts)" hint="Exit partial at this profit"><NumberInput value={s.partialExitAt} onChange={v => update('partialExitAt', v)} /></SettingRow>

              <SectionHeader title="Time Exit" icon="⏰" />
              <SettingRow label="Auto Exit Time"><input className="filter-select" type="time" value={s.timeExit} onChange={e => update('timeExit', e.target.value)} style={{ width: 90 }} /></SettingRow>

              <SectionHeader title="Re-entry" icon="🔄" />
              <SettingRow label="Re-entry After SL" hint="Retry position after SL hit"><Toggle value={s.reEntryAfterSL} onChange={v => update('reEntryAfterSL', v)} /></SettingRow>
              <SettingRow label="Re-entry Delay (sec)"><NumberInput value={s.reEntryDelay} onChange={v => update('reEntryDelay', v)} /></SettingRow>
            </>
          )}

          {/* ====== QUICK FIRE ====== */}
          {tab === 'QF Macros' && (
            <>
              <SectionHeader title="QFM Configuration" icon="⚡" />
              <SettingRow label="Default Product">
                <SelectInput value={s.qfProduct} options={['MIS', 'NRML']} onChange={v => update('qfProduct', v)} width={80} />
              </SettingRow>
              <SettingRow label="Execution Mode" hint="Instant = no dialog">
                <SelectInput value={s.qfExecMode} options={['instant', 'confirm', 'preview']} onChange={v => update('qfExecMode', v)} />
              </SettingRow>
              <SettingRow label="Group Mode Default Symbols" hint="Comma-separated">
                <input className="filter-select" value={s.qfDefaultSymbols} onChange={e => update('qfDefaultSymbols', e.target.value)} style={{ width: 160 }} />
              </SettingRow>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button className="sector-pill" style={{ fontSize: 9 }}>📥 Export Macros</button>
                <button className="sector-pill" style={{ fontSize: 9 }}>📤 Import Macros</button>
              </div>

              <SectionHeader title="Available Macros (15)" icon="🎯" />
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>Manage macros from the QF Macros sidebar panel. Use Ctrl+1–9 to trigger.</div>
              {[
                ['Ctrl+1', 'ATM Straddle Short', 'Straddle'], ['Ctrl+2', 'ATM Straddle Long', 'Straddle'],
                ['Ctrl+3', '0.2Δ Strangle Short', 'Strangle'], ['—', '0.3Δ Strangle Short', 'Strangle'],
                ['Ctrl+4', 'Group 0.2Δ Strangle', 'Group'], ['Ctrl+5', 'Iron Condor', 'Multi-Leg'],
                ['Ctrl+6', 'Iron Butterfly', 'Multi-Leg'], ['Ctrl+7', 'Bull Call Spread', 'Spread'],
                ['Ctrl+8', 'Bear Put Spread', 'Spread'], ['—', 'Jade Lizard', 'Multi-Leg'],
                ['—', 'Ratio Spread 1:2', 'Advanced'], ['—', 'Calendar Spread', 'Advanced'],
                ['Ctrl+9', '0-DTE Scalp', 'Scalp'], ['Ctrl+Shift+H', 'Hedge All', 'Risk'],
                ['Ctrl+Shift+X', 'EXIT ALL PANIC', 'Risk'],
              ].map(([key, name, cat]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: 10 }}>
                  <span>{name} <span style={{ fontSize: 8, color: '#64748b' }}>({cat})</span></span>
                  <span className="kbd" style={{ fontSize: 8 }}>{key}</span>
                </div>
              ))}
            </>
          )}

          {/* ====== AI ====== */}
          {tab === 'AI' && (
            <>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 12 }}>Toggle AI agents individually. Each runs as a monitoring worker.</div>
              <SectionHeader title="Order Intelligence" icon="🧠" />
              <SettingRow label="AI Insights at Order Time" hint="Show IV, OI, PCR, Max Pain at order"><Toggle value={s.aiInsights} onChange={v => update('aiInsights', v)} /></SettingRow>
              <SettingRow label="Smart Strike Picker Mode" hint="How to auto-select strikes">
                <SelectInput value={s.smartStrikePicker} options={['delta', 'premium', 'oi']} onChange={v => update('smartStrikePicker', v)} />
              </SettingRow>

              <SectionHeader title="Heikin Ashi AI" icon="🔮" />
              <SettingRow label="Enable HA Color Alerts" hint="AI signals from HA chart"><Toggle value={s.haAlerts} onChange={v => update('haAlerts', v)} /></SettingRow>
              <SettingRow label="HA Timeframe">
                <SelectInput value={s.haTimeframe} options={['1m', '3m', '5m', '15m']} onChange={v => update('haTimeframe', v)} width={70} />
              </SettingRow>

              <SectionHeader title="Agents" icon="🤖" />
              <SettingRow label="🎯 Position Monitor" hint="Track net delta, gamma, theta"><Toggle value={s.positionMonitor} onChange={v => update('positionMonitor', v)} /></SettingRow>
              <SettingRow label="💰 M2M Analyzer" hint="P&L alerts at thresholds"><Toggle value={s.m2mAnalyzer} onChange={v => update('m2mAnalyzer', v)} /></SettingRow>
              {s.m2mAnalyzer && (
                <div style={{ display: 'flex', gap: 8, paddingLeft: 20, marginBottom: 4 }}>
                  <SettingRow label="Warn at ₹"><NumberInput value={s.m2mThreshold1} onChange={v => update('m2mThreshold1', v)} width={80} /></SettingRow>
                  <SettingRow label="Critical at ₹"><NumberInput value={s.m2mThreshold2} onChange={v => update('m2mThreshold2', v)} width={80} /></SettingRow>
                </div>
              )}
              <SettingRow label="📰 News Analyzer" hint="RSS/API news with sentiment"><Toggle value={s.newsAnalyzer} onChange={v => update('newsAnalyzer', v)} /></SettingRow>
              <SettingRow label="📊 Market Scanner" hint="Full universe scanner"><Toggle value={s.marketScanner} onChange={v => update('marketScanner', v)} /></SettingRow>
              <SettingRow label="📈 Volatility Monitor" hint="IV crush, VIX spike detection"><Toggle value={s.volMonitor} onChange={v => update('volMonitor', v)} /></SettingRow>
              <SettingRow label="✅ Order Validator" hint="Pre-trade checks"><Toggle value={s.orderValidator} onChange={v => update('orderValidator', v)} /></SettingRow>
              <SettingRow label="🔍 Pattern Recognition" hint="Candle pattern detection"><Toggle value={s.patternRecog} onChange={v => update('patternRecog', v)} /></SettingRow>
            </>
          )}

          {/* ====== CONNECTOR ====== */}
          {tab === 'Connector' && (
            <ConnectorTab s={s} update={update} simulatedFeeds={simulatedFeeds} toggleSimulatedFeeds={toggleSimulatedFeeds} setSimulatedFeeds={setSimulatedFeeds} />
          )}

          {/* ====== CONNECTIONS (OLD — kept for backward compat, redirects to Connector) ====== */}
          {tab === 'Connections' && (
            <>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 12 }}>Engine connections to AlgoEngines infrastructure.</div>
              {[
                { name: 'Shield', port: 3000, role: 'Auth/JWT', status: 'connected' },
                { name: 'Surya', port: 3001, role: 'Universe/BOD', status: 'connected' },
                { name: 'Ganesh', port: 3002, role: 'OHLC/History', status: 'connected' },
                { name: 'Lakshmi', port: 3003, role: 'Live LTP', status: 'connected' },
                { name: 'Garuda', port: 3011, role: 'Option Chain/IV', status: 'degraded' },
                { name: 'Vega', port: 3007, role: 'Order Execution', status: 'connected' },
                { name: 'Kavach', port: 3010, role: 'Risk/Kill Switch', status: 'connected' },
                { name: 'TalkOptions', port: 'local', role: 'IV/Greeks', status: 'connected' },
              ].map(e => (
                <div key={e.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`engine-dot ${e.status}`} />
                    <div><div style={{ fontSize: 12, fontWeight: 600 }}>{e.name}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{e.role} • Port {e.port}</div></div>
                  </div>
                  <span style={{ fontSize: 10, color: e.status === 'connected' ? 'var(--green)' : 'var(--yellow)', fontWeight: 600 }}>{e.status.toUpperCase()}</span>
                </div>
              ))}

              <SectionHeader title="Connection Settings" icon="🔧" />
              <SettingRow label="Auto-reconnect"><Toggle value={s.autoReconnect} onChange={v => update('autoReconnect', v)} /></SettingRow>
              <SettingRow label="Reconnect Interval (sec)"><NumberInput value={s.reconnectInterval} onChange={v => update('reconnectInterval', v)} /></SettingRow>
              <SettingRow label="Heartbeat Interval (sec)">
                <SelectInput value={`${s.heartbeatInterval}`} options={['3', '5', '10']} onChange={v => update('heartbeatInterval', +v)} width={60} />
              </SettingRow>

              <SectionHeader title="Feed Priority" icon="📡" />
              <SettingRow label="Primary Feed"><span className="kbd">Lakshmi WS</span></SettingRow>
              <SettingRow label="Failover 1"><span className="kbd">Ganesh REST</span></SettingRow>
              <SettingRow label="Failover 2"><span className="kbd">Broker Direct</span></SettingRow>
              <SettingRow label="Stale Threshold"><NumberInput value={s.staleThreshold} onChange={v => update('staleThreshold', v)} /> sec</SettingRow>
            </>
          )}

          {/* ====== ALERTS ====== */}
          {tab === 'Alerts' && (
            <>
              <SectionHeader title="Notification Channels" icon="📢" />
              <SettingRow label="Desktop Notifications"><Toggle value={s.desktopNotifs} onChange={v => update('desktopNotifs', v)} /></SettingRow>
              <SettingRow label="Sound Alerts"><Toggle value={s.soundEnabled} onChange={v => update('soundEnabled', v)} /></SettingRow>
              <SettingRow label="Voice Alerts" hint="Text-to-speech"><Toggle value={s.voiceEnabled} onChange={v => update('voiceEnabled', v)} /></SettingRow>
              {s.voiceEnabled && (
                <SettingRow label="Voice Volume">
                  <input type="range" min={0} max={100} value={s.voiceVolume} onChange={e => update('voiceVolume', +e.target.value)} style={{ width: 120 }} />
                  <span style={{ fontSize: 10, marginLeft: 6 }}>{s.voiceVolume}%</span>
                </SettingRow>
              )}
              <SettingRow label="Alert Throttle (max/min)" hint="Prevent alert flood"><NumberInput value={s.alertThrottle} onChange={v => update('alertThrottle', v)} /></SettingRow>

              <SectionHeader title="Alert Types" icon="🔔" />
              {[
                ['Order Filled', 'alertFill', true], ['Order Rejected', 'alertReject', true], ['SL Triggered', 'alertSL', true], ['Target Hit', 'alertTarget', true],
                ['M2M Breach', 'alertM2M', true], ['Near Today High/Low', 'alertHL', false], ['Broadcast Down', 'alertBroadcast', true],
                ['Net Delta Alert', 'alertDelta', false], ['IV Spike', 'alertIV', false], ['OI Breakout', 'alertOI', false],
                ['HA Color Change', 'alertHA', true], ['Pattern Detected', 'alertPattern', false],
              ].map(([name, key, def]) => (
                <SettingRow key={name} label={name}><Toggle value={s[key] ?? def} onChange={v => update(key, v)} /></SettingRow>
              ))}
            </>
          )}

          {/* ====== LAYOUT ====== */}
          {tab === 'Layout' && (
            <>
              <SectionHeader title="Panel & View Configuration" icon="🎛️" />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                Customize which panels appear in the right sidebar, which views appear in the left nav, and set default panel per view.
              </div>
              <button className="btn-buy" style={{ fontSize: 11, padding: '8px 20px', height: 34, width: '100%' }}
                onClick={() => setShowConfigurator(true)}
              >
                🎛️ Open Panel & View Configurator
              </button>
              <div style={{ marginTop: 16, fontSize: 10, color: 'var(--text-muted)' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Quick Info:</div>
                <div>• Right panels: enable/disable + reorder using ▲▼ arrows</div>
                <div>• Left views: enable/disable + set default panel per view</div>
                <div>• Presets: "Options Trader", "Scalper Pro", "Minimal", etc.</div>
                <div>• Settings persist across sessions (localStorage)</div>
              </div>
            </>
          )}
        </div>
        {!inline && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Settings auto-saved to localStorage</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="sector-pill" onClick={onClose}>Cancel</button>
              <button className="btn-buy" style={{ padding: '0 20px', height: 30, fontSize: 12 }} onClick={onClose}>Save Settings</button>
            </div>
          </div>
        )}
      </div>
      {showConfigurator && <Suspense fallback={<div style={{padding:20,color:'var(--text-muted)'}}>Loading...</div>}><PanelConfigurator onClose={() => setShowConfigurator(false)} /></Suspense>}
    </div>
  );
}
