import { useState } from 'react';

const VIEW_HELP = {
  scalper: {
    title: 'Scalper View',
    keys: ['1m','3m','5m','15m timeframes', 'Dual chart layout', 'Market depth (Best 5)', '1-tap lot buttons'],
    desc: 'High-speed scalping view with dual charts, market depth, and instant lot-based execution. Designed for sub-minute trading with live tick stats.',
    shortcuts: [
      { key: 'F1 / +', action: 'Buy Order' },
      { key: 'F2 / -', action: 'Sell Order' },
      { key: '↑ / ↓', action: 'Adjust price ±1 tick' },
      { key: 'Shift+↑↓', action: '±5 ticks' },
    ],
  },
  optionsTrader: {
    title: 'Options Trader',
    keys: ['Full option chain with Greeks', 'One-click trade from chain', 'CE/PE OI buildup', 'ATM + 0.1Δ highlighting'],
    desc: 'Complete options chain with IV, Greeks, OI data. Click any strike to instantly place orders. ATM auto-highlighted in yellow, 0.1Δ strikes in cyan.',
    shortcuts: [
      { key: 'Enter', action: 'Open chain for selected symbol' },
      { key: 'B', action: 'Quick Buy selected strike' },
      { key: 'S', action: 'Quick Sell selected strike' },
    ],
  },
  ivAnalysis: {
    title: 'IV Analysis',
    keys: ['IV Rank & Percentile', 'IV Skew curve', 'IV Surface 3D', 'Historical IV comparison'],
    desc: 'Implied Volatility intelligence. Compare current IV against historical distribution. Identify when options are cheap (low IV) or expensive (high IV).',
    shortcuts: [
      { key: 'C', action: 'Toggle chart' },
      { key: '1-4', action: 'Switch sub-tabs' },
    ],
  },
  strategyBuilder: {
    title: 'Strategy Builder',
    keys: ['Multi-leg strategy construction', 'Payoff diagram', 'Greeks visualization', 'Template strategies'],
    desc: 'Build complex multi-leg option strategies. Use templates (Straddle, Strangle, Spreads, Condor) or create custom combinations. Visual payoff diagram updates in real-time.',
    shortcuts: [
      { key: 'Ctrl+Shift+S', action: 'Quick Short Straddle' },
      { key: 'Ctrl+Shift+L', action: 'Quick Long Straddle' },
    ],
  },
  stocks: {
    title: 'Stocks View',
    keys: ['F&O stocks with sector filters', 'Live snapshot cards', 'Quick chain access'],
    desc: 'Browse all ~220 F&O stocks organized by sector. Each card shows LTP, change, volume, and provides quick access to option chain and chart.',
  },
  marketWatch: {
    title: 'Market Watch',
    keys: ['Full 220-symbol grid', 'Column sorting', 'Sector/movement filters', 'Custom watchlists'],
    desc: 'Primary trading grid. All F&O symbols with live LTP, analytics, SMA overlays, IV data, and delta-mapped strikes. Click any column header to sort.',
    shortcuts: [
      { key: 'Ctrl+F', action: 'Focus search box' },
      { key: '1-9', action: 'Switch sector filter' },
      { key: 'Space', action: 'Add to watchlist' },
    ],
  },
  custom: {
    title: 'Custom Layout',
    keys: ['Configurable widget grid', 'Drag and arrange panels', 'Save/load layouts'],
    desc: 'Design your own trading workspace. Arrange charts, chains, positions, and analytics in any configuration. Layouts persist across sessions.',
  },
  terminal: {
    title: 'Terminal',
    keys: ['Command-line interface', 'System logs', 'Engine diagnostics'],
    desc: 'Direct terminal access for power users. Execute system commands, view engine logs, and run diagnostics.',
  },
};

