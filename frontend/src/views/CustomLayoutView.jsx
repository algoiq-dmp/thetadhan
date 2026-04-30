import { useState } from 'react';

const WIDGETS = [
  { id: 'chart', icon: '📈', label: 'Price Chart', w: 2, h: 2 },
  { id: 'chain', icon: '🔗', label: 'Option Chain', w: 2, h: 2 },
  { id: 'depth', icon: '📊', label: 'Market Depth', w: 1, h: 1 },
  { id: 'watchlist', icon: '📋', label: 'Watchlist', w: 1, h: 2 },
  { id: 'positions', icon: '💰', label: 'Positions', w: 1, h: 1 },
  { id: 'orders', icon: '📝', label: 'Orders', w: 1, h: 1 },
  { id: 'alerts', icon: '🔔', label: 'Alerts', w: 1, h: 1 },
  { id: 'ai', icon: '🤖', label: 'AI Insights', w: 1, h: 1 },
  { id: 'ticker', icon: '📺', label: 'Ticker Tape', w: 2, h: 1 },
  { id: 'heatmap', icon: '🗺️', label: 'Heatmap', w: 2, h: 2 },
  { id: 'greeks', icon: '🔬', label: 'Greeks Panel', w: 1, h: 1 },
  { id: 'news', icon: '📰', label: 'News Feed', w: 1, h: 2 },
];

const PRESETS = [
  { name: 'Options Focus', widgets: ['chart', 'chain', 'positions', 'greeks'] },
  { name: 'Scalping', widgets: ['chart', 'depth', 'orders', 'ticker'] },
  { name: 'Full Monitor', widgets: ['chart', 'watchlist', 'positions', 'alerts', 'ai', 'news'] },
  { name: 'IV Research', widgets: ['chart', 'chain', 'greeks', 'heatmap'] },
];

export default function CustomLayoutView() {
  const [activeWidgets, setActiveWidgets] = useState(['chart', 'chain', 'positions', 'greeks']);
  const [layoutName, setLayoutName] = useState('Options Focus');

  const toggleWidget = (id) => {
    setActiveWidgets(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);
  };

  const applyPreset = (preset) => {
    setActiveWidgets(preset.widgets);
    setLayoutName(preset.name);
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* LEFT: Widget Palette */}
      <div style={{ width: 200, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', fontSize: 12, fontWeight: 700, color: 'var(--text-heading)' }}>
          ⚙️ Widget Palette
        </div>

        {/* Presets */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Presets</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {PRESETS.map(p => (
              <button key={p.name} className={`sector-pill${layoutName === p.name ? ' active' : ''}`}
                onClick={() => applyPreset(p)} style={{ fontSize: 8, padding: '2px 6px' }}>{p.name}</button>
            ))}
          </div>
        </div>

        {/* Widget List */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {WIDGETS.map(w => (
            <div key={w.id} onClick={() => toggleWidget(w.id)}
              style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                background: activeWidgets.includes(w.id) ? 'var(--bg-row-selected)' : 'transparent' }}>
              <span style={{ fontSize: 14, marginRight: 8 }}>{w.icon}</span>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: 'var(--text-heading)' }}>{w.label}</span>
              <span style={{ fontSize: 9, color: activeWidgets.includes(w.id) ? 'var(--green)' : 'var(--text-muted)' }}>
                {activeWidgets.includes(w.id) ? '✅' : '○'}
              </span>
            </div>
          ))}
        </div>

        {/* Save Layout */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <input value={layoutName} onChange={e => setLayoutName(e.target.value)}
            style={{ width: '100%', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 11, fontFamily: 'inherit', marginBottom: 4 }}
            placeholder="Layout name..." />
          <button style={{ width: '100%', padding: '6px', fontSize: 10, fontWeight: 700, border: '1px solid var(--cyan)', borderRadius: 4, background: 'var(--cyan-soft)', color: 'var(--cyan)', cursor: 'pointer' }}>
            💾 Save Layout
          </button>
        </div>
      </div>

      {/* CENTER: Grid Layout */}
      <div style={{ flex: 1, padding: 8, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: 'minmax(180px, 1fr)', gap: 6, height: '100%' }}>
          {activeWidgets.map(id => {
            const w = WIDGETS.find(x => x.id === id);
            if (!w) return null;
            return (
              <div key={id} style={{
                gridColumn: `span ${w.w}`, gridRow: `span ${w.h}`,
                background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                transition: 'all 0.2s'
              }}>
                {/* Widget Header */}
                <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-panel)' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-heading)' }}>{w.icon} {w.label}</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button style={{ width: 18, height: 18, border: '1px solid var(--border)', borderRadius: 3, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↗</button>
                    <button onClick={() => toggleWidget(id)}
                      style={{ width: 18, height: 18, border: '1px solid var(--border)', borderRadius: 3, background: 'transparent', color: 'var(--red)', cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                </div>
                
                {/* Widget Content */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{w.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{w.label}</div>
                    <div style={{ fontSize: 9, marginTop: 4, color: 'var(--cyan)' }}>Drag to reposition</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
