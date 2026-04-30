import { useState, useEffect, useRef } from 'react';
import useMarketStore from '../store/useMarketStore';
import engineConnector from '../services/engineConnector';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';

const IST_OFFSET = 19800; // +5:30 in seconds

function MiniCandleChart({ item, intradayData }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [chartType, setChartType] = useState('candle'); // 'candle' or 'ha'

  useEffect(() => {
    if (!containerRef.current) return;
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const raw = intradayData;
    if (!raw?.open || !raw?.timestamp || raw.open.length < 3) return;

    // Build candle data
    const candles = [];
    const volData = [];
    for (let i = 0; i < raw.timestamp.length; i++) {
      const t = raw.timestamp[i];
      const epoch = (t > 1e11 ? Math.floor(t / 1000) : t) + IST_OFFSET;
      const o = raw.open[i], h = raw.high[i], l = raw.low[i], c = raw.close[i];
      if (o <= 0) continue;
      candles.push({ time: epoch, open: o, high: h, low: l, close: c });
      if (raw.volume) {
        volData.push({ time: epoch, value: raw.volume[i] || 0, color: c >= o ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)' });
      }
    }
    if (candles.length < 2) return;

    // Convert to Heikin Ashi if needed
    let displayCandles = candles;
    if (chartType === 'ha') {
      displayCandles = [];
      for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        const prev = displayCandles[i - 1] || c;
        const haClose = (c.open + c.high + c.low + c.close) / 4;
        const haOpen = (prev.open + prev.close) / 2;
        displayCandles.push({
          time: c.time,
          open: +haOpen.toFixed(2),
          high: Math.max(c.high, haOpen, haClose),
          low: Math.min(c.low, haOpen, haClose),
          close: +haClose.toFixed(2),
        });
      }
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: { background: { type: 'solid', color: 'transparent' }, textColor: 'rgba(255,255,255,0.5)', fontSize: 9 },
      grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: 'rgba(255,255,255,0.1)' },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
      crosshair: { mode: 0 },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', downColor: '#ef4444',
      borderUpColor: '#10b981', borderDownColor: '#ef4444',
      wickUpColor: '#10b981', wickDownColor: '#ef4444',
    });
    candleSeries.setData(displayCandles);

    if (volData.length > 0) {
      const volSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
      });
      volSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
      volSeries.setData(volData);
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; } };
  }, [intradayData, chartType]);

  const hasData = intradayData?.open && intradayData.open.length > 2;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-panel)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-heading)' }}>{item.symbol}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: (item.changePct || 0) >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>
            {(item.ltp || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span style={{ fontSize: 9, color: (item.changePct || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {(item.changePct || 0) >= 0 ? '+' : ''}{(item.changePct || 0).toFixed(2)}%
          </span>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          <button onClick={() => setChartType('candle')}
            style={{ fontSize: 8, padding: '2px 6px', borderRadius: 3, border: 'none', cursor: 'pointer', fontWeight: 600,
              background: chartType === 'candle' ? 'rgba(6,182,212,0.2)' : 'transparent', color: chartType === 'candle' ? '#06b6d4' : 'var(--text-muted)' }}>
            OHLC
          </button>
          <button onClick={() => setChartType('ha')}
            style={{ fontSize: 8, padding: '2px 6px', borderRadius: 3, border: 'none', cursor: 'pointer', fontWeight: 600,
              background: chartType === 'ha' ? 'rgba(6,182,212,0.2)' : 'transparent', color: chartType === 'ha' ? '#06b6d4' : 'var(--text-muted)' }}>
            HA
          </button>
        </div>
      </div>

      <div ref={containerRef} style={{ flex: 1, minHeight: 160 }}>
        {!hasData && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 10 }}>
            Loading chart data...
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarketWatchView() {
  const universe = useMarketStore(s => s.universe);
  const watchlists = useMarketStore(s => s.watchlists);
  const activeWatchlist = useMarketStore(s => s.activeWatchlist);
  const [intradayMap, setIntradayMap] = useState({});

  const wlSymbols = (watchlists[activeWatchlist] || []).slice(0, 6);
  const chartItems = wlSymbols.map(s => universe.find(r => r.symbol === s)).filter(Boolean);

  // If no watchlist items, use first 6 from universe
  const displayItems = chartItems.length > 0 ? chartItems : universe.slice(0, 6);

  useEffect(() => {
    const fetchAll = async () => {
      const results = {};
      for (const item of displayItems) {
        try {
          const seg = item.exchange_segment || 'NSE_EQ';
          const inst = ['IDX_I', 'NSE_IDX', 'BSE_INDEX'].includes(seg) ? 'INDEX' : (item.type || 'EQUITY');
          const data = await engineConnector.getIntradayOHLC({
            securityId: item.token,
            exchangeSegment: seg,
            instrument: inst
          });
          const raw = data?.close ? data : (data?.data || data);
          if (raw?.close && raw?.open) results[item.symbol] = raw;
        } catch {}
      }
      if (Object.keys(results).length > 0) setIntradayMap(results);
    };
    if (displayItems.length > 0) fetchAll();
  }, [displayItems.length]);

  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: 4, padding: 4, overflow: 'hidden' }}>
      {displayItems.length > 0 ? displayItems.map(item => (
        <MiniCandleChart key={item.symbol} item={item} intradayData={intradayMap[item.symbol]} />
      )) : (
        <div style={{ gridColumn: '1 / -1', gridRow: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📈</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>No symbols available</div>
          </div>
        </div>
      )}
    </div>
  );
}
