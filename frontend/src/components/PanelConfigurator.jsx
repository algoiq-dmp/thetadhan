import { useState } from 'react';
import useMarketStore from '../store/useMarketStore';

const ALL_PANELS = [
  { id: 'watchlist', icon: '📋', label: 'Watchlist', desc: 'Custom symbol lists' },
  { id: 'scanners', icon: '🔍', label: 'Scanners', desc: 'Live market scanners' },
  { id: 'alerts', icon: '🔔', label: 'Alerts', desc: 'Price & technical alerts' },
  { id: 'chain', icon: '🔗', label: 'Option Chain', desc: 'Full chain with Greeks' },
  { id: 'ai', icon: '🤖', label: 'AI Analysis', desc: 'AI-powered insights' },
  { id: 'oi', icon: '📊', label: 'OI Analysis', desc: 'Open Interest charts' },
  { id: 'atm', icon: '📈', label: 'ATM Analysis', desc: 'ATM IV & straddle' },
  { id: 'positions', icon: '💰', label: 'Positions', desc: 'Live positions & P&L' },
  { id: 'orders', icon: '📝', label: 'Orders', desc: 'Order book & history' },
  { id: 'heatmap', icon: '🗺️', label: 'Heatmap', desc: 'Market sector heatmap' },
  { id: 'journal', icon: '📓', label: 'Trade Journal', desc: 'P&L analytics log' },
  { id: 'portfolio', icon: '💼', label: 'Portfolio', desc: 'Portfolio summary' },
  { id: 'connection', icon: '🔌', label: 'Connection', desc: 'Engine connectivity' },
  { id: 'handshake', icon: '🤝', label: 'Handshake', desc: 'AlgoEngines status' },
  { id: 'correlation', icon: '🫧', label: 'Correlation Matrix', desc: 'Cross-asset correlation' },
  { id: 'fiidii', icon: '🌍', label: 'FII/DII', desc: 'Institutional flows' },
  { id: 'vwap', icon: '📏', label: 'VWAP', desc: 'Volume-weighted price' },
  { id: 'orderflow', icon: '⚡', label: 'Order Flow', desc: 'Real-time order flow' },
  { id: 'intel', icon: '🔮', label: 'Market Intel', desc: 'Pattern recognition' },
  { id: 'qfm', icon: '🎯', label: 'QF Macros', desc: '15 pre-built strategies' },
  { id: 'heikinashi', icon: '🔮', label: 'Heikin Ashi AI', desc: 'HA color-change alerts' },
];

const ALL_VIEWS = [
  { id: 'scalper', icon: '⚡', label: 'Scalper' },
  { id: 'options', icon: '📊', label: 'Options Trader' },
  { id: 'stocks', icon: '📈', label: 'Stocks Scanner' },
  { id: 'iv', icon: '📉', label: 'IV Analysis' },
  { id: 'strategy', icon: '🎯', label: 'Strategy Builder' },
  { id: 'marketwatch', icon: '📺', label: 'Market Watch' },
  { id: 'terminal', icon: '📋', label: 'Terminal' },
  { id: 'custom', icon: '⚙️', label: 'Custom Layout' },
];

const PRESETS = {
  'Options Trader': { panels: ['chain', 'positions', 'orders', 'qfm', 'alerts', 'heikinashi', 'ai', 'portfolio'] },
  'Scalper Pro': { panels: ['positions', 'orders', 'alerts', 'qfm', 'watchlist', 'orderflow'] },
  'Swing Trader': { panels: ['watchlist', 'chain', 'ai', 'oi', 'heikinashi', 'journal', 'fiidii', 'vwap'] },
  'Minimal': { panels: ['watchlist', 'positions', 'orders', 'alerts'] },
  'Full Terminal': { panels: ALL_PANELS.map(p => p.id) },
};

