import { useState } from 'react';
import useMarketStore from '../store/useMarketStore';
import { InfoTooltip } from '../components/HelpOverlay';
import WatchlistPanel from '../panels/WatchlistPanel';
import ScannerPanel from '../panels/ScannerPanel';
import AlertsPanel from '../panels/AlertsPanel';
import ChainPanel from '../panels/ChainPanel';
import AIAnalysisPanel from '../panels/AIAnalysisPanel';
import OIAnalysisPanel from '../panels/OIAnalysisPanel';
import ATMAnalysisPanel from '../panels/ATMAnalysisPanel';
import PositionsPanel from '../panels/PositionsPanel';
import OrdersPanel from '../panels/OrdersPanel';
import HeatmapPanel from '../panels/HeatmapPanel';
import TradeJournal from '../panels/TradeJournal';
import PortfolioPanel from '../panels/PortfolioPanel';
import ConnectionPanel from '../panels/ConnectionPanel';
import HandshakePanel from '../panels/HandshakePanel';
import CorrelationPanel from '../panels/CorrelationPanel';
import FIIDIIPanel from '../panels/FIIDIIPanel';
import VWAPPanel from '../panels/VWAPPanel';
import OrderFlowPanel from '../panels/OrderFlowPanel';
import MarketIntelPanel from '../panels/MarketIntelPanel';
import QuickFireMacroPanel from '../panels/QuickFireMacroPanel';
import HeikinAshiPanel from '../panels/HeikinAshiPanel';
import SettingsPanel from '../components/SettingsPanel';
import PanelConfigurator from '../components/PanelConfigurator';

// Full panel registry
const ALL_PANEL_ITEMS = [
  { id: 'watchlist',  icon: '📋', label: 'Watchlist' },
  { id: 'scanners',   icon: '🔍', label: 'Scanners' },
  { id: 'alerts',     icon: '🔔', label: 'Alerts' },
  { id: 'chain',      icon: '🔗', label: 'Chain' },
  { id: 'ai',         icon: '🤖', label: 'AI' },
  { id: 'oi',         icon: '📊', label: 'OI' },
  { id: 'atm',        icon: '📈', label: 'ATM' },
  { id: 'positions',  icon: '💰', label: 'Positions' },
  { id: 'orders',     icon: '📝', label: 'Orders' },
  { id: 'heatmap',    icon: '🗺️', label: 'Heatmap' },
  { id: 'journal',    icon: '📓', label: 'Journal' },
  { id: 'portfolio',  icon: '💼', label: 'Portfolio' },
  { id: 'connection', icon: '🔌', label: 'Connection' },
  { id: 'handshake',  icon: '🤝', label: 'Handshake' },
  { id: 'correlation', icon: '🫧', label: 'Corr.Matrix' },
  { id: 'fiidii',     icon: '🌍', label: 'FII/DII' },
  { id: 'vwap',       icon: '📏', label: 'VWAP' },
  { id: 'orderflow',  icon: '⚡', label: 'Order Flow' },
  { id: 'intel',      icon: '🔮', label: 'Intel' },
  { id: 'qfm',        icon: '🎯', label: 'QF Macros' },
  { id: 'heikinashi', icon: '🔮', label: 'Heikin Ashi' },
];

const PANEL_MAP = {
  watchlist: WatchlistPanel, scanners: ScannerPanel, alerts: AlertsPanel,
  chain: ChainPanel, ai: AIAnalysisPanel, oi: OIAnalysisPanel,
  atm: ATMAnalysisPanel, positions: PositionsPanel, orders: OrdersPanel,
  heatmap: HeatmapPanel, journal: TradeJournal, portfolio: PortfolioPanel,
  connection: ConnectionPanel, handshake: HandshakePanel, correlation: CorrelationPanel,
  fiidii: FIIDIIPanel, vwap: VWAPPanel, orderflow: OrderFlowPanel,
  intel: MarketIntelPanel, qfm: QuickFireMacroPanel, heikinashi: HeikinAshiPanel,
};

