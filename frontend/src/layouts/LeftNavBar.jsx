import useMarketStore from '../store/useMarketStore';

const ALL_NAV_ITEMS = [
  { id: 'scalper',     icon: '⚡', label: 'Scalper',     tip: 'High-speed execution' },
  { id: 'options',     icon: '📊', label: 'Options',     tip: 'Options Trader' },
  { id: 'stocks',      icon: '📈', label: 'Stocks',      tip: 'Stocks + Scanner' },
  { id: 'iv',          icon: '📉', label: 'IV',          tip: 'IV Analysis' },
  { id: 'strategy',    icon: '🎯', label: 'Strategy',    tip: 'Strategy Builder' },
  { id: 'marketwatch', icon: '📺', label: 'Mkt Watch',   tip: 'Multi-Chart Grid' },
  { id: 'terminal',    icon: '📋', label: 'Terminal',    tip: 'Full Market Grid' },
  { id: 'custom',      icon: '⚙️', label: 'Custom',      tip: 'Custom Layout' },
];

export default function LeftNavBar() {
  const activeView = useMarketStore(s => s.activeView);
  const setActiveView = useMarketStore(s => s.setActiveView);
  const panelConfig = useMarketStore(s => s.panelConfig);

  // Filter and order views based on config
  const visibleViews = panelConfig.viewOrder
    .filter(id => panelConfig.enabledViews.includes(id))
    .map(id => ALL_NAV_ITEMS.find(v => v.id === id))
    .filter(Boolean);

  return (
    <nav className="left-navbar">
      <div className="left-nav-items">
        {visibleViews.map(item => (
          <button
            key={item.id}
            className={`left-nav-btn${activeView === item.id ? ' active' : ''}`}
            onClick={() => setActiveView(item.id)}
            title={item.tip}
          >
            <span className="left-nav-icon">{item.icon}</span>
            <span className="left-nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
