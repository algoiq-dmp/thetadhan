import { useState, useMemo } from 'react';
import useMarketStore from '../store/useMarketStore';

// Compute pivot points from mock data
function computePivot(high, low, close) {
  const pp = (high + low + close) / 3;
  return {
    pp: +pp.toFixed(2),
    s1: +(2 * pp - high).toFixed(2),
    r1: +(2 * pp - low).toFixed(2),
    s2: +(pp - (high - low)).toFixed(2),
    r2: +(pp + (high - low)).toFixed(2),
  };
}

// Mock SuperTrend (simple proxy using 30SMA)
function isSuperTrendAbove(row) { return row.ltp > row.sma30; }

const SCANNER_TABS = ['Near Highs', 'Near Pivots', 'Trend', 'Volume'];

export default function ScannerSidebar({ onClose }) {
  const universe = useMarketStore(s => s.universe);
  const openOptionChain = useMarketStore(s => s.openOptionChain);
  const openChart = useMarketStore(s => s.openChart);
  const [tab, setTab] = useState('Near Highs');
  const [threshold, setThreshold] = useState(0.5);

  const results = useMemo(() => {
    const t = threshold / 100;

    const nearHigh = universe.filter(r => r.ltp > r.todayHigh * (1 - t) && r.ltp <= r.todayHigh)
      .map(r => ({ ...r, gap: (((r.todayHigh - r.ltp) / r.ltp) * 100).toFixed(2), tag: 'Near High' }))
      .sort((a, b) => a.gap - b.gap).slice(0, 20);

    const nearLow = universe.filter(r => r.ltp < r.todayLow * (1 + t) && r.ltp >= r.todayLow)
      .map(r => ({ ...r, gap: (((r.ltp - r.todayLow) / r.ltp) * 100).toFixed(2), tag: 'Near Low' }))
      .sort((a, b) => a.gap - b.gap).slice(0, 20);

    const pivotResults = [];
    universe.forEach(r => {
      const pv = computePivot(r.todayHigh, r.todayLow, r.ltp);
      const checks = [
        { level: 'PP', val: pv.pp }, { level: 'S1', val: pv.s1 }, { level: 'R1', val: pv.r1 },
        { level: 'S2', val: pv.s2 }, { level: 'R2', val: pv.r2 },
      ];
      for (const c of checks) {
        const dist = Math.abs(r.ltp - c.val) / r.ltp;
        if (dist < 0.003) {
          pivotResults.push({ ...r, level: c.level, levelVal: c.val, dist: (dist * 100).toFixed(2) });
          break;
        }
      }
    });

    const aboveST = universe.filter(isSuperTrendAbove);
    const belowST = universe.filter(r => !isSuperTrendAbove(r));
    const strongUp = universe.filter(r => r.changePct > 3).sort((a, b) => b.changePct - a.changePct).slice(0, 10);
    const strongDown = universe.filter(r => r.changePct < -3).sort((a, b) => a.changePct - b.changePct).slice(0, 10);

    const volSpike = universe.filter(r => r.volume > 3000000)
      .sort((a, b) => b.volume - a.volume).slice(0, 15);

    return { nearHigh, nearLow, pivotResults, aboveST, belowST, strongUp, strongDown, volSpike };
  }, [universe, threshold]);

  const renderRow = (r, extra) => (
    <tr key={r.symbol + (extra || '')} style={{ cursor: 'pointer' }} onClick={() => openOptionChain(r.symbol)}>
      <td style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, textAlign: 'left', fontSize: 11, padding: '4px 6px' }}>{r.symbol}</td>
      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right', padding: '4px 6px', color: r.changePct >= 0 ? 'var(--green-text)' : 'var(--red-text)' }}>
        {r.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </td>
      <td style={{ fontSize: 10, textAlign: 'right', padding: '4px 6px' }}>{extra}</td>
    </tr>
  );

  return (
    <div className="scanner-sidebar">
      <div className="scanner-header">
        <span style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>🔍 Live Scanner</span>
        <button className="modal-close" onClick={onClose} style={{ width: 24, height: 24, fontSize: 13 }}>✕</button>
      </div>

      <div className="scanner-tabs">
        {SCANNER_TABS.map(t => (
          <button key={t} className={`scanner-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div className="scanner-body">
        {tab === 'Near Highs' && (
          <>
            <div className="scanner-section-title">🔴 Near Today's High ({results.nearHigh.length})</div>
            <table className="scanner-table">
              <tbody>{results.nearHigh.map(r => renderRow(r, `${r.gap}%`))}</tbody>
            </table>
            <div className="scanner-section-title" style={{ marginTop: 12 }}>🟢 Near Today's Low ({results.nearLow.length})</div>
            <table className="scanner-table">
              <tbody>{results.nearLow.map(r => renderRow(r, `${r.gap}%`))}</tbody>
            </table>
          </>
        )}

        {tab === 'Near Pivots' && (
          <>
            <div className="scanner-section-title">📊 Near Pivot Points ({results.pivotResults.length})</div>
            <table className="scanner-table">
              <thead><tr><th style={{ textAlign: 'left', padding: '3px 6px', fontSize: 9 }}>SYM</th><th style={{ textAlign: 'right', padding: '3px 6px', fontSize: 9 }}>LTP</th><th style={{ textAlign: 'right', padding: '3px 6px', fontSize: 9 }}>LEVEL</th></tr></thead>
              <tbody>
                {results.pivotResults.map(r => (
                  <tr key={r.symbol} onClick={() => openOptionChain(r.symbol)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, textAlign: 'left', fontSize: 11, padding: '4px 6px' }}>{r.symbol}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right', padding: '4px 6px' }}>{r.ltp.toFixed(2)}</td>
                    <td style={{ fontSize: 10, textAlign: 'right', padding: '4px 6px', fontWeight: 700, color: r.level.startsWith('R') ? 'var(--red-text)' : r.level.startsWith('S') ? 'var(--green-text)' : 'var(--yellow)' }}>
                      {r.level} ({r.levelVal})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {tab === 'Trend' && (
          <>
            <div className="scanner-section-title">📈 Above SuperTrend: <span style={{ color: 'var(--green-text)', fontWeight: 700 }}>{results.aboveST.length}</span></div>
            <div className="scanner-section-title">📉 Below SuperTrend: <span style={{ color: 'var(--red-text)', fontWeight: 700 }}>{results.belowST.length}</span></div>
            <div className="scanner-section-title" style={{ marginTop: 12 }}>🚀 Strong Gainers {'>'} 3%</div>
            <table className="scanner-table">
              <tbody>{results.strongUp.map(r => renderRow(r, <span className="change-badge positive">+{r.changePct.toFixed(1)}%</span>))}</tbody>
            </table>
            <div className="scanner-section-title" style={{ marginTop: 12 }}>💀 Strong Losers {'<'} -3%</div>
            <table className="scanner-table">
              <tbody>{results.strongDown.map(r => renderRow(r, <span className="change-badge negative">{r.changePct.toFixed(1)}%</span>))}</tbody>
            </table>
          </>
        )}

        {tab === 'Volume' && (
          <>
            <div className="scanner-section-title">📊 Volume Leaders</div>
            <table className="scanner-table">
              <thead><tr><th style={{ textAlign: 'left', padding: '3px 6px', fontSize: 9 }}>SYM</th><th style={{ textAlign: 'right', padding: '3px 6px', fontSize: 9 }}>LTP</th><th style={{ textAlign: 'right', padding: '3px 6px', fontSize: 9 }}>VOL</th></tr></thead>
              <tbody>
                {results.volSpike.map(r => (
                  <tr key={r.symbol} onClick={() => openOptionChain(r.symbol)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, textAlign: 'left', fontSize: 11, padding: '4px 6px' }}>{r.symbol}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right', padding: '4px 6px', color: r.changePct >= 0 ? 'var(--green-text)' : 'var(--red-text)' }}>{r.ltp.toFixed(2)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textAlign: 'right', padding: '4px 6px' }}>{(r.volume / 100000).toFixed(1)}L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <div className="scanner-footer">
        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Scan: {universe.length} syms • 1s interval</span>
        <span style={{ fontSize: 9, color: 'var(--green)' }}>● AUTO</span>
      </div>
    </div>
  );
}
