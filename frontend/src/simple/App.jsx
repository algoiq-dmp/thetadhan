import { useEffect, useState } from 'react'
import useAppStore from './stores/useAppStore'
import LoginScreen from './screens/LoginScreen'
import MDIWindow from './components/MDIWindow'
import ShortcutsHelp from './components/ShortcutsHelp'
import MarketWatch from './screens/MarketWatch'
import OrderForm from './screens/OrderForm'
import OrderBook from './screens/OrderBook'
import TradeBook from './screens/TradeBook'
import NetPosition from './screens/NetPosition'
import MessageLog from './screens/MessageLog'
import MarketPicture from './screens/MarketPicture'
import MarketDepth from './screens/MarketDepth'
import OptionChain from './screens/OptionChain'
import SettingsScreen from './screens/SettingsScreen'
import ChartScreen from './screens/ChartScreen'
import GreeksCalculator from './screens/GreeksCalculator'
import PortfolioAnalysis from './screens/PortfolioAnalysis'
import HistoricalData from './screens/HistoricalData'
import BroadcastSettings from './screens/BroadcastSettings'
import ExcelOrderUpload from './screens/ExcelOrderUpload'
import PositionUpload from './screens/PositionUpload'
import ExchangeSegmentSettings from './screens/ExchangeSegmentSettings'
import BracketOrder from './screens/BracketOrder'
import CoverOrder from './screens/CoverOrder'
import SpreadOrder from './screens/SpreadOrder'
import BasketOrder from './screens/BasketOrder'
import AlertsManager from './screens/AlertsManager'
import MarginCalculator from './screens/MarginCalculator'
import PivotCalculator from './screens/PivotCalculator'
import FibCalculator from './screens/FibCalculator'
import HeatMap from './screens/HeatMap'
import SnapQuote from './screens/SnapQuote'
import GridOrder from './screens/GridOrder'
import PTSTOrder from './screens/PTSTOrder'
import BhavCopy from './screens/BhavCopy'
import MultiMW from './screens/MultiMW'
import TradeTrail from './screens/TradeTrail'
import ExpensesMaster from './screens/ExpensesMaster'
import EventScanner from './screens/EventScanner'
import ConditionalTicker from './screens/ConditionalTicker'
import HelpSystem from './screens/HelpSystem'

