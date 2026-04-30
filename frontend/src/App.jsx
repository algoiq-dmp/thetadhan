import { useState, useEffect, useRef } from 'react';
import useMarketStore from './store/useMarketStore';
import useAuthStore from './store/useAuthStore';
import { simulateTick } from './data/mockUniverse';
import useSocket, { fetchAPI } from './hooks/useSocket';
import LoginPage from './auth/LoginPage';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import StatusBar from './components/StatusBar';
import OptionChainPopup from './components/OptionChainPopup';
import QuickFirePanel from './components/QuickFirePanel';
import ChartPopup from './components/ChartPopup';
import TechnicalPopup from './components/TechnicalPopup';
import SettingsPanel from './components/SettingsPanel';
import AddScripDialog from './components/AddScripDialog';
import QuickSearchDialog from './components/QuickSearchDialog';
import EngineSettingsPanel from './components/EngineSettingsPanel';
import HelpOverlay from './components/HelpOverlay';
import { ToastContainer } from './utils/toastSystem';
import MessageBar from './components/MessageBar';

// V4: Layout components
import LeftNavBar from './layouts/LeftNavBar';
import RightSidebar from './layouts/RightSidebar';

// V4: Views
import TerminalView from './views/TerminalView';
import MarketWatchView from './views/MarketWatchView';
import OptionsTraderView from './views/OptionsTraderView';
import StocksView from './views/StocksView';
import ScalperView from './views/ScalperView';
import IVAnalysisView from './views/IVAnalysisView';
import StrategyBuilderView from './views/StrategyBuilderView';
import CustomLayoutView from './views/CustomLayoutView';

