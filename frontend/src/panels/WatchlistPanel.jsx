import { useState } from 'react';
import useMarketStore from '../store/useMarketStore';
import AddScripDialog from '../components/AddScripDialog';

export default function WatchlistPanel() {
  const universe = useMarketStore(s => s.universe);
  const openChart = useMarketStore(s => s.openChart);
  const openOptionChain = useMarketStore(s => s.openOptionChain);
  const watchlists = useMarketStore(s => s.watchlists);
  const activeWatchlist = useMarketStore(s => s.activeWatchlist);
  const setActiveWatchlist = useMarketStore(s => s.setActiveWatchlist);
  const [showAdd, setShowAdd] = useState(false);

  const wlKeys = Object.keys(watchlists);
  const activeListSymbols = watchlists[activeWatchlist] || [];
  const rows = activeListSymbols.map(s => universe.find(r => r.symbol === s)).filter(Boolean);

  // Mock live snapshot data
  const selectedSym = rows[0];
  const todayLow = selectedSym ? selectedSym.todayLow : 0;
  const todayHigh = selectedSym ? selectedSym.todayHigh : 0;
  const ltp = selectedSym ? selectedSym.ltp : 0;
  const pctPos = todayHigh > todayLow ? ((ltp - todayLow) / (todayHigh - todayLow)) * 100 : 50;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Watchlist Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', overflowX: 'auto' }}>
        {wlKeys.map((wlName, i) => (
          <button key={wlName}
            className={`panel-tab${activeWatchlist === wlName ? ' active' : ''}`}
            onClick={() => setActiveWatchlist(wlName)}
            style={{ flex: 1, fontSize: 10, whiteSpace: 'nowrap', padding: '4px 8px' }}
          >{i + 1}</button>
        ))}
        <button className="panel-tab" onClick={() => setShowAdd(true)} style={{ flex: 'none', padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>+</button>
      </div>

      {/* Header */}
      <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-heading)' }}>{activeWatchlist}</span>
        <button onClick={() => setShowAdd(true)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px', fontSize: 10, color: 'var(--cyan)', cursor: 'pointer', fontWeight: 600 }}>+ Add</button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Symbol</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-muted)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>LTP</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-muted)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Chg</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-muted)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Chg%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.symbol} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                onClick={() => openOptionChain(r.symbol)}
                onDoubleClick={() => openChart(r.symbol)}>
                <td style={{ padding: '6px 8px', fontWeight: 600, color: 'var(--cyan)', fontSize: 12 }}>{r.symbol}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{(r.ltp || 0).toFixed(2)}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: (r.change || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {(r.change || 0) >= 0 ? '+' : ''}{(r.change || 0).toFixed(2)}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                  <span className={`change-badge ${(r.changePct || 0) >= 0 ? 'positive' : 'negative'}`}>
                    {(r.changePct || 0) >= 0 ? '+' : ''}{(r.changePct || 0).toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Live Snapshot */}
      {selectedSym && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 2 }}>{selectedSym.symbol}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{(selectedSym.ltp || 0).toFixed(2)} <span style={{ color: (selectedSym.change || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>{(selectedSym.change || 0) >= 0 ? '+' : ''}{(selectedSym.change || 0).toFixed(2)} ({(selectedSym.changePct || 0).toFixed(2)}%)</span> NSE</div>

          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>Live Snapshot</div>

          {/* Today Range Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 55 }}>Today's low</span>
            <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pctPos}%`, background: 'linear-gradient(90deg, var(--green), var(--cyan))', borderRadius: 3 }} />
              <div style={{ position: 'absolute', left: `${pctPos}%`, top: -2, width: 4, height: 10, background: 'var(--text-heading)', borderRadius: 2, transform: 'translateX(-50%)' }} />
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 55, textAlign: 'right' }}>Today's high</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-heading)', marginBottom: 8 }}>
            <span>{todayLow.toFixed(2)}</span>
            <span>{todayHigh.toFixed(2)}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Open</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{((selectedSym.ltp || 0) - (selectedSym.change || 0)).toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Prev. close</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{((selectedSym.ltp || 0) - (selectedSym.change || 0)).toFixed(2)}</span></div>
          </div>
        </div>
      )}
      {showAdd && <AddScripDialog position={0} onAdd={() => {}} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
