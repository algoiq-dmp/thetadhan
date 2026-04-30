import { useState, useEffect, useRef } from 'react';
import useMarketStore from '../store/useMarketStore';
import engineConnector from '../services/engineConnector';
import CandlestickChart from '../components/CandlestickChart';

export default function ScalperView() {
  const universe = useMarketStore(s => s.universe);
  const [symbol, setSymbol] = useState('NIFTY');
  const [timeframe, setTimeframe] = useState('1m');
  const [depthData, setDepthData] = useState(null);
  const [depthLoading, setDepthLoading] = useState(false);
  const depthTimer = useRef(null);

  const row = universe.find(r => r.symbol === symbol) || universe[0] || {};
  const ltp = row.ltp || 0;

  // Poll full quote (with depth) every 2 seconds for selected symbol
  useEffect(() => {
    if (!row.token || !row.exchange_segment) return;

    const fetchDepth = async () => {
      try {
        const seg = row.exchange_segment;
        const rawData = await engineConnector.getFullQuote({ [seg]: [Number(row.token)] });
        // Unwrap: rawData = { data: { "NSE_EQ": { "2885": {...} } }, status: "success" }
        const segData = rawData?.data || rawData;
        if (segData && segData[seg] && segData[seg][String(row.token)]) {
          setDepthData(segData[seg][String(row.token)]);
        }
      } catch { /* silently fail */ }
    };

    setDepthLoading(true);
    fetchDepth().then(() => setDepthLoading(false));
    depthTimer.current = setInterval(fetchDepth, 2000);
    return () => clearInterval(depthTimer.current);
  }, [row.token, row.exchange_segment]);

  // Build depth array from Dhan response
  const depth = depthData?.depth ? Array.from({ length: 5 }, (_, i) => ({
    bidQty: depthData.depth.buy?.[i]?.quantity || 0,
    bidPrice: depthData.depth.buy?.[i]?.price || 0,
    bidOrders: depthData.depth.buy?.[i]?.orders || 0,
    askPrice: depthData.depth.sell?.[i]?.price || 0,
    askQty: depthData.depth.sell?.[i]?.quantity || 0,
    askOrders: depthData.depth.sell?.[i]?.orders || 0,
  })) : Array.from({ length: 5 }, (_, i) => ({
    bidQty: 0, bidPrice: (ltp - (i + 1) * (ltp || 1) * 0.001).toFixed(2),
    askPrice: (ltp + (i + 1) * (ltp || 1) * 0.001).toFixed(2), askQty: 0,
    bidOrders: 0, askOrders: 0,
  }));

  const depthAvailable = !!depthData?.depth;
  const maxDepthQty = Math.max(1, ...depth.map(d => Math.max(d.bidQty, d.askQty)));

  // Extra data from full quote
  const oi = depthData?.oi || row.oi || 0;
  const volume = depthData?.volume || row.volume || 0;
  const buyQty = depthData?.buy_quantity || 0;
  const sellQty = depthData?.sell_quantity || 0;

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* LEFT: Dual Charts */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
        {/* Symbol Bar */}
        <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <select value={symbol} onChange={e => setSymbol(e.target.value)}
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 12, padding: '3px 6px', fontWeight: 700, fontFamily: 'inherit' }}>
            {universe.slice(0, 20).map(s => <option key={s.symbol} value={s.symbol}>{s.symbol}</option>)}
          </select>
          <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)', color: (row.changePct || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span style={{ fontSize: 10, color: (row.changePct || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {(row.changePct || 0) >= 0 ? '▲' : '▼'} {(row.change || 0).toFixed(2)} ({(row.changePct || 0).toFixed(2)}%)
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
            {['1m','3m','5m','15m'].map(tf => (
              <button key={tf} className={`sector-pill${timeframe === tf ? ' active' : ''}`}
                onClick={() => setTimeframe(tf)} style={{ fontSize: 9, padding: '2px 6px' }}>{tf}</button>
            ))}
          </div>
        </div>

        {/* Chart 1: Main Candlestick */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <CandlestickChart symbol={symbol} height={220} chartType="candlestick" compact={true} />
        </div>

        {/* Chart 2: Heikin Ashi */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <CandlestickChart symbol={symbol} height={220} chartType="heikinashi" compact={true} />
        </div>
      </div>

      {/* RIGHT: Depth + Quick Orders */}
      <div style={{ width: 280, display: 'flex', flexDirection: 'column' }}>
        {/* Market Depth */}
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>
            Market Depth
            <span style={{ fontSize: 8, color: depthAvailable ? '#10b981' : 'var(--orange)', fontWeight: 600, marginLeft: 6 }}>
              {depthAvailable ? '● LIVE (Dhan REST)' : depthLoading ? '⏳ Loading...' : '○ Waiting'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto 1fr', gap: '2px 0', fontSize: 10 }}>
            <div style={{ textAlign: 'right', fontSize: 8, color: 'var(--text-muted)', paddingBottom: 2 }}>BID QTY</div>
            <div style={{ textAlign: 'right', fontSize: 8, color: 'var(--text-muted)', paddingBottom: 2, paddingLeft: 8 }}>BID</div>
            <div style={{ width: 12 }} />
            <div style={{ fontSize: 8, color: 'var(--text-muted)', paddingBottom: 2, paddingRight: 8 }}>ASK</div>
            <div style={{ fontSize: 8, color: 'var(--text-muted)', paddingBottom: 2 }}>ASK QTY</div>
            {depth.map((d, i) => (
              <div key={i} style={{ display: 'contents' }}>
                <div style={{ textAlign: 'right', position: 'relative', padding: '2px 4px' }}>
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${(d.bidQty / maxDepthQty) * 100}%`, background: 'rgba(38,166,154,0.15)', borderRadius: '2px 0 0 2px' }} />
                  <span style={{ position: 'relative', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--cyan)' }}>{d.bidQty}</span>
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--green)', padding: '2px 8px' }}>
                  {typeof d.bidPrice === 'number' ? d.bidPrice.toFixed(2) : d.bidPrice}
                </div>
                <div style={{ width: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 1, height: 12, background: 'var(--border)' }} />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--red)', padding: '2px 8px' }}>
                  {typeof d.askPrice === 'number' ? d.askPrice.toFixed(2) : d.askPrice}
                </div>
                <div style={{ position: 'relative', padding: '2px 4px' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(d.askQty / maxDepthQty) * 100}%`, background: 'rgba(239,83,80,0.15)', borderRadius: '0 2px 2px 0' }} />
                  <span style={{ position: 'relative', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--cyan)' }}>{d.askQty}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Buy/Sell Pressure Bar */}
          {(buyQty > 0 || sellQty > 0) && (
            <div style={{ marginTop: 6, display: 'flex', gap: 4, alignItems: 'center', fontSize: 9 }}>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>B: {buyQty.toLocaleString()}</span>
              <div style={{ flex: 1, height: 4, background: 'rgba(239,83,80,0.2)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(buyQty / (buyQty + sellQty)) * 100}%`, background: 'var(--green)', borderRadius: 2 }} />
              </div>
              <span style={{ color: 'var(--red)', fontWeight: 700 }}>S: {sellQty.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* 1-Tap Orders */}
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>⚡ Quick Scalp</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[1, 2, 5, 10].map(lots => (
              <button key={lots} className="btn-buy" style={{ padding: '8px 4px', fontSize: 10, borderRadius: 4 }}>
                BUY {lots}× ({lots * (row.lotSize || 1)})
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 4 }}>
            {[1, 2, 5, 10].map(lots => (
              <button key={lots} className="btn-sell" style={{ padding: '8px 4px', fontSize: 10, borderRadius: 4 }}>
                SELL {lots}× ({lots * (row.lotSize || 1)})
              </button>
            ))}
          </div>
        </div>

        {/* Tick Stats */}
        <div style={{ padding: '8px 10px', flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>Tick Stats</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', fontSize: 10 }}>
            <div><span style={{ color: 'var(--text-muted)' }}>High</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{(row.todayHigh || 0).toFixed(2)}</div></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Low</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{(row.todayLow || 0).toFixed(2)}</div></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Volume</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{((volume || 0) / 100000).toFixed(1)}L</div></div>
            <div><span style={{ color: 'var(--text-muted)' }}>OI</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{((oi || 0) / 100000).toFixed(1)}L</div></div>
            <div><span style={{ color: 'var(--text-muted)' }}>VWAP</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: ltp > ((row.todayHigh || 0) + (row.todayLow || 0)) / 2 ? 'var(--green)' : 'var(--red)' }}>{(((row.todayHigh || 0) + (row.todayLow || 0)) / 2).toFixed(2)}</div></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Spread</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{depth[0] ? (((typeof depth[0].askPrice === 'number' ? depth[0].askPrice : parseFloat(depth[0].askPrice)) - (typeof depth[0].bidPrice === 'number' ? depth[0].bidPrice : parseFloat(depth[0].bidPrice))) || 0).toFixed(2) : '—'}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
