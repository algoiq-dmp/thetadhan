import { useState, useEffect } from 'react';
import useMarketStore from '../store/useMarketStore';
import engineConnector from '../services/engineConnector';

export default function StocksView() {
  const universe = useMarketStore(s => s.universe);
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState('changePct');
  const [sortDir, setSortDir] = useState('desc');
  const [intradayData, setIntradayData] = useState(null);

  const stockSymbols = universe.filter(r => !['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'].includes(r.symbol));
  let sorted = [...stockSymbols];
  sorted.sort((a, b) => sortDir === 'desc' ? (b[sortBy] || 0) - (a[sortBy] || 0) : (a[sortBy] || 0) - (b[sortBy] || 0));
  const top30 = sorted.slice(0, 30);
  const sel = selected || top30[0];

  // Fetch intraday data for selected symbol
  useEffect(() => {
    if (!sel) return;
    const fetchIntraday = async () => {
      try {
        const data = await engineConnector.getIntradayOHLC({
          securityId: sel.token,
          exchangeSegment: sel.exchange_segment || 'NSE_EQ',
          instrument: sel.type || 'EQUITY'
        });
        // Unwrap: data = { data: { open:[], close:[], timestamp:[] }, status } or flat
        const raw = data?.close ? data : (data?.data || data);
        if (raw?.close?.length > 2) {
          setIntradayData(raw);
        } else {
          setIntradayData(null);
        }
      } catch { setIntradayData(null); }
    };
    fetchIntraday();
  }, [sel?.symbol]);

  // Chart points from live data or derived from LTP
  const pts = intradayData?.close?.length > 5
    ? (() => {
        const closes = intradayData.close;
        const step = Math.max(1, Math.floor(closes.length / 30));
        const sampled = [];
        for (let i = 0; i < closes.length; i += step) sampled.push(closes[i]);
        return sampled;
      })()
    : sel ? Array.from({ length: 30 }, (_, i) => {
        const base = (sel.ltp || 1) * (1 + ((sel.changePct || 0) / 100) * ((i - 15) / 15));
        return base;
      }) : [];

  const pMin = pts.length > 0 ? Math.min(...pts) - (sel?.ltp || 1) * 0.002 : 0;
  const pMax = pts.length > 0 ? Math.max(...pts) + (sel?.ltp || 1) * 0.002 : 1;

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* LEFT: Stock Scanner List */}
      <div style={{ width: 320, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-heading)' }}>📈 Stock Scanner</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ marginLeft: 'auto', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 10, padding: '2px 6px', fontFamily: 'inherit' }}>
            <option value="changePct">% Change</option>
            <option value="volume">Volume</option>
            <option value="oi">OI</option>
          </select>
          <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 10, padding: '2px 6px' }}>
            {sortDir === 'desc' ? '↓' : '↑'}
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {top30.map(r => (
            <div key={r.symbol} onClick={() => setSelected(r)}
              style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                background: sel?.symbol === r.symbol ? 'var(--bg-row-selected)' : 'transparent',
                transition: 'background 0.1s' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-heading)' }}>{r.symbol}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{r.sector} · Lot {r.lotSize}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: (r.changePct || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {(r.ltp || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: (r.changePct || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {(r.changePct || 0) >= 0 ? '+' : ''}{(r.changePct || 0).toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER: Chart */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {sel && <>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>{sel.symbol}</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: (sel.changePct || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {(sel.ltp || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: 11, color: (sel.changePct || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {(sel.changePct || 0) >= 0 ? '▲' : '▼'} {(sel.change || 0).toFixed(2)} ({(sel.changePct || 0).toFixed(2)}%)
            </span>
            {intradayData && <span style={{ fontSize: 8, color: 'var(--cyan)', marginLeft: 4 }}>● LIVE</span>}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {['1m', '5m', '15m', '1H', '1D', '1W'].map(tf => (
                <button key={tf} className={`sector-pill${tf === '5m' ? ' active' : ''}`} style={{ fontSize: 9, padding: '2px 6px' }}>{tf}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, padding: 16, position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 600 300" preserveAspectRatio="none">
              {[0.25, 0.5, 0.75].map(f => (
                <line key={f} x1="0" y1={300 * f} x2="600" y2={300 * f} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,4" />
              ))}
              {(() => {
                const range = pMax - pMin || 1;
                const path = pts.map((p, i) => `${(i / (pts.length - 1)) * 600},${300 - ((p - pMin) / range) * 280}`).join(' ');
                const color = (sel.changePct || 0) >= 0 ? 'var(--green)' : 'var(--red)';
                return <>
                  <polygon points={`${path} 600,300 0,300`} fill={(sel.changePct || 0) >= 0 ? 'rgba(38,166,154,0.1)' : 'rgba(239,83,80,0.1)'} />
                  <polyline points={path} fill="none" stroke={color} strokeWidth="2.5" />
                  <circle cx="600" cy={300 - ((pts[pts.length-1] - pMin) / range) * 280} r="5" fill={color} />
                </>;
              })()}
            </svg>
          </div>
          {/* Live Snapshot */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-panel)', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, fontSize: 11 }}>
            <div><span style={{ color: 'var(--text-muted)', fontSize: 9 }}>HIGH</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{(sel.todayHigh || 0).toFixed(2)}</div></div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: 9 }}>LOW</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{(sel.todayLow || 0).toFixed(2)}</div></div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: 9 }}>VOL</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{((sel.volume || 0) / 100000).toFixed(1)}L</div></div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: 9 }}>OI</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{((sel.oi || 0) / 100000).toFixed(1)}L</div></div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: 9 }}>PREV CL</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{((sel.ltp || 0) - (sel.change || 0)).toFixed(2)}</div></div>
            <div><span style={{ color: 'var(--text-muted)', fontSize: 9 }}>LOT</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{sel.lotSize || '—'}</div></div>
          </div>
        </>}
      </div>
    </div>
  );
}
