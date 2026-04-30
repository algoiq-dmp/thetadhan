import { useState, useEffect } from 'react';
import useMarketStore from '../store/useMarketStore';
import engineConnector from '../services/engineConnector';

function MiniChart({ item, intradayData }) {
  const pts = [];
  if (intradayData?.close && intradayData.close.length > 5) {
    // Use real intraday data, sample last 20 points
    const closes = intradayData.close;
    const step = Math.max(1, Math.floor(closes.length / 20));
    for (let i = 0; i < closes.length; i += step) pts.push(closes[i]);
    if (pts.length < 2) pts.push(closes[closes.length - 1]);
  } else {
    // Fallback: derive from LTP + change for a single-line display
    const base = item.ltp || 1;
    const chg = item.changePct || 0;
    for (let i = 0; i < 20; i++) {
      pts.push(base * (1 + (chg / 100) * ((i - 10) / 10)));
    }
  }

  const min = Math.min(...pts) - (item.ltp || 1) * 0.002;
  const max = Math.max(...pts) + (item.ltp || 1) * 0.002;
  const range = max - min || 1;
  const w = 380, h = 180;
  const path = pts.map((p, i) => `${(i / (pts.length - 1)) * w},${h - ((p - min) / range) * (h - 20)}`).join(' ');
  const color = (item.changePct || 0) >= 0 ? 'var(--green)' : 'var(--red)';

  // Volume bars from intraday data
  const volBars = intradayData?.volume?.slice(-20) || [];

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-panel)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-heading)' }}>🔍 {item.symbol}</span>
          <span style={{ fontSize: 10, color: (item.changePct || 0) >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>
            {(item.changePct || 0) >= 0 ? '+' : ''}{(item.change || 0).toFixed(2)} ({(item.changePct || 0).toFixed(2)}%)
          </span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>NSE</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, padding: '4px 12px', alignItems: 'center', fontSize: 10 }}>
        {['1D', '5D', '1M', '3M'].map(tf => (
          <button key={tf} className="sector-pill" style={{ fontSize: 9, padding: '1px 6px' }}>{tf}</button>
        ))}
        <div className="separator" style={{ height: 12 }} />
        {['1m', '5m', '10m'].map(tf => (
          <button key={tf} className={`sector-pill${tf === '5m' ? ' active' : ''}`} style={{ fontSize: 9, padding: '1px 6px' }}>{tf}</button>
        ))}
      </div>

      <div style={{ flex: 1, padding: '8px 12px', position: 'relative', minHeight: 160 }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${item.symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.15" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map(f => (
            <line key={f} x1="0" y1={h * f} x2={w} y2={h * f} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,4" />
          ))}
          <polygon points={`${path} ${w},${h} 0,${h}`} fill={`url(#grad-${item.symbol})`} />
          <polyline points={path} fill="none" stroke={color} strokeWidth="2" />
          <circle cx={w} cy={h - ((pts[pts.length - 1] - min) / range) * (h - 20)} r="4" fill={color} />
          <rect x={w - 55} y={h - ((pts[pts.length - 1] - min) / range) * (h - 20) - 10} width="55" height="16" rx="3" fill={color} />
          <text x={w - 52} y={h - ((pts[pts.length - 1] - min) / range) * (h - 20) + 2} fill="#fff" fontSize="9" fontWeight="600" fontFamily="JetBrains Mono">{(item.ltp || 0).toFixed(2)}</text>
        </svg>
      </div>

      {/* Volume bars from real data */}
      <div style={{ height: 24, padding: '0 12px', display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        {(volBars.length > 0 ? volBars : Array(20).fill(0)).map((v, i) => {
          const maxV = Math.max(1, ...volBars);
          return <div key={i} style={{ flex: 1, height: Math.max(2, (v / maxV) * 20), background: i % 2 === 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)', borderRadius: '1px 1px 0 0' }} />;
        })}
      </div>
    </div>
  );
}

export default function MarketWatchView() {
  const universe = useMarketStore(s => s.universe);
  const watchlists = useMarketStore(s => s.watchlists);
  const activeWatchlist = useMarketStore(s => s.activeWatchlist);
  const [intradayMap, setIntradayMap] = useState({});

  // Get first 6 symbols from active watchlist
  const wlSymbols = (watchlists[activeWatchlist] || []).slice(0, 6);
  const chartItems = wlSymbols.map(s => universe.find(r => r.symbol === s)).filter(Boolean);

  // Fetch intraday data for each symbol
  useEffect(() => {
    const fetchAll = async () => {
      const results = {};
      for (const item of chartItems) {
        try {
          const data = await engineConnector.getIntradayOHLC({
            securityId: item.token,
            exchangeSegment: item.exchange_segment || 'NSE_EQ',
            instrument: item.type || 'EQUITY'
          });
          // Unwrap: data may be flat { open:[], close:[], timestamp:[] } or wrapped
          const raw = data?.close ? data : (data?.data || data);
          if (raw?.close) results[item.symbol] = raw;
        } catch {}
      }
      if (Object.keys(results).length > 0) setIntradayMap(results);
    };
    if (chartItems.length > 0) fetchAll();
  }, [chartItems.length]);

  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: 4, padding: 4, overflow: 'hidden' }}>
      {chartItems.length > 0 ? chartItems.map(item => (
        <MiniChart key={item.symbol} item={item} intradayData={intradayMap[item.symbol]} />
      )) : (
        <div style={{ gridColumn: '1 / -1', gridRow: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📈</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Add symbols to your watchlist</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Charts will display live intraday data from Dhan</div>
          </div>
        </div>
      )}
    </div>
  );
}
