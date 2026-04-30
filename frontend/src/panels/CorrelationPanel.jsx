import { useState, useMemo } from 'react';

const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN', 'ICICIBANK'];

// Deterministic pseudo-correlation based on symbol pair
function getCorrelation(a, b) {
  if (a === b) return 1.0;
  const seed = (a + b).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const raw = ((Math.sin(seed) * 10000) % 1);
  // Indices correlate strongly, stocks have varied correlation
  const isIdx = (s) => ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'].includes(s);
  if (isIdx(a) && isIdx(b)) return 0.75 + Math.abs(raw) * 0.2;
  if (isIdx(a) || isIdx(b)) return 0.3 + raw * 0.35;
  return raw * 0.7;
}

function corrColor(v) {
  if (v >= 0.8) return '#10b981';
  if (v >= 0.5) return '#06b6d4';
  if (v >= 0.2) return '#3b82f6';
  if (v >= -0.2) return '#64748b';
  if (v >= -0.5) return '#f59e0b';
  return '#ef4444';
}

function corrBg(v) {
  const abs = Math.abs(v);
  if (v >= 0.5) return `rgba(16,185,129,${abs * 0.3})`;
  if (v >= 0) return `rgba(6,182,212,${abs * 0.3})`;
  if (v >= -0.5) return `rgba(245,158,11,${abs * 0.3})`;
  return `rgba(239,68,68,${abs * 0.3})`;
}

export default function CorrelationPanel() {
  const [period, setPeriod] = useState('30d');
  const [hover, setHover] = useState(null);

  const matrix = useMemo(() => {
    return SYMBOLS.map(a => SYMBOLS.map(b => {
      const base = getCorrelation(a, b);
      const periodMod = period === '7d' ? 0.05 : period === '90d' ? -0.03 : 0;
      return Math.max(-1, Math.min(1, base + periodMod));
    }));
  }, [period]);

  const shortName = (s) => s.length > 5 ? s.slice(0, 4) : s;

  return (
    <div style={{ padding: 8, fontSize: 11, color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>CORRELATION MATRIX</div>
        <div style={{ display: 'flex', gap: 3 }}>
          {['7d', '30d', '90d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '2px 8px', borderRadius: 4, border: 'none', fontSize: 9, fontWeight: 600, cursor: 'pointer',
              background: period === p ? 'rgba(6,182,212,0.15)' : 'transparent',
              color: period === p ? '#06b6d4' : '#475569',
            }}>{p}</button>
          ))}
        </div>
      </div>

      {/* Matrix Grid */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `40px repeat(${SYMBOLS.length}, 1fr)`, gap: 1 }}>
          {/* Header row */}
          <div />
          {SYMBOLS.map(s => (
            <div key={s} style={{
              fontSize: 7, fontWeight: 700, color: '#94a3b8', textAlign: 'center', padding: '3px 0',
              writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 40,
            }}>{shortName(s)}</div>
          ))}

          {/* Data rows */}
          {SYMBOLS.map((row, ri) => (
            <>
              <div key={`l-${ri}`} style={{ fontSize: 7, fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4 }}>
                {shortName(row)}
              </div>
              {SYMBOLS.map((col, ci) => {
                const v = matrix[ri][ci];
                const isHover = hover && ((hover.r === ri && hover.c === ci) || (hover.r === ci && hover.c === ri));
                return (
                  <div key={`${ri}-${ci}`}
                    onMouseEnter={() => setHover({ r: ri, c: ci })}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      background: corrBg(v), borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: ri === ci ? 7 : 8, fontWeight: 700, color: corrColor(v), cursor: 'pointer',
                      height: 22, border: isHover ? '1px solid #06b6d4' : '1px solid transparent',
                      transition: 'border 0.15s',
                    }}>
                    {ri === ci ? '1.0' : v.toFixed(2)}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Hover Info */}
      {hover && hover.r !== hover.c && (
        <div style={{
          marginTop: 8, padding: '6px 10px', borderRadius: 6,
          background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)',
          fontSize: 10, color: '#94a3b8',
        }}>
          <strong style={{ color: '#f8fafc' }}>{SYMBOLS[hover.r]}</strong> ↔ <strong style={{ color: '#f8fafc' }}>{SYMBOLS[hover.c]}</strong>:
          <span style={{ color: corrColor(matrix[hover.r][hover.c]), fontWeight: 700, marginLeft: 4 }}>
            {matrix[hover.r][hover.c].toFixed(3)}
          </span>
          <span style={{ marginLeft: 8, fontSize: 9 }}>
            {matrix[hover.r][hover.c] > 0.7 ? '🟢 Strong +' : matrix[hover.r][hover.c] > 0.3 ? '🔵 Moderate +' : matrix[hover.r][hover.c] > -0.3 ? '⚪ Weak' : '🔴 Negative'}
          </span>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8, fontSize: 8, color: '#475569' }}>
        <span><span style={{ color: '#ef4444' }}>●</span> -1.0</span>
        <span><span style={{ color: '#f59e0b' }}>●</span> -0.5</span>
        <span><span style={{ color: '#64748b' }}>●</span> 0</span>
        <span><span style={{ color: '#06b6d4' }}>●</span> +0.5</span>
        <span><span style={{ color: '#10b981' }}>●</span> +1.0</span>
      </div>
    </div>
  );
}
