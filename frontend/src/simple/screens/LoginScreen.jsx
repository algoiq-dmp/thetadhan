import { useState, useEffect } from 'react'
import useAppStore from '../stores/useAppStore'

const API_URL = import.meta.env.VITE_API_URL || 'https://thetadhan-api.parlight2.workers.dev';

/* ─── 60 Feature Tips — rotates 3 per day based on date ─── */
const FEATURE_TIPS = [
  { icon: '📊', title: 'Market Watch (F4)', desc: 'Real-time watchlist with 28+ columns, drag-resize, column freeze, flash animation, and 12 predefined sector portfolios.', shortcut: 'F4', category: 'Core' },
  { icon: '🟦', title: 'Buy Order (F1)', desc: 'Institutional order entry with Market/Limit/SL/SL-M types, MIS/NRML/CNC products, market depth preview, and confirmation dialog.', shortcut: 'F1', category: 'Trading' },
  { icon: '🟥', title: 'Sell Order (F2)', desc: 'Red-themed sell order form with all advanced order types. Supports GTD validity and disclosed quantity.', shortcut: 'F2', category: 'Trading' },
  { icon: '📋', title: 'Order Book (F3)', desc: 'Track all orders with status filters, modify/cancel actions, expandable audit trail, and right-click context menu.', shortcut: 'F3', category: 'Core' },
  { icon: '📈', title: 'Charts (F9)', desc: 'Advanced candlestick charts with RSI, MACD sub-panels, Bollinger Bands, SMA overlays, and 5 drawing tools.', shortcut: 'F9', category: 'Analysis' },
  { icon: '📑', title: 'Option Chain (F7)', desc: 'Dual-panel call/put view with ATM highlight, Greeks columns (Δ Γ Θ ν), buildup indicators, and one-click trading.', shortcut: 'F7', category: 'F&O' },
  { icon: '🏗', title: 'Bracket Order', desc: '3-leg order system: Entry + Target + Stop Loss with visual bracket diagram and Risk:Reward ratio calculator.', shortcut: 'Menu', category: 'Advanced' },
  { icon: '🛡', title: 'Cover Order', desc: 'Entry with compulsory Stop Loss — lower margin requirement with built-in risk protection.', shortcut: 'Menu', category: 'Advanced' },
  { icon: '⇄', title: 'Spread Order (Ctrl+F3)', desc: '2-leg simultaneous execution with auto strategy detection (Bull/Bear spread) and net spread calculator.', shortcut: 'Ctrl+F3', category: 'Advanced' },
  { icon: '📦', title: 'Basket Order', desc: 'Multi-order batch processing — add multiple scrips, set individual quantities, and execute all at once with progress tracking.', shortcut: 'Menu', category: 'Advanced' },
  { icon: '🔔', title: 'Alerts Manager', desc: 'Set Price, Volume, OI, %Change, 52W alerts with sound and popup notifications. Pause/resume any alert instantly.', shortcut: 'Menu', category: 'Tools' },
  { icon: '🧮', title: 'Margin Calculator', desc: 'Calculate SPAN, Exposure, and Premium margins instantly. See leverage ratio and MIS benefit savings.', shortcut: 'Menu', category: 'Tools' },
  { icon: '📐', title: 'Pivot Calculator', desc: 'Standard, Woodie, and Camarilla pivot levels with visual dot chart. Key support/resistance levels for intraday trading.', shortcut: 'Menu', category: 'Tools' },
  { icon: '⌇', title: 'Fibonacci Calculator', desc: '9 Fibonacci retracement levels from 0% to 161.8% with key zone highlights at 38.2%, 50%, and 61.8%.', shortcut: 'Menu', category: 'Tools' },
  { icon: '🗺', title: 'Heat Map', desc: 'Visual market overview — NIFTY 50 and Bank Nifty stocks shown as weighted color-coded blocks. Hover to zoom.', shortcut: 'Shift+F12', category: 'Analysis' },
  { icon: '📸', title: 'Snap Quote (Shift+F9)', desc: '18 data fields at a glance — OHLC, Volume, ATP, OI, Circuits, 52W Range, ISIN, and lot size.', shortcut: 'Shift+F9', category: 'Info' },
  { icon: '⊞', title: 'Grid Order', desc: 'Place multiple orders at different price levels automatically — set start/end price and grid count.', shortcut: 'Menu', category: 'Advanced' },
  { icon: '🏛', title: 'PTST Order', desc: 'Pro Trade / Self Trade with SEBI compliance fields — Client Code, CTCL ID, Dealer Name, and audit trail.', shortcut: 'Menu', category: 'Compliance' },
  { icon: '📊', title: 'Bhav Copy Viewer', desc: 'End-of-day market data for NSE/BSE/MCX — filter by date, series, search symbols, see advance/decline counts.', shortcut: 'Menu', category: 'Data' },
  { icon: '⚡', title: 'Keyboard Shortcuts', desc: '42 shortcuts for instant access — F1-F12, Shift+F combos, Ctrl combos. Press Ctrl+/ to see the full list.', shortcut: 'Ctrl+/', category: 'System' },
  { icon: '💾', title: 'Workspace Save/Load', desc: 'Save your window layout as named workspaces. Auto-restores on next login. Multiple layouts supported.', shortcut: 'Ctrl+S', category: 'System' },
  { icon: '📊', title: 'Market Depth (F6)', desc: '5-level buy/sell depth with volume bars, buy/sell pressure indicator, spread display, and click-to-order.', shortcut: 'F6', category: 'Core' },
  { icon: '📋', title: 'Trade Book (F8)', desc: 'Complete trade history with CSV export — Trade No, Time, Symbol, Price, Qty, and execution details.', shortcut: 'F8', category: 'Core' },
  { icon: '💼', title: 'Net Position (Alt+F6)', desc: 'Live MTM P&L, Realized P&L, Square-off, Add More, Convert Product. Auto-square-off configurable.', shortcut: 'Alt+F6', category: 'Core' },
  { icon: '📡', title: 'Broadcast Settings', desc: 'Configure IBT, Lease Line, or API market data feeds. Per-exchange UDP ports and connection health indicators.', shortcut: 'Menu', category: 'Admin' },
  { icon: '⚙', title: 'Exchange Settings', desc: 'Configure per-exchange, per-segment order routing — default product, order type, qty limits, and circuit checks.', shortcut: 'Menu', category: 'Admin' },
  { icon: '📋', title: 'Excel Order Upload', desc: 'Bulk order upload from Excel/CSV — validate, preview, and execute hundreds of orders in one batch.', shortcut: 'Menu', category: 'Admin' },
  { icon: '📊', title: 'Position Upload', desc: 'Upload existing positions from CSV for tracking — import broker statements for unified portfolio view.', shortcut: 'Menu', category: 'Admin' },
  { icon: '🔧', title: 'Settings — 11 Tabs', desc: 'Theme, General, Trading, Display, MW, Columns, Charts, Risk, Connection, Alerts, and About. Every setting is persisted.', shortcut: 'Menu', category: 'System' },
  { icon: '📈', title: 'Portfolio Analysis (F12)', desc: 'Sector allocation, top gainers/losers, PnL breakdown, and portfolio performance at a glance.', shortcut: 'F12', category: 'Analysis' },
]