const PANEL_HELP = {
  watchlist: { title: 'Watchlist', desc: 'Create and manage custom watchlists. Add symbols manually or from the market grid. Organize into multiple lists.' },
  scanners: { title: 'Scanners', desc: '5 pre-built market scanners: Unusual Volume, IV Spikes, SMA Crossovers, OI Buildup, and Price Breakouts.' },
  alerts: { title: 'Alerts', desc: 'Set price, IV, and OI-based alerts. Get notified when conditions trigger. Supports complex conditions with AND/OR logic.' },
  chain: { title: 'Option Chain', desc: 'Full option chain with CE/PE data. Shows LTP, IV, Greeks, OI, and buildup status for every strike.' },
  ai: { title: 'AI Analysis', desc: 'AI-powered trade analysis using ThirdEye models. Provides sentiment, pattern recognition, and probabilistic outcomes.' },
  oi: { title: 'OI Analysis', desc: 'Open Interest change analysis. Tracks accumulation/unwinding patterns to identify institutional activity.' },
  atm: { title: 'ATM Analysis', desc: 'ATM straddle analysis with premium tracking, IV, and breakeven calculations. Shows straddle value decay over time.' },
  positions: { title: 'Positions', desc: 'Live position P&L monitoring. Net delta, gamma, theta exposure. One-click exit, hedge, and reverse actions.' },
  orders: { title: 'Orders', desc: 'Order book with real-time status updates (Pending/Open/Filled/Rejected). Modify or cancel pending orders.' },
  heatmap: { title: 'Heatmap', desc: 'Sector-wise performance treemap. Color intensity = change magnitude. Quickly identify which sectors are moving.' },
  journal: { title: 'Trade Journal', desc: 'Log and analyze your trades. Track P&L, emotions, and strategy notes. Shows 7-day P&L curve.' },
  portfolio: { title: 'Portfolio', desc: 'Net portfolio Greeks (Delta/Gamma/Theta/Vega), P&L history, and portfolio heat gauge. Three tabs: Positions, Greeks, History.' },
  connection: { title: 'Connection', desc: 'Monitor 8-engine health status. Shows latency, uptime, TalkOptions/TalkDelta session state.' },
  handshake: { title: 'Handshake', desc: '5-step protocol console: Shield Auth → Health Check → WS Subscribe → Heartbeat → LIVE. Shows JWT status and live engine events.' },
  correlation: { title: 'Correlation Matrix', desc: '10×10 correlation grid for indices and stocks. Select 7d/30d/90d period. Hover for strength labels.' },
  fiidii: { title: 'FII/DII', desc: 'Institutional flow tracker. 7-day buy/sell data with sector breakdown. Identifies FII accumulation zones.' },
  vwap: { title: 'VWAP', desc: 'VWAP deviation tracker with σ bands. Volume Profile with POC (Point of Control) and Value Area identification.' },
  orderflow: { title: 'Order Flow', desc: 'Live trade tape with buy/sell pressure gauge. Tracks aggressive trades and order imbalance in real-time.' },
  intel: { title: 'Market Intel', desc: 'Pattern recognition (Engulfing, H&S, Double Bottom...) with confidence scores. Pre-market global indicators.' },
};

const GENERAL_SHORTCUTS = [
  { key: 'F1 / +', action: 'Buy Order Window' },
  { key: 'F2 / -', action: 'Sell Order Window' },
  { key: 'F3', action: 'Order Book' },
  { key: 'F4', action: 'Switch to Market Watch' },
  { key: 'F5', action: 'Refresh All Data' },
  { key: 'F6', action: 'Market Depth' },
  { key: 'F7', action: 'Position Book' },
  { key: 'F8', action: 'Trade Book' },
  { key: 'F9', action: 'Scanner' },
  { key: 'F11', action: 'Toggle Fullscreen' },
  { key: 'F12', action: 'Settings' },
  { key: 'Ctrl+F', action: 'Focus Search' },
  { key: 'Ctrl+1-9', action: 'Fire Quick Macro 1-9' },
  { key: 'Ctrl+Shift+S', action: 'Quick Short Straddle' },
  { key: 'Ctrl+Shift+X', action: 'Exit All Positions' },
  { key: 'Ctrl+Shift+H', action: 'Hedge All Positions' },
  { key: 'D', action: 'Toggle Dark/Light Theme' },
  { key: 'C', action: 'Open Chart' },
  { key: 'Escape', action: 'Close Any Popup' },
];