const WINDOW_REGISTRY = {
  mw:       { title: '⊞ Market Watch 1 [F4]',     comp: () => <MarketWatch mwId={1} />,  x: 10,  y: 10,  w: 900, h: 500 },
  mw2:      { title: '⊞ Market Watch 2 [Ctrl+2]',  comp: () => <MarketWatch mwId={2} />,  x: 30,  y: 30,  w: 900, h: 500 },
  mw3:      { title: '⊞ Market Watch 3 [Ctrl+3]',  comp: () => <MarketWatch mwId={3} />,  x: 50,  y: 50,  w: 900, h: 500 },
  mw4:      { title: '⊞ Market Watch 4 [Ctrl+4]',  comp: () => <MarketWatch mwId={4} />,  x: 70,  y: 70,  w: 900, h: 500 },
  buy:      { title: '▲ Buy Order [F1]',          comp: () => <OrderForm side="buy" />, x: 50,  y: 20,  w: 380, h: 580 },
  sell:     { title: '▼ Sell Order [F2]',          comp: () => <OrderForm side="sell" />,x: 440, y: 20,  w: 380, h: 580 },
  ob:       { title: '📋 Order Book [F3]',          comp: () => <OrderBook />,            x: 20,  y: 20,  w: 820, h: 350 },
  mp:       { title: '🔍 Market Picture [F5]',      comp: () => <MarketPicture />,        x: 60,  y: 30,  w: 400, h: 450 },
  depth:    { title: '📊 Market Depth [F6]',        comp: () => <MarketDepth />,          x: 80,  y: 40,  w: 380, h: 350 },
  oc:       { title: '⊕ Option Chain [F7]',        comp: () => <OptionChain />,          x: 10,  y: 10,  w: 1000, h: 450 },
  tb:       { title: '✓ Trade Book [F8]',          comp: () => <TradeBook />,            x: 40,  y: 40,  w: 780, h: 300 },
  chart:    { title: '📈 Chart [F9]',               comp: () => <ChartScreen />,          x: 20,  y: 20,  w: 850, h: 480 },
  msg:      { title: '💬 Message Log [F10]',        comp: () => <MessageLog />,           x: 100, y: 200, w: 650, h: 280 },
  hist:     { title: '🕐 Historical Data [F11]',    comp: () => <HistoricalData />,       x: 30,  y: 30,  w: 750, h: 400 },
  pa:       { title: '📦 Portfolio Analysis [F12]', comp: () => <PortfolioAnalysis />,    x: 20,  y: 40,  w: 950, h: 380 },
  np:       { title: '💰 Net Position [Alt+F6]',    comp: () => <NetPosition />,          x: 30,  y: 60,  w: 950, h: 350 },
  calc:     { title: '🧮 Greeks Calculator',        comp: () => <GreeksCalculator />,     x: 150, y: 50,  w: 400, h: 450 },
  settings: { title: '⚙ Settings',                 comp: () => <SettingsScreen />,       x: 120, y: 60,  w: 550, h: 420 },
  broadcast:{ title: '📡 Broadcast Settings',       comp: () => <BroadcastSettings />,    x: 80,  y: 30,  w: 600, h: 500 },
  excelOrd: { title: '📥 Bulk Order Upload',        comp: () => <ExcelOrderUpload />,     x: 60,  y: 20,  w: 900, h: 450 },
  posUp:    { title: '📤 Position Upload',           comp: () => <PositionUpload />,       x: 70,  y: 30,  w: 850, h: 400 },
  exchSet:  { title: '🏛 Exchange Settings',         comp: () => <ExchangeSegmentSettings />, x: 100, y: 40, w: 600, h: 500 },
  bo:       { title: '↙ Bracket Order',              comp: () => <BracketOrder />,           x: 60,  y: 20,  w: 400, h: 600 },
  co:       { title: '🛡 Cover Order',                comp: () => <CoverOrder />,             x: 80,  y: 30,  w: 400, h: 550 },
  spread:   { title: '⇄ Spread Order [Ctrl+F3]',     comp: () => <SpreadOrder />,            x: 40,  y: 10,  w: 750, h: 450 },
  basket:   { title: '🧺 Basket Order',                comp: () => <BasketOrder />,            x: 30,  y: 20,  w: 850, h: 400 },
  alerts:   { title: '🔔 Alerts Manager',              comp: () => <AlertsManager />,          x: 50,  y: 30,  w: 780, h: 400 },
  margin:   { title: '🧮 Margin Calculator',            comp: () => <MarginCalculator />,        x: 100, y: 40,  w: 420, h: 520 },
  pivot:    { title: '📐 Pivot Calculator',             comp: () => <PivotCalculator />,         x: 110, y: 50,  w: 380, h: 480 },
  fib:      { title: '⌇ Fibonacci Calculator',         comp: () => <FibCalculator />,           x: 120, y: 60,  w: 380, h: 480 },
  heatmap:  { title: '🗺 Heat Map',                     comp: () => <HeatMap />,                 x: 20,  y: 10,  w: 700, h: 450 },
  snap:     { title: '📸 Snap Quote [Shift+F9]',        comp: () => <SnapQuote />,               x: 200, y: 80,  w: 420, h: 400 },
  gridOrd:  { title: '⊞ Grid Order',                   comp: () => <GridOrder />,               x: 70,  y: 30,  w: 450, h: 480 },
  ptst:     { title: '🏛 PTST Order',                   comp: () => <PTSTOrder />,               x: 90,  y: 40,  w: 420, h: 600 },
  bhav:     { title: '📊 Bhav Copy',                      comp: () => <BhavCopy />,                x: 30,  y: 20,  w: 850, h: 400 },
  multiMW:  { title: '⊞ Multi Market Watch',             comp: () => <MultiMW />,                 x: 0,   y: 0,   w: 1200,h: 600 },
  trail:    { title: '📋 Trade Trail',                    comp: () => <TradeTrail />,               x: 40,  y: 20,  w: 950, h: 500 },
  expenses: { title: '💰 Expenses Master',                comp: () => <ExpensesMaster />,           x: 60,  y: 30,  w: 900, h: 500 },
  scanner:  { title: '🔍 Event Scanner',                   comp: () => <EventScanner />,             x: 30,  y: 10,  w: 900, h: 450 },
  ticker:   { title: '📡 Conditional Ticker',              comp: () => <ConditionalTicker />,        x: 40,  y: 20,  w: 850, h: 400 },
  help:     { title: '📖 Help Guide',                       comp: () => <HelpSystem />,               x: 60,  y: 30,  w: 850, h: 550 },
}