export default function RightSidebar() {
  const activePanel = useMarketStore(s => s.activePanel);
  const setActivePanel = useMarketStore(s => s.setActivePanel);
  const rightSidebarOpen = useMarketStore(s => s.rightSidebarOpen);
  const toggleRightSidebar = useMarketStore(s => s.toggleRightSidebar);
  const panelConfig = useMarketStore(s => s.panelConfig);
  const toggleSettings = useMarketStore(s => s.toggleSettings);
  const [showConfigurator, setShowConfigurator] = useState(false);

  // Filter and order panels based on config
  const visiblePanels = panelConfig.panelOrder
    .filter(id => panelConfig.enabledPanels.includes(id))
    .map(id => ALL_PANEL_ITEMS.find(p => p.id === id))
    .filter(Boolean);

  const isSettingsActive = activePanel === '_settings';
  const PanelContent = isSettingsActive ? null : PANEL_MAP[activePanel];
  const activeLabel = isSettingsActive
    ? 'Settings'
    : (ALL_PANEL_ITEMS.find(p => p.id === activePanel)?.label || '');

  return (
    <>
      <div className={`right-sidebar${rightSidebarOpen ? ' open' : ''}`}>
        {/* Panel Content */}
        {rightSidebarOpen && (
          <div className="right-panel-content">
            <div className="right-panel-header">
              <span className="right-panel-title">{activeLabel}</span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {!isSettingsActive && <InfoTooltip panelId={activePanel} />}
                <button className="icon-btn" title="Expand" style={{ width: 24, height: 24, fontSize: 12 }}>↗</button>
                <button className="icon-btn" onClick={toggleRightSidebar} title="Collapse" style={{ width: 24, height: 24, fontSize: 12 }}>»</button>
              </div>
            </div>
            <div className="right-panel-body">
              {isSettingsActive ? (
                <SettingsPanel onClose={() => setActivePanel('watchlist')} inline />
              ) : PanelContent ? <PanelContent /> : (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{ALL_PANEL_ITEMS.find(p => p.id === activePanel)?.icon}</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{activeLabel}</div>
                  <div>Coming soon</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Panel Tab Icons */}
        <div className="right-panel-tabs">
          {!rightSidebarOpen && (
            <button className="right-tab-btn expand-btn" onClick={toggleRightSidebar} title="Open Sidebar">
              <span>«</span>
            </button>
          )}
          {visiblePanels.map(item => (
            <button
              key={item.id}
              className={`right-tab-btn${activePanel === item.id ? ' active' : ''}`}
              onClick={() => {
                if (activePanel === item.id && rightSidebarOpen) {
                  toggleRightSidebar();
                } else {
                  setActivePanel(item.id);
                }
              }}
              title={item.label}
            >
              <span className="right-tab-icon">{item.icon}</span>
              <span className="right-tab-label">{item.label}</span>
            </button>
          ))}

          {/* Separator */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />

          {/* Customize button */}
          <button
            className="right-tab-btn"
            onClick={() => setShowConfigurator(true)}
            title="Customize Panels"
            style={{ opacity: 0.6 }}
          >
            <span className="right-tab-icon">🎛️</span>
            <span className="right-tab-label">Customize</span>
          </button>

          {/* Settings — always last */}
          <button
            className={`right-tab-btn${isSettingsActive ? ' active' : ''}`}
            onClick={() => {
              if (isSettingsActive && rightSidebarOpen) toggleRightSidebar();
              else setActivePanel('_settings');
            }}
            title="Settings"
          >
            <span className="right-tab-icon">⚙️</span>
            <span className="right-tab-label">Settings</span>
          </button>
        </div>
      </div>

      {showConfigurator && <PanelConfigurator onClose={() => setShowConfigurator(false)} />}
    </>
  );
}