export default function HelpOverlay({ onClose }) {
  const [tab, setTab] = useState('views');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: 700, maxHeight: '80vh', borderRadius: 12,
        background: '#0f1724', border: '1px solid rgba(6,182,212,0.2)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #1e2a3a',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(139,92,246,0.05))',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>📖 ThetaDhan Help</div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Pro F&O Terminal — v4.0</div>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 6, border: 'none',
            background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: 14,
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, padding: '8px 12px', borderBottom: '1px solid #1e2a3a' }}>
          {[
            { id: 'views', label: '🖥️ Views' },
            { id: 'panels', label: '📊 Panels' },
            { id: 'keys', label: '⌨️ Shortcuts' },
            { id: 'qfm', label: '⚡ Quick Fire' },
            { id: 'about', label: 'ℹ️ About' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, height: 28, borderRadius: 4, border: 'none', fontSize: 10, fontWeight: 600, cursor: 'pointer',
              background: tab === t.id ? 'rgba(6,182,212,0.15)' : 'transparent',
              color: tab === t.id ? '#06b6d4' : '#64748b',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
          {/* Views */}
          {tab === 'views' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(VIEW_HELP).map(([k, v]) => (
                <div key={k} style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2a3a' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>{v.title}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.5, marginBottom: 6 }}>{v.desc}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {v.keys.map((k2, i) => (
                      <span key={i} style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(6,182,212,0.08)', color: '#06b6d4', fontSize: 9 }}>{k2}</span>
                    ))}
                  </div>
                  {v.shortcuts && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {v.shortcuts.map((s, i) => (
                        <span key={i} style={{ fontSize: 9, color: '#64748b' }}>
                          <kbd style={{ padding: '1px 4px', borderRadius: 3, background: '#1e2a3a', color: '#f59e0b', fontSize: 8, fontFamily: 'JetBrains Mono' }}>{s.key}</kbd> {s.action}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Panels */}
          {tab === 'panels' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {Object.entries(PANEL_HELP).map(([k, v]) => (
                <div key={k} style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2a3a' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#f8fafc', marginBottom: 2 }}>{v.title}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8', lineHeight: 1.4 }}>{v.desc}</div>
                </div>
              ))}
            </div>
          )}

          {/* Shortcuts */}
          {tab === 'keys' && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>ODIN-COMPATIBLE KEYBOARD SHORTCUTS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px 12px', fontSize: 10 }}>
                {GENERAL_SHORTCUTS.map((s, i) => (
                  <div key={i} style={{ display: 'contents' }}>
                    <kbd style={{
                      padding: '3px 8px', borderRadius: 4, background: '#1e2a3a', color: '#f59e0b',
                      fontSize: 9, fontFamily: 'JetBrains Mono', textAlign: 'center',
                      border: '1px solid #2d3a4a',
                    }}>{s.key}</kbd>
                    <span style={{ color: '#94a3b8', padding: '3px 0' }}>{s.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Fire */}
          {tab === 'qfm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>⚡ What are Quick Fire Macros?</div>
                <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.5 }}>
                  Pre-configured, one-click trade templates that execute complex multi-leg strategies. Like keyboard macros for trading — what takes 5-10 manual steps becomes a single click.
                </div>
              </div>
              {[
                { name: 'ATM+N Strike Buy/Sell', desc: 'Buy or sell CE/PE at ATM ± N strikes (configurable distance)' },
                { name: 'Delta Strangle', desc: 'Auto-picks strikes at your target delta (e.g., 0.2Δ) and executes Short Strangle' },
                { name: 'Group Execution', desc: 'Execute the same macro across multiple symbols (e.g., strangle on NIFTY + BANKNIFTY + FINNIFTY)' },
                { name: 'Straddle + SL/Target', desc: 'Sell ATM CE+PE with pre-attached stoploss and target bracket orders' },
                { name: 'Iron Condor', desc: 'Buy far OTM + Sell near OTM on both sides. All 4 legs in 1 click.' },
                { name: 'Hedge All', desc: 'Auto-buy protective options at 0.1Δ for every open position' },
              ].map((m, i) => (
                <div key={i} style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2a3a' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#06b6d4' }}>{m.name}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8' }}>{m.desc}</div>
                </div>
              ))}
            </div>
          )}

          {/* About */}
          {tab === 'about' && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>SRE THETA YANTRA</div>
              <div style={{ fontSize: 11, color: '#06b6d4', marginTop: 4 }}>Pro NSE F&O Trading Terminal</div>
              <div style={{ fontSize: 9, color: '#64748b', marginTop: 12, lineHeight: 1.6 }}>
                Bloomberg/ODIN-class terminal built for NSE F&O trading.<br />
                ~220 F&O symbols • Live LTP streaming • Options Intelligence<br />
                Quick Fire Macros • 19 Sidebar Panels • 8 Views<br />
                3FA Authentication • 5-Step Engine Handshake<br /><br />
                Powered by AlgoEngines 21-Engine Architecture
              </div>
              <div style={{ marginTop: 16, padding: '8px 16px', borderRadius: 6, background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', display: 'inline-block' }}>
                <div style={{ fontSize: 9, color: '#64748b' }}>Version</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#06b6d4' }}>4.0.0 — Sprint 12 Complete</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline info tooltip for panels
export function InfoTooltip({ panelId }) {
  const help = PANEL_HELP[panelId];
  const [show, setShow] = useState(false);
  if (!help) return null;

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setShow(!show); }}
        style={{
          width: 18, height: 18, borderRadius: '50%', border: '1px solid #2d3a4a',
          background: show ? 'rgba(6,182,212,0.15)' : 'transparent',
          color: show ? '#06b6d4' : '#475569', cursor: 'pointer', fontSize: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >ℹ</button>
      {show && (
        <div style={{
          position: 'absolute', top: 24, right: 0, width: 220, padding: '8px 10px',
          borderRadius: 6, background: '#0f1724', border: '1px solid rgba(6,182,212,0.2)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 100,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#06b6d4', marginBottom: 3 }}>{help.title}</div>
          <div style={{ fontSize: 9, color: '#94a3b8', lineHeight: 1.4 }}>{help.desc}</div>
          <button onClick={(e) => { e.stopPropagation(); setShow(false); }} style={{
            marginTop: 4, fontSize: 8, color: '#475569', background: 'none', border: 'none', cursor: 'pointer',
          }}>Close</button>
        </div>
      )}
    </span>
  );
}