const CATEGORIES_COLORS = {
  Core: '#00bcd4', Trading: '#4dabf7', Analysis: '#22c55e', 'F&O': '#7c4dff',
  Advanced: '#eab308', Tools: '#ff6b6b', Info: '#c084fc', Compliance: '#ef4444',
  Data: '#4ade80', System: '#9aa0b0', Admin: '#f472b6'
}

export default function LoginScreen() {
  const login = useAppStore(s => s.login)
  const [clientId, setClientId] = useState(localStorage.getItem('dhan_client_id') || '')
  const [accessToken, setAccessToken] = useState('')
  const [segments, setSegments] = useState({ nse: true, bse: true, mcx: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('auto') // 'auto' (TOTP from worker) or 'manual' (paste token)

  // Daily rotation — picks 3 tips based on today's date
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0)) / 86400000)
  const tipStart = (dayOfYear * 3) % FEATURE_TIPS.length
  const dailyTips = [
    FEATURE_TIPS[tipStart % FEATURE_TIPS.length],
    FEATURE_TIPS[(tipStart + 1) % FEATURE_TIPS.length],
    FEATURE_TIPS[(tipStart + 2) % FEATURE_TIPS.length],
  ]

  // Auto-cycle through tips
  const [activeTip, setActiveTip] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setActiveTip(p => (p + 1) % 3), 6000)
    return () => clearInterval(timer)
  }, [])

  // Auto-login if session exists
  useEffect(() => {
    const t = localStorage.getItem('dhan_token');
    const c = localStorage.getItem('dhan_client_id');
    if (t && c) { login(c); }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true);
    try {
      if (mode === 'auto') {
        // Auto-connect via worker TOTP
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ broker: 'dhan' }),
        });
        const data = await res.json();
        if (data.success && data.accessToken) {
          localStorage.setItem('dhan_token', data.accessToken);
          localStorage.setItem('dhan_client_id', data.clientId);
          localStorage.setItem('dhan_client_name', data.clientName || data.clientId);
          setLoading(false); login(data.clientId);
        } else {
          setLoading(false); setError(data.error || 'Dhan auto-login failed');
        }
      } else {
        // Manual token mode
        if (!clientId || !accessToken) { setLoading(false); setError('Client ID and Access Token required'); return; }
        localStorage.setItem('dhan_token', accessToken);
        localStorage.setItem('dhan_client_id', clientId);
        localStorage.setItem('dhan_client_name', clientId);
        setLoading(false); login(clientId);
      }
    } catch (err) {
      setLoading(false); setError('Connection failed: ' + err.message);
    }
  }

  const tip = dailyTips[activeTip]
  const catColor = CATEGORIES_COLORS[tip.category] || '#7a7a8c'

  return (
    <div className="login-screen">
      <div style={{ display: 'flex', width: 820, maxHeight: '90vh', boxShadow: '0 8px 60px rgba(0,0,0,0.5)', border: '1px solid var(--border)' }}>

        {/* ─── Left: Login Form ─── */}
        <form className="login-box" onSubmit={handleLogin} style={{ width: 380, flexShrink: 0, border: 'none', boxShadow: 'none' }}>
          <div className="login-header">
            <div className="login-logo">⚡ THETA YANTRA</div>
            <div className="login-sub">SRE • DHAN TRADING TERMINAL</div>
          </div>
          <div className="login-body">
            {error && <div style={{ color: '#ff1744', fontSize: 10, marginBottom: 8, textAlign: 'center' }}>{error}</div>}
            
            {/* Mode Toggle */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              <button type="button" onClick={() => setMode('auto')} style={{ flex: 1, padding: '6px', border: mode === 'auto' ? '1px solid #00bcd4' : '1px solid #2a2a44', background: mode === 'auto' ? 'rgba(0,188,212,0.1)' : 'transparent', color: mode === 'auto' ? '#00bcd4' : '#6a6a7c', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>⚡ Auto (TOTP)</button>
              <button type="button" onClick={() => setMode('manual')} style={{ flex: 1, padding: '6px', border: mode === 'manual' ? '1px solid #00bcd4' : '1px solid #2a2a44', background: mode === 'manual' ? 'rgba(0,188,212,0.1)' : 'transparent', color: mode === 'manual' ? '#00bcd4' : '#6a6a7c', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>🔑 Manual Token</button>
            </div>

            {mode === 'manual' && (
              <>
                <div className="login-field">
                  <label>Dhan Client ID</label>
                  <input value={clientId} onChange={e => setClientId(e.target.value)} placeholder="1100xxxxxx" autoFocus />
                </div>
                <div className="login-field">
                  <label>Access Token</label>
                  <input type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="Paste Dhan access token" />
                </div>
              </>
            )}
            {mode === 'auto' && (
              <div style={{ padding: '16px 0', textAlign: 'center', color: '#6a6a7c', fontSize: 11 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔐</div>
                Auto-login via server TOTP<br/>
                <span style={{ fontSize: 9, color: '#4a4a5c' }}>Worker generates TOTP from configured secret</span>
              </div>
            )}

            <div className="login-field">
              <label>Exchange Segments</label>
              <div className="login-segments">
                <label className="login-segment">
                  <input type="checkbox" checked={segments.nse} onChange={e => setSegments({...segments, nse: e.target.checked})} />
                  NSE (FO+CM)
                </label>
                <label className="login-segment">
                  <input type="checkbox" checked={segments.bse} onChange={e => setSegments({...segments, bse: e.target.checked})} />
                  BSE
                </label>
                <label className="login-segment">
                  <input type="checkbox" checked={segments.mcx} onChange={e => setSegments({...segments, mcx: e.target.checked})} />
                  MCX
                </label>
              </div>
            </div>
            <button type="submit" className="login-btn" disabled={loading}>{loading ? '⏳ Connecting to Dhan...' : '⚡ CONNECT'}</button>
          </div>
          <div className="login-footer">SRE THETA YANTRA v2.0 • Dhan Terminal • © 2026 AlgoIQ Technologies</div>
        </form>

        {/* ─── Right: Did You Know Panel ─── */}
        <div style={{
          width: 440, background: 'linear-gradient(160deg, #0d0d1a 0%, #121230 40%, #0a0a20 100%)',
          borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Decorative glow */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${catColor}15, transparent)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,77,255,0.08), transparent)', pointerEvents: 'none' }} />

          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(42,42,68,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, filter: 'brightness(1.2)' }}>💡</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#d0d0d8', letterSpacing: 1 }}>Did You Know?</span>
              <span style={{ marginLeft: 'auto', fontSize: 8, color: '#4a4a5c', background: 'rgba(0,188,212,0.08)', padding: '2px 8px', border: '1px solid rgba(0,188,212,0.15)' }}>
                Day {dayOfYear} • Tips {tipStart+1}–{tipStart+3}
              </span>
            </div>
            <div style={{ fontSize: 9, color: '#4a4a5c', marginTop: 4 }}>
              Learn 3 features every day — {FEATURE_TIPS.length} total tips
            </div>
          </div>

          {/* Active Tip — Large Featured */}
          <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              flex: 1, padding: '20px', background: 'rgba(0,188,212,0.03)',
              border: `1px solid ${catColor}25`, position: 'relative',
              transition: 'all 0.4s ease', animation: 'tipFade 0.4s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>{tip.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#e0e0e8', lineHeight: 1.2 }}>{tip.title}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 8, padding: '1px 6px', background: `${catColor}20`, color: catColor, border: `1px solid ${catColor}30` }}>{tip.category}</span>
                    {tip.shortcut !== 'Menu' && (
                      <span style={{ fontSize: 8, padding: '1px 6px', background: 'rgba(255,255,255,0.04)', color: '#9aa0b0', border: '1px solid rgba(255,255,255,0.06)' }}>
                        ⌨ {tip.shortcut}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#9aa0b0', lineHeight: 1.6, margin: 0 }}>{tip.desc}</p>
              <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 8, color: '#3a3a5a' }}>
                Tip {tipStart + activeTip + 1} of {FEATURE_TIPS.length}
              </div>
            </div>

            {/* 3-Tip Selector Dots + Mini Cards */}
            <div style={{ display: 'flex', gap: 6 }}>
              {dailyTips.map((t, i) => (
                <button key={i} onClick={() => setActiveTip(i)} style={{
                  flex: 1, padding: '8px 10px', background: activeTip === i ? 'rgba(0,188,212,0.08)' : 'rgba(255,255,255,0.02)',
                  border: activeTip === i ? '1px solid rgba(0,188,212,0.3)' : '1px solid rgba(42,42,68,0.3)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 14 }}>{t.icon}</span>
                    <span style={{ fontSize: 9, fontWeight: activeTip === i ? 700 : 500, color: activeTip === i ? '#d0d0d8' : '#5a5a6a' }}>{t.title}</span>
                  </div>
                  <div style={{ height: 2, background: activeTip === i ? 'var(--accent)' : 'rgba(42,42,68,0.3)', transition: 'all 0.3s' }}>
                    {activeTip === i && <div style={{ height: '100%', background: 'var(--accent)', animation: 'tipProgress 6s linear' }} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(42,42,68,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{
                  width: 4, height: 12 + i * 3, background: i < 3 ? '#22c55e' : 'rgba(42,42,68,0.5)',
                  transition: 'all 0.3s'
                }} />
              ))}
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#5a5a6a' }}>LIGHT Z TERMINAL</div>
              <div style={{ fontSize: 8, color: '#3a3a5a' }}>33 Windows • 42 Shortcuts • Institutional Grade</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 8, color: '#4a4a5c' }}>Market Status</div>
              <div style={{ fontSize: 9, color: '#22c55e', fontWeight: 600 }}>● Pre-Open 09:00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