/* ── SVG Icon components for Toolbar ── */
const TbIcon = ({ children, size = 16, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>
)
const ICONS = {
  mw: <TbIcon><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></TbIcon>,
  buy: <TbIcon><path d="M12 19V5M5 12l7-7 7 7"/></TbIcon>,
  sell: <TbIcon><path d="M12 5v14M19 12l-7 7-7-7"/></TbIcon>,
  ob: <TbIcon><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h6"/></TbIcon>,
  tb: <TbIcon><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/></TbIcon>,
  np: <TbIcon><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 000 4h4v-4z"/></TbIcon>,
  mp: <TbIcon><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></TbIcon>,
  depth: <TbIcon><path d="M3 3v18h18"/><path d="M7 16l4-8 4 5 4-10"/></TbIcon>,
  oc: <TbIcon><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></TbIcon>,
  chart: <TbIcon><path d="M3 3v18h18"/><path d="M7 12l3-3 3 3 4-4"/></TbIcon>,
  pa: <TbIcon><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></TbIcon>,
  calc: <TbIcon><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h3M8 18h3M15 14h1M15 18h1"/></TbIcon>,
  hist: <TbIcon><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></TbIcon>,
  msg: <TbIcon><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></TbIcon>,
  settings: <TbIcon><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></TbIcon>,
}

function ToolbarButton({ icon, label, title, shortcut, color, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button className="toolbar-btn" onClick={onClick}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={color ? { color: color, fontWeight: 700 } : {}}>
        {icon || label}
      </button>
      {hover && (
        <div className="toolbar-tooltip">
          <div style={{ fontWeight: 600, fontSize: 10, color: '#fff' }}>{title}</div>
          {shortcut && <div style={{ fontSize: 9, color: 'var(--accent)', marginTop: 1 }}>{shortcut}</div>}
        </div>
      )}
    </div>
  )
}

function MenuBar({ onOpen, onSaveAs, onLoad, onDelete, savedNames, currentWs, onCascade, onTileH, onTileV, onCloseAll, onLogout }) {
  const menus = [
    { label: 'File', items: [
      { label: '🟢 Connect', action: () => alert('Connected to Admin Server') },
      { label: '🔴 Disconnect', action: () => alert('Disconnected from Admin Server') },
      '—',
      { label: '💾 Save Workspace As...', action: onSaveAs },
      { label: '📂 Load Workspace', submenu: savedNames.length > 0 ? savedNames.map(n => ({ label: n + (n === currentWs ? ' ✓' : ''), action: () => onLoad(n) })) : [{ label: '(none saved)', action: () => {} }] },
      { label: '🗑 Delete Workspace', submenu: savedNames.length > 0 ? savedNames.map(n => ({ label: n, action: () => onDelete(n) })) : [{ label: '(none)', action: () => {} }] },
      '—',
      { label: '🔓 Logout', action: onLogout },
      { label: '❌ Exit', action: onLogout },
    ]},
    { label: 'View', items: [
      { label: 'Market Watch (F4)', key: 'mw' }, { label: 'Market Picture (F5)', key: 'mp' },
      { label: 'Market Depth (F6)', key: 'depth' },
      { label: '📸 Snap Quote (Shift+F9)', key: 'snap' },
      { label: '🗺 Market Movement', key: 'heatmap' }, '—',
      { label: '⊞ Multi Market Watch', key: 'multiMW' },
      { label: 'Order Book (F3)', key: 'ob' }, { label: 'Trade Book (F8)', key: 'tb' },
      { label: 'Net Position (Alt+F6)', key: 'np' }, '—',
      { label: '📋 Trade Trail', key: 'trail' },
      { label: '📊 Bhav Copy', key: 'bhav' },
      { label: 'Message Log (F10)', key: 'msg' }
    ]},
    { label: 'Orders', items: [
      { label: 'Buy (F1)', key: 'buy' }, { label: 'Sell (F2)', key: 'sell' }, '—',
      { label: '↙ Bracket Order (BO)', key: 'bo' },
      { label: '🛡 Cover Order (CO)', key: 'co' },
      { label: '⇄ Spread Order (Ctrl+F3)', key: 'spread' },
      { label: '📦 Basket Order', key: 'basket' },
      { label: '⊞ Grid Order', key: 'gridOrd' },
      { label: '🏛 PTST Order', key: 'ptst' }, '—',
      { label: '📋 Bulk Order (Excel)', key: 'excelOrd' },
      { label: '📊 Upload Positions', key: 'posUp' },
    ]},
    { label: 'Tools', items: [
      { label: 'Option Chain (F7)', key: 'oc' }, { label: 'Chart (F9)', key: 'chart' },
      { label: 'Historical Data (F11)', key: 'hist' }, '—',
      { label: 'Greeks Calculator', key: 'calc' },
      { label: '🧮 Margin Calculator', key: 'margin' },
      { label: '📐 Pivot Calculator', key: 'pivot' },
      { label: '⌇ Fibonacci Calculator', key: 'fib' }, '—',
      { label: '🗺 Heat Map', key: 'heatmap' },
      { label: '📸 Snap Quote (Shift+F9)', key: 'snap' },
      { label: 'Portfolio Analysis (F12)', key: 'pa' },
      { label: '💰 Expenses', key: 'expenses' }, '—',
      { label: '🔔 Alerts Manager', key: 'alerts' },
      { label: '🔍 Event Scanner', key: 'scanner' },
      { label: '📡 Conditional Ticker', key: 'ticker' }, '—',
      { label: '⬇ Download Masters', action: () => alert('Downloading contract master files...\n\nNSE F&O Contracts: 8,500+ symbols\nBSE Equity: 5,200+ symbols\nMCX Commodity: 120+ symbols\n\nFiles saved to: data/masters/') },
      { label: '📡 Broadcast Settings', key: 'broadcast' },
      { label: '⚙ Exchange Settings', key: 'exchSet' },
      { label: 'Settings', key: 'settings' }
    ]},
    { label: 'Window', items: [
      { label: 'Cascade', action: onCascade }, { label: 'Tile Horizontal', action: onTileH },
      { label: 'Tile Vertical', action: onTileV }, '—', { label: 'Close All', action: onCloseAll }
    ]},
    { label: 'Help', items: [
      { label: '📖 Help Guide', key: 'help' },
      { label: '⌨ Shortcuts (Ctrl+/)', action: () => {} },
      '—',
      { label: 'About Light Z', action: () => alert('ALGO-IQ Light Z Terminal\nVersion: 1.0.0 Production\n\n© 2026 Algo-IQ Technologies\nInstitutional Trading Terminal\n\n91 modules │ 42 windows │ 168 features\nODIN-compatible keyboard shortcuts\n5 theme presets │ Auto-backup\n\nPowered by Kuber Alpha 3-Tier Architecture') }
    ] },
  ]
  const [openMenu, setOpenMenu] = useState(null)
  const [hoverSub, setHoverSub] = useState(null)

  return (
    <div className="menubar" onMouseLeave={() => { setOpenMenu(null); setHoverSub(null) }}>
      <span className="menubar-brand">⚡ LIGHT Z</span>
      {menus.map((m, i) => (
        <div key={i} style={{ position: 'relative' }}
          onMouseEnter={() => openMenu !== null && setOpenMenu(i)}>
          <button className="menubar-item" onClick={() => setOpenMenu(openMenu === i ? null : i)}>
            {m.label}
          </button>
          {openMenu === i && (
            <div style={{
              position:'absolute', left:0, top:'100%', background:'var(--bg-panel)',
              border:'1px solid var(--border)', boxShadow:'var(--shadow)', minWidth:200, zIndex:9999,
              padding:'2px 0'
            }}>
              {m.items.map((item, j) => {
                if (item === '—') return <div key={j} style={{ height:1, background:'var(--border)', margin:'2px 0' }}/>
                const label = typeof item === 'string' ? item : item.label
                const key = typeof item === 'object' ? item.key : null
                const action = typeof item === 'object' ? item.action : null
                const submenu = typeof item === 'object' ? item.submenu : null
                return (
                  <div key={j} style={{ position: 'relative' }}
                    onMouseEnter={() => submenu && setHoverSub(j)}
                    onMouseLeave={() => submenu && setHoverSub(null)}>
                    <button style={{
                      display:'flex', width:'100%', padding:'4px 16px', fontSize:11,
                      background:'transparent', border:'none', color:'var(--text-primary)',
                      textAlign:'left', cursor:'pointer', fontFamily:'var(--ui-font)',
                      alignItems:'center', justifyContent:'space-between'
                    }} onClick={() => { if (key) onOpen(key); if (action) action(); if (!submenu) setOpenMenu(null) }}
                      onMouseEnter={(e) => e.currentTarget.style.background='var(--bg-row-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background='transparent'}>
                      <span>{label}</span>
                      {submenu && <span style={{ fontSize: 8, marginLeft: 8 }}>▶</span>}
                    </button>
                    {submenu && hoverSub === j && (
                      <div style={{
                        position:'absolute', left:'100%', top:0, background:'var(--bg-panel)',
                        border:'1px solid var(--border)', boxShadow:'var(--shadow)', minWidth:160, zIndex:10000,
                        padding:'2px 0'
                      }}>
                        {submenu.map((sub, k) => (
                          <button key={k} style={{
                            display:'block', width:'100%', padding:'4px 16px', fontSize:11,
                            background:'transparent', border:'none', color:'var(--text-primary)',
                            textAlign:'left', cursor:'pointer', fontFamily:'var(--ui-font)'
                          }} onClick={() => { if (sub.action) sub.action(); if (sub.key) onOpen(sub.key); setOpenMenu(null); setHoverSub(null) }}
                            onMouseEnter={(e) => e.target.style.background='var(--bg-row-hover)'}
                            onMouseLeave={(e) => e.target.style.background='transparent'}>
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Toolbar({ onOpen }) {
  const windows = useAppStore(s => s.windows)
  const openIds = windows.map(w => w.id)

  const mwTabs = [
    { key: 'mw', label: '1', shortcut: 'Ctrl+1' },
    { key: 'mw2', label: '2', shortcut: 'Ctrl+2' },
    { key: 'mw3', label: '3', shortcut: 'Ctrl+3' },
    { key: 'mw4', label: '4', shortcut: 'Ctrl+4' },
  ]

  const btns = [
    { icon: ICONS.buy, label: 'BUY', key: 'buy', title: 'Buy Order', shortcut: 'F1', color: 'var(--buy)' },
    { icon: ICONS.sell, label: 'SELL', key: 'sell', title: 'Sell Order', shortcut: 'F2', color: 'var(--sell)' },
    null,
    { icon: ICONS.ob, label: 'OB', key: 'ob', title: 'Order Book', shortcut: 'F3' },
    { icon: ICONS.tb, label: 'TB', key: 'tb', title: 'Trade Book', shortcut: 'F8' },
    { icon: ICONS.np, label: 'NP', key: 'np', title: 'Net Position', shortcut: 'Alt+F6' },
    null,
    { icon: ICONS.mp, label: 'MP', key: 'mp', title: 'Market Picture', shortcut: 'F5' },
    { icon: ICONS.depth, label: 'DP', key: 'depth', title: 'Market Depth', shortcut: 'F6' },
    { icon: ICONS.oc, label: 'OC', key: 'oc', title: 'Option Chain', shortcut: 'F7', color: 'var(--accent)' },
    { icon: ICONS.chart, label: 'Chart', key: 'chart', title: 'Chart', shortcut: 'F9' },
    null,
    { icon: ICONS.pa, label: 'PA', key: 'pa', title: 'Portfolio Analysis', shortcut: 'F12' },
    { icon: ICONS.calc, label: 'Calc', key: 'calc', title: 'Greeks Calculator', shortcut: '' },
    { icon: ICONS.hist, label: 'HIST', key: 'hist', title: 'Historical Data', shortcut: 'F11' },
    null,
    { icon: ICONS.msg, label: 'MSG', key: 'msg', title: 'Message Log', shortcut: 'F10' },
    { icon: ICONS.settings, label: '⚙', key: 'settings', title: 'Settings', shortcut: 'Alt+F7' },
  ]

  return (
    <div className="toolbar">
      {/* MW Tab Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 1, marginRight: 2 }}>
        <ToolbarButton icon={ICONS.mw} label="MW" title="Market Watch" shortcut="F4" onClick={() => onOpen('mw')} />
        <div className="mw-tabs">
          {mwTabs.map(t => {
            const isActive = openIds.includes(t.key)
            return (
              <button key={t.key} className={`mw-tab${isActive ? ' active' : ''}`}
                title={`Market Watch ${t.label} (${t.shortcut})`}
                onClick={() => onOpen(t.key)}>
                {t.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="toolbar-sep" />

      {btns.map((b, i) => {
        if (!b) return <div className="toolbar-sep" key={i} />
        return (
          <ToolbarButton key={i} icon={b.icon} label={b.label} title={b.title}
            shortcut={b.shortcut} color={b.color} onClick={() => onOpen(b.key)} />
        )
      })}
    </div>
  )
}

function StatusBar() {
  const user = useAppStore(s => s.user)
  const exchanges = useAppStore(s => s.exchanges)
  const [time, setTime] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])

  return (
    <div className="statusbar">
      {exchanges.map(e => (
        <span key={e.name}>
          <span className={`status-dot ${e.connected ? 'green' : 'red'}`}></span>
          {e.name}
        </span>
      ))}
      <div className="status-sep" />
      <span>User: <b style={{ color: 'var(--accent)' }}>{user?.id || '—'}</b></span>
      <div className="status-sep" />
      <span>Mode: <b style={{ color: 'var(--profit)' }}>LIVE</b></span>
      <div className="status-sep" />
      <span>Windows: <b>{useAppStore.getState().windows.length}</b></span>
      <div className="status-sep" />
      <span>Font: <b>{parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-size')) || 11}px</b></span>
      <span className="status-clock">{time.toLocaleTimeString('en-IN', { hour12: false })}</span>
    </div>
  )
}

function MessageBar() {
  const messages = useAppStore(s => s.messages)
  const [idx, setIdx] = useState(0)
  const [scrollMode, setScrollMode] = useState(false)
  useEffect(() => {
    if (messages.length === 0 || scrollMode) return
    const t = setInterval(() => setIdx(i => (i + 1) % Math.min(messages.length, 5)), 4000)
    return () => clearInterval(t)
  }, [messages.length, scrollMode])

  const latest = messages.slice(-10).reverse()
  if (latest.length === 0) return null

  const colors = { order: '#4dabf7', trade: '#22c55e', rejection: '#ef4444', system: '#eab308', exchange: '#7c4dff' }
  const msgIcons = { order: '📋', trade: '✓', rejection: '✗', system: '⚙', exchange: '📡' }

  if (scrollMode) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', padding: '0 4px',
        background: 'rgba(0,0,0,0.25)', borderTop: '1px solid var(--border)',
        fontSize: 10, fontFamily: 'var(--grid-font)', minHeight: 22, overflow: 'hidden', position: 'relative'
      }}>
        <button onClick={() => setScrollMode(false)} title="Switch to static mode"
          style={{ flexShrink:0, width:18, height:16, background:'var(--bg-surface)', border:'1px solid var(--border)', color:'var(--accent)', cursor:'pointer', fontSize:8, fontWeight:700, marginRight:4, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        </button>
        <div style={{ flex:1, overflow:'hidden', whiteSpace:'nowrap' }}>
          <div className="msg-ticker-content" style={{ display:'inline-flex', gap:24, alignItems:'center', animation:`tickerScroll ${Math.max(15, latest.length * 6)}s linear infinite` }}>
            {[...latest, ...latest].map((msg, i) => {
              const c = colors[msg.type] || '#7a7a8c'
              return (
                <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:c, fontSize:11 }}>{msgIcons[msg.type] || '•'}</span>
                  <span style={{ color:'#4a4a5c', fontSize:8 }}>{msg.time}</span>
                  <span style={{ color:c, fontWeight:600 }}>{msg.text}</span>
                  <span style={{ color:'#2a2a44' }}>│</span>
                </span>
              )
            })}
          </div>
        </div>
        <span style={{ flexShrink:0, fontSize:8, color:'#5a5a6a', marginLeft:4 }}>{latest.length} msgs</span>
      </div>
    )
  }

  const msg = latest[idx % latest.length]
  if (!msg) return null
  const c = colors[msg.type] || '#7a7a8c'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '2px 10px',
      background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border)',
      fontSize: 10, fontFamily: 'var(--grid-font)', minHeight: 22,
    }}>
      <button onClick={() => setScrollMode(true)} title="Switch to horizontal scroll mode"
        style={{ flexShrink:0, width:18, height:16, background:'var(--bg-surface)', border:'1px solid var(--border)', color:'var(--text-muted)', cursor:'pointer', fontSize:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5,3 19,12 5,21"/></svg>
      </button>
      <span style={{ color: c, fontSize: 11 }}>{msgIcons[msg.type] || '•'}</span>
      <span style={{ color: '#5a5a6a', fontSize: 8 }}>{msg.time}</span>
      <span style={{ color: c, fontWeight: 600 }}>{msg.text}</span>
      <span style={{ marginLeft: 'auto', fontSize: 8, color: '#5a5a6a' }}>{latest.length} msgs │ {msg.type?.toUpperCase()}</span>
    </div>
  )
}

export default function App() {
  const loggedIn = useAppStore(s => s.loggedIn)
  const openWindow = useAppStore(s => s.openWindow)
  const windows = useAppStore(s => s.windows)
  const savedWorkspaces = useAppStore(s => s.savedWorkspaces)
  const currentWorkspace = useAppStore(s => s.currentWorkspace)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const handleOpen = (key) => {
    const reg = WINDOW_REGISTRY[key]
    if (!reg) return
    openWindow({ id: key, ...reg })
  }

  // Workspace actions
  const handleSaveAs = () => {
    const name = prompt('Workspace name:', currentWorkspace || 'My Trading')
    if (name) useAppStore.getState().saveWorkspaceAs(name)
  }
  const handleLoad = (name) => useAppStore.getState().loadWorkspaceByName(name, WINDOW_REGISTRY)
  const handleDelete = (name) => { if (confirm(`Delete workspace "${name}"?`)) useAppStore.getState().deleteWorkspace(name) }
  const handleCascade = () => useAppStore.getState().cascadeWindows()
  const handleTileH = () => useAppStore.getState().tileHorizontal()
  const handleTileV = () => useAppStore.getState().tileVertical()
  const handleCloseAll = () => useAppStore.getState().closeAllWindows()

  // Ctrl+Scroll font size adjustment
  useEffect(() => {
    if (!loggedIn) return
    const onWheel = (e) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const root = document.documentElement
      const cur = parseInt(getComputedStyle(root).getPropertyValue('--grid-size')) || 11
      const next = Math.min(16, Math.max(8, cur + (e.deltaY < 0 ? 1 : -1)))
      root.style.setProperty('--grid-size', next + 'px')
      root.style.setProperty('--ui-size', next + 'px')
      localStorage.setItem('lightz-font-size', next)
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [loggedIn])

  // Restore font size on load
  useEffect(() => {
    const saved = localStorage.getItem('lightz-font-size')
    if (saved) {
      document.documentElement.style.setProperty('--grid-size', saved + 'px')
      document.documentElement.style.setProperty('--ui-size', saved + 'px')
    }
  }, [])

  // Keyboard shortcuts — full ODIN spec
  useEffect(() => {
    const onKey = (e) => {
      if (!loggedIn) return
      // Primary F-keys (no modifiers)
      if (!e.shiftKey && !e.ctrlKey && !e.altKey) {
        const map = { F1:'buy', F2:'sell', F3:'ob', F4:'mw', F5:'mp', F6:'depth', F7:'oc', F8:'tb', F9:'chart', F10:'msg', F11:'hist', F12:'pa' }
        if (map[e.key]) { e.preventDefault(); handleOpen(map[e.key]) }
      }
      // Shift combos
      if (e.shiftKey && !e.ctrlKey && !e.altKey) {
        if (e.key === 'F1') { e.preventDefault(); handleOpen('ob') }
        if (e.key === 'F2') { e.preventDefault(); handleOpen('ob') }
        if (e.key === 'F3') { e.preventDefault(); handleOpen('ob') }
        if (e.key === 'F4') { e.preventDefault(); handleOpen('mw') }
        if (e.key === 'F6') { e.preventDefault(); handleOpen('np') }
        if (e.key === 'F7') { e.preventDefault(); handleOpen('snap') }
        if (e.key === 'F8') { e.preventDefault(); handleOpen('snap') }
        if (e.key === 'F9') { e.preventDefault(); handleOpen('snap') }
        if (e.key === 'F10') { e.preventDefault(); handleOpen('heatmap') }
        if (e.key === 'F11') { e.preventDefault(); handleOpen('snap') }
        if (e.key === 'F12') { e.preventDefault(); handleOpen('heatmap') }
      }
      // Ctrl combos
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        // Ctrl+1/2/3/4 → Switch Market Watch windows
        if (e.key === '1') { e.preventDefault(); handleOpen('mw') }
        if (e.key === '2') { e.preventDefault(); handleOpen('mw2') }
        if (e.key === '3') { e.preventDefault(); handleOpen('mw3') }
        if (e.key === '4') { e.preventDefault(); handleOpen('mw4') }
        if (e.key === '0') { e.preventDefault(); document.documentElement.style.setProperty('--grid-size', '11px'); document.documentElement.style.setProperty('--ui-size', '11px'); localStorage.setItem('lightz-font-size', 11) }
        if (e.key === 'F1') { e.preventDefault(); handleOpen('buy') }
        if (e.key === 'F2') { e.preventDefault(); handleOpen('sell') }
        if (e.key === 'F3') { e.preventDefault(); handleOpen('spread') }
        if (e.key === 'F4') { e.preventDefault(); const { focusedId, closeWindow } = useAppStore.getState(); if (focusedId) closeWindow(focusedId) }
        if (e.key === 'F8') { e.preventDefault(); handleOpen('ob') }
        if (e.key === 'F9') { e.preventDefault(); handleOpen('snap') }
        if (e.key === 'F10') { e.preventDefault(); handleOpen('heatmap') }
        if (e.key === 'F11') { e.preventDefault(); handleOpen('hist') }
        if (e.key === 'i' || e.key === 'I') { e.preventDefault(); handleOpen('chart') }
        if (e.key === 'h' || e.key === 'H') { e.preventDefault(); handleOpen('hist') }
        if (e.key === '/') { e.preventDefault(); setShowShortcuts(s => !s) }
        if (e.key === 's' || e.key === 'S') { e.preventDefault(); handleSaveAs() }
      }
      // Alt combos
      if (e.altKey && !e.ctrlKey) {
        if (e.key === 'F3') { e.preventDefault(); handleOpen('pa') }
        if (e.key === 'F6') { e.preventDefault(); handleOpen('np') }
        if (e.key === 'F7') { e.preventDefault(); handleOpen('settings') }
      }
      // Escape
      if (e.key === 'Escape') {
        if (showShortcuts) { setShowShortcuts(false); return }
        const { focusedId, closeWindow } = useAppStore.getState()
        if (focusedId) { e.preventDefault(); closeWindow(focusedId) }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loggedIn, showShortcuts])

  // Auto-tile standard workspace on login
  useEffect(() => {
    if (loggedIn) useAppStore.getState().tileStandard(WINDOW_REGISTRY)
  }, [loggedIn])

  // Auto-login from Dhan session
  useEffect(() => {
    const t = localStorage.getItem('dhan_token');
    const c = localStorage.getItem('dhan_client_id');
    if (t && c && !loggedIn) { useAppStore.getState().login(c); }
  }, [loggedIn])

  if (!loggedIn) return null

  const indices = [
    { name: 'NIFTY 50', val: '24,250.50', chg: '+180.25', chgP: '+0.75' },
    { name: 'BANK NIFTY', val: '51,520.00', chg: '+425.10', chgP: '+0.83' },
    { name: 'SENSEX', val: '79,850.25', chg: '+520.75', chgP: '+0.66' },
    { name: 'INDIA VIX', val: '14.25', chg: '-0.85', chgP: '-5.63' },
    { name: 'NIFTY IT', val: '33,150.00', chg: '-120.50', chgP: '-0.36' },
    { name: 'NIFTY FIN', val: '22,850.00', chg: '+195.25', chgP: '+0.86' },
  ]

  return (
    <div className="app-shell">
      <MenuBar onOpen={handleOpen} onSaveAs={handleSaveAs} onLoad={handleLoad} onDelete={handleDelete}
        savedNames={Object.keys(savedWorkspaces)} currentWs={currentWorkspace}
        onCascade={handleCascade} onTileH={handleTileH} onTileV={handleTileV} onCloseAll={handleCloseAll}
        onLogout={() => { useAppStore.getState().closeAllWindows(); useAppStore.getState().logout() }} />
      <Toolbar onOpen={handleOpen} />
      <div className="ticker-bar">
        <div className="ticker-content">
          {[...indices, ...indices].map((idx, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#eab308', fontWeight: 600 }}>{idx.name}</span>
              <span style={{ color: '#d0d0d8', fontWeight: 700 }}>{idx.val}</span>
              <span style={{ color: parseFloat(idx.chg) >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {idx.chg} ({idx.chgP}%)
              </span>
              <span style={{ color: '#2a2a44' }}>│</span>
            </span>
          ))}
        </div>
      </div>
      <div className="mdi-desktop">
        {windows.map(w => {
          const reg = WINDOW_REGISTRY[w.id]
          if (!reg) return null
          return (
            <MDIWindow key={w.id} id={w.id} title={reg.title}>
              {reg.comp()}
            </MDIWindow>
          )
        })}
      </div>
      <MessageBar />
      <StatusBar />
      {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}
    </div>
  )
}