export default function PanelConfigurator({ onClose }) {
  const panelConfig = useMarketStore(s => s.panelConfig);
  const setPanelConfig = useMarketStore(s => s.setPanelConfig);
  const togglePanelEnabled = useMarketStore(s => s.togglePanelEnabled);
  const toggleViewEnabled = useMarketStore(s => s.toggleViewEnabled);
  const [activeTab, setActiveTab] = useState('panels');

  const applyPreset = (name) => {
    const preset = PRESETS[name];
    if (preset) setPanelConfig({ enabledPanels: preset.panels, panelOrder: preset.panels });
  };

  const movePanel = (id, dir) => {
    const order = [...panelConfig.panelOrder];
    const idx = order.indexOf(id);
    if (idx < 0) return;
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= order.length) return;
    [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
    setPanelConfig({ panelOrder: order });
  };

  const moveView = (id, dir) => {
    const order = [...panelConfig.viewOrder];
    const idx = order.indexOf(id);
    if (idx < 0) return;
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= order.length) return;
    [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
    setPanelConfig({ viewOrder: order });
  };

  const tabStyle = (t) => ({
    padding: '6px 14px', border: 'none', borderRadius: '6px 6px 0 0', cursor: 'pointer', fontSize: 11, fontWeight: 600,
    background: activeTab === t ? 'var(--bg-card)' : 'transparent',
    color: activeTab === t ? '#06b6d4' : 'var(--text-muted)',
    borderBottom: activeTab === t ? '2px solid #06b6d4' : '2px solid transparent',
  });

  const rowStyle = { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 11 };
  const btnMini = { width: 20, height: 20, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 9, background: 'var(--bg)', color: 'var(--text-muted)' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: 520, maxHeight: '80vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-heading)' }}>⚙️ Panel & View Configurator</span>
          <button onClick={onClose} className="icon-btn" style={{ width: 28, height: 28 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
          <button onClick={() => setActiveTab('panels')} style={tabStyle('panels')}>Right Panels</button>
          <button onClick={() => setActiveTab('views')} style={tabStyle('views')}>Left Views</button>
          <button onClick={() => setActiveTab('presets')} style={tabStyle('presets')}>Presets</button>
        </div>

        <div style={{ padding: '12px 20px', maxHeight: 400, overflowY: 'auto' }}>
          {/* PANELS TAB */}
          {activeTab === 'panels' && (
            <>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
                Enable/disable panels and reorder using ▲▼ arrows. Enabled: {panelConfig.enabledPanels.length}/{ALL_PANELS.length}
              </div>
              {panelConfig.panelOrder
                .filter(id => ALL_PANELS.find(p => p.id === id))
                .map((id, idx) => {
                  const panel = ALL_PANELS.find(p => p.id === id);
                  const enabled = panelConfig.enabledPanels.includes(id);
                  return (
                    <div key={id} style={{ ...rowStyle, opacity: enabled ? 1 : 0.4 }}>
                      <input type="checkbox" checked={enabled} onChange={() => togglePanelEnabled(id)} style={{ accentColor: '#06b6d4' }} />
                      <span style={{ fontSize: 16, width: 22 }}>{panel.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{panel.label}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{panel.desc}</div>
                      </div>
                      <button style={btnMini} onClick={() => movePanel(id, 'up')} title="Move up">▲</button>
                      <button style={btnMini} onClick={() => movePanel(id, 'down')} title="Move down">▼</button>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', width: 20, textAlign: 'center' }}>#{idx + 1}</span>
                    </div>
                  );
                })}
              {/* Add any panels not in order yet */}
              {ALL_PANELS.filter(p => !panelConfig.panelOrder.includes(p.id)).map(panel => (
                <div key={panel.id} style={{ ...rowStyle, opacity: 0.3 }}>
                  <input type="checkbox" checked={false} onChange={() => togglePanelEnabled(panel.id)} />
                  <span style={{ fontSize: 16, width: 22 }}>{panel.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{panel.label}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{panel.desc}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* VIEWS TAB */}
          {activeTab === 'views' && (
            <>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
                Enable/disable views and reorder. Enabled: {panelConfig.enabledViews.length}/{ALL_VIEWS.length}
              </div>
              {panelConfig.viewOrder
                .filter(id => ALL_VIEWS.find(v => v.id === id))
                .map((id, idx) => {
                  const view = ALL_VIEWS.find(v => v.id === id);
                  const enabled = panelConfig.enabledViews.includes(id);
                  const defaultPanel = panelConfig.viewDefaults[id] || 'watchlist';
                  return (
                    <div key={id} style={{ ...rowStyle, opacity: enabled ? 1 : 0.4 }}>
                      <input type="checkbox" checked={enabled} onChange={() => toggleViewEnabled(id)} style={{ accentColor: '#06b6d4' }} />
                      <span style={{ fontSize: 16, width: 22 }}>{view.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{view.label}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                          Default panel: <select style={{ fontSize: 9, background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 4px' }}
                            value={defaultPanel}
                            onChange={e => setPanelConfig({ viewDefaults: { ...panelConfig.viewDefaults, [id]: e.target.value } })}
                          >
                            {ALL_PANELS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <button style={btnMini} onClick={() => moveView(id, 'up')}>▲</button>
                      <button style={btnMini} onClick={() => moveView(id, 'down')}>▼</button>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', width: 20, textAlign: 'center' }}>#{idx + 1}</span>
                    </div>
                  );
                })}
            </>
          )}

          {/* PRESETS TAB */}
          {activeTab === 'presets' && (
            <>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12 }}>
                Quick-apply a panel preset configuration. Your current settings will be overwritten.
              </div>
              {Object.entries(PRESETS).map(([name, preset]) => (
                <div key={name} style={{ ...rowStyle, cursor: 'pointer' }} onClick={() => applyPreset(name)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{name}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{preset.panels.length} panels: {preset.panels.join(', ')}</div>
                  </div>
                  <button className="sector-pill" style={{ fontSize: 9, padding: '3px 10px' }}>Apply</button>
                </div>
              ))}
            </>
          )}
        </div>

        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} className="sector-pill" style={{ fontSize: 10, padding: '5px 16px' }}>Done</button>
        </div>
      </div>
    </div>
  );
}
