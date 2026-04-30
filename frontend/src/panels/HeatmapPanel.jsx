import { useState, useMemo } from 'react';
import useMarketStore from '../store/useMarketStore';

const SECTOR_COLORS = {
  BANK: '#3b82f6', IT: '#8b5cf6', PHARMA: '#ec4899', AUTO: '#f59e0b',
  METAL: '#6b7280', ENERGY: '#ef4444', FMCG: '#10b981', INFRA: '#14b8a6',
  FINANCE: '#6366f1', REALTY: '#a855f7', CEMENT: '#78716c', CHEMICAL: '#84cc16',
  TELECOM: '#f97316', MEDIA: '#e879f9', INDICES: '#06b6d4',
};

export default function HeatmapPanel() {
  const universe = useMarketStore(s => s.universe);
  const [metric, setMetric] = useState('changePct');
  const [groupBy, setGroupBy] = useState('sector');

  // Group by sector
  const groups = useMemo(() => {
    const g = {};
    universe.forEach(r => {
      const key = groupBy === 'sector' ? (r.sector || 'OTHER') : (r.changePct > 0 ? 'GAINERS' : 'LOSERS');
      if (!g[key]) g[key] = [];
      g[key].push(r);
    });
    // Sort each group by market cap (volume as proxy)
    Object.values(g).forEach(arr => arr.sort((a, b) => b.volume - a.volume));
    return g;
  }, [universe, groupBy]);

  const getColor = (val) => {
    if (val > 3) return 'rgba(16,185,129,0.85)';
    if (val > 1) return 'rgba(16,185,129,0.55)';
    if (val > 0) return 'rgba(16,185,129,0.25)';
    if (val > -1) return 'rgba(239,68,68,0.25)';
    if (val > -3) return 'rgba(239,68,68,0.55)';
    return 'rgba(239,68,68,0.85)';
  };

  const getValue = (r) => metric === 'changePct' ? r.changePct : metric === 'iv' ? r.iv : (r.volume / 100000);
  const getSize = (r) => Math.max(40, Math.min(90, Math.sqrt(r.volume / 10000) * 8));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Controls */}
      <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-heading)' }}>🗺️ Market Heatmap</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {[{ id: 'changePct', label: 'Change%' }, { id: 'iv', label: 'IV' }, { id: 'volume', label: 'Volume' }].map(m => (
            <button key={m.id} className={`sector-pill${metric === m.id ? ' active' : ''}`}
              onClick={() => setMetric(m.id)} style={{ fontSize: 9, padding: '2px 6px' }}>{m.label}</button>
          ))}
          <div className="separator" style={{ height: 12, margin: '0 4px' }} />
          {[{ id: 'sector', label: 'Sector' }, { id: 'direction', label: 'Direction' }].map(g => (
            <button key={g.id} className={`sector-pill${groupBy === g.id ? ' active' : ''}`}
              onClick={() => setGroupBy(g.id)} style={{ fontSize: 9, padding: '2px 6px' }}>{g.label}</button>
          ))}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: 6 }}>
        {Object.entries(groups).map(([sector, stocks]) => (
          <div key={sector} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: SECTOR_COLORS[sector] || 'var(--text-heading)', padding: '2px 4px', marginBottom: 3 }}>
              {sector} ({stocks.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {stocks.map(r => {
                const val = getValue(r);
                const size = getSize(r);
                return (
                  <div key={r.symbol} style={{
                    width: size, height: size, background: getColor(r.changePct),
                    borderRadius: 4, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.15s',
                    position: 'relative', overflow: 'hidden'
                  }}
                    title={`${r.symbol}: ${r.changePct.toFixed(2)}% | IV: ${r.iv.toFixed(1)} | Vol: ${(r.volume/100000).toFixed(1)}L`}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{ fontSize: size > 55 ? 9 : 7, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      {r.symbol.slice(0, size > 55 ? 8 : 5)}
                    </div>
                    {size > 50 && (
                      <div style={{ fontSize: 8, fontWeight: 600, color: '#fff', opacity: 0.9, fontFamily: 'var(--font-mono)' }}>
                        {metric === 'changePct' ? `${val >= 0 ? '+' : ''}${val.toFixed(1)}%` : metric === 'iv' ? `${val.toFixed(0)}` : `${val.toFixed(0)}L`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