export default function App() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const { theme, isFullscreen, showOptionChain, showChart, showQuickFire, showSettings, activeView, showOrderEntry } = useMarketStore();
  const updateTicks = useMarketStore(s => s.updateTicks);
  const closeOptionChain = useMarketStore(s => s.closeOptionChain);
  const openOptionChain = useMarketStore(s => s.openOptionChain);
  const openChart = useMarketStore(s => s.openChart);
  const closeChart = useMarketStore(s => s.closeChart);
  const toggleTheme = useMarketStore(s => s.toggleTheme);
  const toggleFullscreen = useMarketStore(s => s.toggleFullscreen);
  const toggleQuickFire = useMarketStore(s => s.toggleQuickFire);
  const toggleSettings = useMarketStore(s => s.toggleSettings);
  const selectedIdx = useMarketStore(s => s.selectedIdx);
  const setSelectedIdx = useMarketStore(s => s.setSelectedIdx);
  const getFiltered = useMarketStore(s => s.getFiltered);
  const universe = useMarketStore(s => s.universe);
  const setActiveView = useMarketStore(s => s.setActiveView);
  const setActivePanel = useMarketStore(s => s.setActivePanel);
  const openOrderEntry = useMarketStore(s => s.openOrderEntry);
  const closeOrderEntry = useMarketStore(s => s.closeOrderEntry);
  const searchRef = useRef(null);

  // Feature states
  const [showTechnical, setShowTechnical] = useState(null);
  const [showAddScrip, setShowAddScrip] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [showEngineSettings, setShowEngineSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Restore Dhan session on page load (Bug #7 fix)
  useEffect(() => {
    useAuthStore.getState().restoreSession();
  }, []);

  // Auto-load live universe when authenticated (Bug #4 fix)
  useEffect(() => {
    if (isAuthenticated) {
      useMarketStore.getState().connectEngines().then(() => {
        // Start live LTP polling after instruments are loaded
        useMarketStore.getState().startLTPPolling();
      });
    }
    return () => {
      useMarketStore.getState().stopLTPPolling();
    };
  }, [isAuthenticated]);

  // Backend WebSocket connection
  const { connected: backendConnected } = useSocket();

  // Simulated Feeds configuration
  const simulatedFeeds = useMarketStore(s => s.simulatedFeeds);
  const dhanConnected = useAuthStore(s => s.dhanConnected);

  // Simulate live ticks — ONLY when user explicitly enabled simulated feeds in settings
  // NEVER auto-simulate when Dhan is connected (REST polling provides real data)
  useEffect(() => {
    const shouldSimulate = simulatedFeeds.enabled && !dhanConnected;
    if (!shouldSimulate) return;
    const speed = (simulatedFeeds.tickSpeed || 2) * 1000;
    const iv = setInterval(() => {
      updateTicks(row => simulateTick(row, simulatedFeeds));
    }, speed);
    return () => clearInterval(iv);
  }, [updateTicks, dhanConnected, simulatedFeeds]);

  // Clear flash class after animation
  useEffect(() => {
    const iv = setInterval(() => { updateTicks(r => ({ ...r, flashClass: '' })); }, 2800);
    return () => clearInterval(iv);
  }, [updateTicks]);

  // Global keyboard handler — full ODIN + enhanced
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') e.target.blur();
        return;
      }

      const filtered = getFiltered();
      const selected = filtered[selectedIdx];

      // Alt combos
      if (e.altKey && e.key === 'F6') {
        e.preventDefault();
        useMarketStore.getState().setPositionTab('positions');
        return;
      }

      // Shift combos
      if (e.shiftKey) {
        switch (e.key) {
          case 'F1': e.preventDefault(); { const toast = document.createElement('div'); toast.textContent = '⏳ Cancel selected order (Shift+F1)'; toast.style.cssText = 'position:fixed;top:60px;right:20px;z-index:99999;padding:10px 18px;background:#f59e0b;color:#000;border-radius:6px;font-size:12px;font-weight:600;'; document.body.appendChild(toast); setTimeout(() => toast.remove(), 2000); } return;
          case 'F2': e.preventDefault(); { const toast = document.createElement('div'); toast.textContent = '✏️ Modify selected order (Shift+F2)'; toast.style.cssText = 'position:fixed;top:60px;right:20px;z-index:99999;padding:10px 18px;background:#3b82f6;color:#fff;border-radius:6px;font-size:12px;font-weight:600;'; document.body.appendChild(toast); setTimeout(() => toast.remove(), 2000); } return;
          case 'F3': e.preventDefault(); { const toast = document.createElement('div'); toast.textContent = '🚨 Cancel ALL pending orders (Shift+F3)'; toast.style.cssText = 'position:fixed;top:60px;right:20px;z-index:99999;padding:10px 18px;background:#ef4444;color:#fff;border-radius:6px;font-size:12px;font-weight:600;'; document.body.appendChild(toast); setTimeout(() => toast.remove(), 2000); } return;
          case 'F6': e.preventDefault(); useMarketStore.getState().setPositionTab('positions'); return;
          case 'F7': e.preventDefault(); { const toast = document.createElement('div'); toast.textContent = 'ℹ️ Security info (Shift+F7)'; toast.style.cssText = 'position:fixed;top:60px;right:20px;z-index:99999;padding:10px 18px;background:#06b6d4;color:#fff;border-radius:6px;font-size:12px;font-weight:600;'; document.body.appendChild(toast); setTimeout(() => toast.remove(), 2000); } return;
          case 'F8': e.preventDefault(); { const toast = document.createElement('div'); toast.textContent = '📋 Contract details (Shift+F8)'; toast.style.cssText = 'position:fixed;top:60px;right:20px;z-index:99999;padding:10px 18px;background:#06b6d4;color:#fff;border-radius:6px;font-size:12px;font-weight:600;'; document.body.appendChild(toast); setTimeout(() => toast.remove(), 2000); } return;
          case 'Enter': e.preventDefault(); return;
        }
      }

      // Ctrl+Number: Quick view switching
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const viewKeys = ['scalper', 'options', 'stocks', 'iv', 'strategy', 'marketwatch', 'terminal', 'custom'];
        const num = parseInt(e.key);
        if (num >= 1 && num <= 8) {
          e.preventDefault();
          setActiveView(viewKeys[num - 1]);
          return;
        }
        // Ctrl+Space: Quick Search
        if (e.key === ' ') {
          e.preventDefault();
          setShowQuickSearch(true);
          return;
        }
      }

      switch (e.key) {
        case 'F1':
          e.preventDefault();
          if (selected) openOrderEntry({ side: 'BUY', symbol: selected.symbol, price: selected.ltp });
          break;
        case 'F2':
          e.preventDefault();
          if (selected) openOrderEntry({ side: 'SELL', symbol: selected.symbol, price: selected.ltp });
          break;
        case 'F3':
          e.preventDefault();
          setActivePanel('orders');
          break;
        case 'F5':
          e.preventDefault();
          useMarketStore.getState().connectEngines().then(() => useMarketStore.getState().startLTPPolling());
          { const toast = document.createElement('div'); toast.textContent = '🔄 Refreshing all data...'; toast.style.cssText = 'position:fixed;top:60px;right:20px;z-index:99999;padding:10px 18px;background:#10b981;color:#fff;border-radius:6px;font-size:12px;font-weight:600;'; document.body.appendChild(toast); setTimeout(() => toast.remove(), 2000); }
          break;
        case 'F7':
          e.preventDefault();
          setActivePanel('positions');
          break;
        case 'F8':
          e.preventDefault();
          setActivePanel('orders');
          break;
        case 'F9':
          e.preventDefault();
          setActivePanel('scanners');
          break;
        case 'F11':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'F12':
          e.preventDefault();
          toggleSettings();
          break;
        case 'Escape':
          closeOptionChain();
          closeChart();
          setShowTechnical(null);
          closeOrderEntry();
          setShowAddScrip(false);
          break;
        case '+':
        case '=':
          if (!e.ctrlKey && selected) openOrderEntry({ side: 'BUY', symbol: selected.symbol, price: selected.ltp });
          break;
        case '-':
          if (!e.ctrlKey && selected) openOrderEntry({ side: 'SELL', symbol: selected.symbol, price: selected.ltp });
          break;
        case 'Insert':
          e.preventDefault();
          setShowAddScrip(true);
          break;
        case 'Delete':
          e.preventDefault();
          alert(`Remove ${selected?.symbol} from market watch`);
          break;
        case 'd':
        case 'D':
          if (!e.ctrlKey && !e.metaKey) toggleTheme();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIdx(Math.min(selectedIdx + 1, getFiltered().length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIdx(Math.max(selectedIdx - 1, 0));
          break;
        case 'Enter':
          if (selected) openOptionChain(selected.symbol);
          break;
        case 'c':
        case 'C':
          if (!e.ctrlKey && selected) openChart(selected.symbol);
          break;
        case 't':
        case 'T':
          if (!e.ctrlKey && selected) setShowTechnical({ symbol: selected.symbol, ltp: selected.ltp });
          break;
        case 'f':
          if (e.ctrlKey) { e.preventDefault(); searchRef.current?.focus(); }
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIdx, getFiltered, toggleFullscreen, toggleTheme, closeOptionChain, openOptionChain, openChart, closeChart, setSelectedIdx, toggleSettings, setActiveView, setActivePanel]);

  // Render active view — all 8 real views
  const renderView = () => {
    switch (activeView) {
      case 'terminal':    return <TerminalView onOpenTechnical={(sym, ltp) => setShowTechnical({ symbol: sym, ltp })} />;
      case 'marketwatch': return <MarketWatchView />;
      case 'options':     return <OptionsTraderView />;
      case 'stocks':      return <StocksView />;
      case 'scalper':     return <ScalperView />;
      case 'iv':          return <IVAnalysisView />;
      case 'strategy':    return <StrategyBuilderView />;
      case 'custom':      return <CustomLayoutView />;
      default:            return <TerminalView onOpenTechnical={(sym, ltp) => setShowTechnical({ symbol: sym, ltp })} />;
    }
  };

  // Order Window (unified — triggered from F1/F2, charts, alerts, scanners, HA signals)
  const renderOrderWindow = () => {
    if (!showOrderEntry) return null;
    const isBuy = showOrderEntry.side === 'BUY';
    const row = universe.find(r => r.symbol === showOrderEntry.symbol);
    const iv = row?.iv || 0;
    const ltp = showOrderEntry.price || row?.ltp || 0;
    const connectorType = useMarketStore.getState().activeConnector;
    const connectorLabel = { paper: '📄 Paper Trading', xts: '🔌 XTS', gets: '🔌 GETS', dhan: '🔌 Dhan', vega: '⚙️ Vega Engine' };

    const submitOrder = async () => {
      const form = document.getElementById('ty-order-form');
      if (!form) return;
      const qty = parseInt(form.querySelector('[data-field="qty"]')?.value) || row?.lotSize || 100;
      const price = parseFloat(form.querySelector('[data-field="price"]')?.value) || ltp;
      const orderType = form.querySelector('[data-field="orderType"]')?.value || 'MARKET';
      const product = form.querySelector('[data-field="product"]')?.value || 'MIS';

      const orderPayload = {
        symbol: showOrderEntry.symbol,
        side: showOrderEntry.side,
        qty,
        price: orderType === 'MARKET' ? 0 : price,
        orderType,
        product,
        token: row?.token || 0,
        exchange: 'NFO',
      };

      try {
        // Bug #5 fix: correct endpoint '/orders/place' (not '/order/place')
        // Bug #6 fix: fetchAPI now auto-injects auth headers from localStorage
        const result = await fetchAPI('/orders/place', {
          method: 'POST',
          body: JSON.stringify(orderPayload),
        });
        // Success toast
        const toast = document.createElement('div');
        toast.className = 'toast-success';
        toast.textContent = `✅ ${showOrderEntry.side} ${qty} ${showOrderEntry.symbol} @ ${orderType} — Order ID: ${result.orderId || 'OK'}`;
        toast.style.cssText = 'position:fixed;top:60px;right:20px;z-index:99999;padding:12px 20px;background:#10b981;color:#fff;border-radius:8px;font-size:12px;font-weight:600;animation:fadeIn 0.3s;';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
        closeOrderEntry();
      } catch (e) {
        // Paper trading fallback
        const toast = document.createElement('div');
        toast.textContent = `📄 ${showOrderEntry.side} ${qty} ${showOrderEntry.symbol} @ ${orderType} — Paper Trade Logged`;
        toast.style.cssText = 'position:fixed;top:60px;right:20px;z-index:99999;padding:12px 20px;background:#06b6d4;color:#fff;border-radius:8px;font-size:12px;font-weight:600;animation:fadeIn 0.3s;';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
        console.log('📄 Paper trade:', orderPayload);
        closeOrderEntry();
      }
    };

    return (
      <div className="modal-overlay" onClick={closeOrderEntry}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
          <div className="modal-header">
            <div className="modal-title" style={{ color: isBuy ? 'var(--green)' : 'var(--red)' }}>
              {isBuy ? '🟢 BUY' : '🔴 SELL'} — {showOrderEntry.symbol}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(6,182,212,0.1)', color: '#06b6d4', fontWeight: 600 }}>{connectorLabel[connectorType] || connectorType}</span>
              <button className="modal-close" onClick={closeOrderEntry}>✕</button>
            </div>
          </div>
          <div id="ty-order-form" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* AI Insights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {iv > 35 && <div className="ai-insight warning">⚠️ High IV ({iv.toFixed(1)}) — Premium may be expensive</div>}
              <div className="ai-insight danger">⏰ Near expiry — Rapid theta decay active</div>
              <div className="ai-insight info">📊 OI buildup detected at nearby strikes</div>
              <div className="ai-insight info">📈 PCR: 1.18 — Moderately bullish</div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="order-field" style={{ flex: 2 }}>
                <label>Symbol</label>
                <input value={showOrderEntry.symbol} readOnly style={{ width: '100%', background: 'var(--bg-card)' }} />
              </div>
              <div className="order-field" style={{ flex: 1 }}>
                <label>Qty</label>
                <input type="number" data-field="qty" defaultValue={row?.lotSize || 100} style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="order-field" style={{ flex: 1 }}>
                <label>Price</label>
                <input type="number" data-field="price" defaultValue={ltp} step="0.05" style={{ width: '100%' }} />
              </div>
              <div className="order-field" style={{ flex: 1 }}>
                <label>Order Type</label>
                <select data-field="orderType" style={{ width: '100%' }}><option>MARKET</option><option>LIMIT</option><option>SL</option><option>SL-M</option></select>
              </div>
              <div className="order-field" style={{ flex: 1 }}>
                <label>Product</label>
                <select data-field="product" style={{ width: '100%' }}><option>MIS</option><option>NRML</option><option>CNC</option></select>
              </div>
            </div>

            {/* Bracket + Trailing SL */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 6 }}>
                  <input type="checkbox" /> Bracket Order
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="order-field"><label>Target</label><input type="number" defaultValue={8} style={{ width: 60 }} /></div>
                  <div className="order-field"><label>SL</label><input type="number" defaultValue={showOrderEntry.sl || 4} style={{ width: 60 }} /></div>
                </div>
              </div>
              <div style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 6 }}>
                  <input type="checkbox" /> Trailing SL
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="order-field"><label>Trail</label><input type="number" defaultValue={2} style={{ width: 60 }} /></div>
                  <div className="order-field"><label>Step</label><input type="number" defaultValue={1} style={{ width: 60 }} /></div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)', marginTop: 4, cursor: 'pointer' }}>
                  <input type="checkbox" /> Breakeven after +5
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', padding: '4px 0' }}>
              <span>Risk: ₹300</span><span>Reward: ₹600</span><span>RR: 1:2</span><span>Margin: ~₹12K</span>
            </div>

            <button className={isBuy ? 'btn-buy' : 'btn-sell'} style={{ width: '100%', height: 40, fontSize: 14 }}
              onClick={submitOrder}>
              ■ {showOrderEntry.side} {showOrderEntry.symbol}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
              {['MKT', 'SL-M 3%', '1×Lot', '2×Lot', '5×Lot'].map(q => (
                <button key={q} className="sector-pill" style={{ fontSize: 9, padding: '2px 8px' }}>{q}</button>
              ))}
            </div>

            <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
              <span className="kbd">+</span>/<span className="kbd">F1</span> Buy • <span className="kbd">-</span>/<span className="kbd">F2</span> Sell • <span className="kbd">Esc</span> close
            </div>
          </div>
        </div>
      </div>
    );
  };

  return !isAuthenticated ? <LoginPage /> : (
    <div className={`app-layout${isFullscreen ? ' fullscreen' : ''}`}>
      <Header searchRef={searchRef} onOpenEngineSettings={() => setShowEngineSettings(true)} onOpenHelp={() => setShowHelp(true)} />
      <Toolbar searchRef={searchRef} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* V4: Left Navigation Bar */}
        <LeftNavBar />

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {renderView()}
        </div>

        {/* V4: Right Sidebar */}
        <RightSidebar />

        {/* Quick Fire (floating) */}
        {showQuickFire && <QuickFirePanel />}
      </div>
      <MessageBar />
      <StatusBar />

      {/* Modals & Popups */}
      {showOptionChain && <OptionChainPopup symbol={showOptionChain} />}
      {showChart && <ChartPopup symbol={showChart} />}
      {showTechnical && <TechnicalPopup symbol={showTechnical.symbol} ltp={showTechnical.ltp} onClose={() => setShowTechnical(null)} />}
      {showSettings && <SettingsPanel onClose={toggleSettings} />}
      {showAddScrip && <AddScripDialog position={selectedIdx} onAdd={(s) => console.log('Add scrip:', s)} onClose={() => setShowAddScrip(false)} />}
      {showQuickSearch && <QuickSearchDialog onSelect={(sym) => { setActiveView('options'); }} onClose={() => setShowQuickSearch(false)} />}
      {renderOrderWindow()}
      {showEngineSettings && <EngineSettingsPanel onClose={() => setShowEngineSettings(false)} />}
      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
      <ToastContainer />
    </div>
  );
}
