import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries, createSeriesMarkers } from 'lightweight-charts';
import { toHeikinAshi, calcEMA } from '../components/CandlestickChart';
import useMarketStore from '../store/useMarketStore';
import engineConnector from '../services/engineConnector';

// ---- Detect HA color-change signals ----
function detectSignals(haData, rawData) {
  const signals = [];
  for (let i = 1; i < haData.length; i++) {
    const prev = haData[i - 1];
    const curr = haData[i];
    const prevGreen = prev.close > prev.open;
    const currGreen = curr.close > curr.open;

    if (!prevGreen && currGreen) {
      let sl = curr.low;
      for (let j = Math.max(0, i - 3); j < i; j++) sl = Math.min(sl, haData[j].low);
      let consecutive = 1;
      for (let j = i + 1; j < haData.length && haData[j].close > haData[j].open; j++) consecutive++;
      const noLowerWick = consecutive >= 3 && haData.slice(i, i + consecutive).every(c => c.low >= Math.min(c.open, c.close) * 0.999);
      signals.push({
        type: 'BUY', time: curr.time, price: rawData[i]?.close || curr.close,
        sl: +sl.toFixed(2), consecutive,
        confidence: Math.min(95, 50 + consecutive * 10 + (noLowerWick ? 15 : 0)),
        strong: noLowerWick && consecutive >= 3,
      });
    } else if (prevGreen && !currGreen) {
      let sl = curr.high;
      for (let j = Math.max(0, i - 3); j < i; j++) sl = Math.max(sl, haData[j].high);
      let consecutive = 1;
      for (let j = i + 1; j < haData.length && haData[j].close <= haData[j].open; j++) consecutive++;
      const noUpperWick = consecutive >= 3 && haData.slice(i, i + consecutive).every(c => c.high <= Math.max(c.open, c.close) * 1.001);
      signals.push({
        type: 'SELL', time: curr.time, price: rawData[i]?.close || curr.close,
        sl: +sl.toFixed(2), consecutive,
        confidence: Math.min(95, 50 + consecutive * 10 + (noUpperWick ? 15 : 0)),
        strong: noUpperWick && consecutive >= 3,
      });
    }
  }
  return signals.slice(-10).reverse();
}

function computeWinRate(signals, ohlcData) {
  let wins = 0, total = 0;
  for (const sig of signals) {
    const idx = ohlcData.findIndex(c => c.time === sig.time);
    if (idx < 0 || idx + 5 >= ohlcData.length) continue;
    const entry = sig.price;
    const future = ohlcData[idx + 5].close;
    total++;
    if (sig.type === 'BUY' && future > entry) wins++;
    if (sig.type === 'SELL' && future < entry) wins++;
  }
  return { wins, total, rate: total > 0 ? Math.round((wins / total) * 100) : 0 };
}

export default function HeikinAshiPanel() {
  const chartRef = useRef(null);
  const containerRef = useRef(null);
  const [timeframe, setTimeframe] = useState('5m');
  const [symbol, setSymbol] = useState('NIFTY');
  const openOrderEntry = useMarketStore(s => s.openOrderEntry);
  const universe = useMarketStore(s => s.universe);
  const [liveOHLC, setLiveOHLC] = useState(null);

  // Fetch live data from Dhan
  useEffect(() => {
    const row = universe.find(r => r.symbol === symbol) || { token: 13, exchange_segment: 'IDX_I' };
    const fetchData = async () => {
      try {
        const data = await engineConnector.getIntradayOHLC({
          securityId: row.token, exchangeSegment: row.exchange_segment || 'IDX_I',
          instrument: row.exchange_segment === 'NSE_EQ' ? 'EQUITY' : 'INDEX'
        });
        const raw = data?.open ? data : (data?.data || data);
        if (raw?.open && raw?.timestamp) {
          const candles = raw.timestamp.map((t, i) => ({
            time: Math.floor(new Date(typeof t === 'number' ? t * 1000 : t).getTime() / 1000),
            open: raw.open[i], high: raw.high[i], low: raw.low[i], close: raw.close[i],
            volume: raw.volume?.[i] || 0,
          })).filter(c => c.open > 0);
          if (candles.length > 2) setLiveOHLC(candles);
        }
      } catch {}
    };
    fetchData();
  }, [symbol, universe.length]);

  const ohlcData = useMemo(() => liveOHLC || [], [liveOHLC]);
  const haData = useMemo(() => toHeikinAshi(ohlcData), [ohlcData]);
  const signals = useMemo(() => detectSignals(haData, ohlcData), [haData, ohlcData]);
  const winRate = useMemo(() => computeWinRate(signals, ohlcData), [signals, ohlcData]);

  // Render mini HA chart
  useEffect(() => {
    if (!containerRef.current) return;
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 180,
      layout: { background: { type: ColorType.Solid, color: '#0a0e17' }, textColor: '#475569', fontSize: 9 },
      grid: { vertLines: { color: 'rgba(30,42,58,0.3)' }, horzLines: { color: 'rgba(30,42,58,0.3)' } },
      rightPriceScale: { borderColor: '#1e2a3a', scaleMargins: { top: 0.05, bottom: 0.05 } },
      timeScale: { borderColor: '#1e2a3a', timeVisible: true, secondsVisible: false },
    });
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', downColor: '#ef4444',
      borderUpColor: '#10b981', borderDownColor: '#ef4444',
      wickUpColor: '#10b981', wickDownColor: '#ef4444',
    });
    series.setData(haData);

    // Add EMA 9/21
    const ema9 = chart.addSeries(LineSeries, { color: '#22d3ee', lineWidth: 1, lineStyle: 2 });
    ema9.setData(calcEMA(ohlcData, 9));
    const ema21 = chart.addSeries(LineSeries, { color: '#a78bfa', lineWidth: 1, lineStyle: 2 });
    ema21.setData(calcEMA(ohlcData, 21));

    // Mark signals on chart
    const markers = signals.slice(0, 5).map(sig => ({
      time: sig.time,
      position: sig.type === 'BUY' ? 'belowBar' : 'aboveBar',
      color: sig.type === 'BUY' ? '#10b981' : '#ef4444',
      shape: sig.type === 'BUY' ? 'arrowUp' : 'arrowDown',
      text: sig.type === 'BUY' ? 'BUY' : 'SELL',
    }));
    if (markers.length) {
      const markerPlugin = createSeriesMarkers(series);
      markerPlugin.setMarkers(markers.sort((a, b) => a.time - b.time));
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(entries => {
      for (const e of entries) { if (e.contentRect.width > 0) chart.applyOptions({ width: e.contentRect.width }); }
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  }, [haData, ohlcData, signals]);

  const formatTime = useCallback((ts) => {
    const d = new Date(ts * 1000);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  }, []);

  return (
    <div style={{ padding: 6, fontSize: 10, color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#8b5cf6' }}>🔮 HEIKIN ASHI AI</div>
        <div style={{ display: 'flex', gap: 2 }}>
          {['1m', '5m', '15m'].map(tf => (
            <button key={tf} onClick={() => setTimeframe(tf)} style={{
              padding: '2px 5px', borderRadius: 3, border: 'none', fontSize: 8, cursor: 'pointer',
              background: timeframe === tf ? 'rgba(139,92,246,0.15)' : 'transparent',
              color: timeframe === tf ? '#8b5cf6' : '#475569', fontWeight: timeframe === tf ? 700 : 400,
            }}>{tf}</button>
          ))}
        </div>
      </div>

      {/* Symbol selector */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
        {['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'RELIANCE', 'SBIN'].map(s => (
          <button key={s} onClick={() => setSymbol(s)} style={{
            padding: '1px 4px', borderRadius: 2, border: 'none', fontSize: 7, cursor: 'pointer',
            background: symbol === s ? 'rgba(6,182,212,0.12)' : 'transparent',
            color: symbol === s ? '#06b6d4' : '#475569', fontWeight: symbol === s ? 700 : 400,
          }}>{s}</button>
        ))}
      </div>

      {/* Chart */}
      <div ref={containerRef} style={{ width: '100%', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }} />

      {/* AI Color Alerts */}
      <div style={{ fontSize: 8, fontWeight: 600, color: '#64748b', marginBottom: 3 }}>AI COLOR ALERTS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 6 }}>
        {signals.length === 0 && <div style={{ fontSize: 9, color: '#475569', padding: 8, textAlign: 'center' }}>No signals in current window</div>}
        {signals.slice(0, 5).map((sig, i) => (
          <div key={i} style={{
            padding: '5px 6px', borderRadius: 4,
            background: sig.type === 'BUY' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
            border: `1px solid ${sig.type === 'BUY' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: sig.type === 'BUY' ? '#10b981' : '#ef4444' }}>
                {sig.type === 'BUY' ? '🟢' : '🔴'} {symbol} — {sig.strong ? `STRONG ${sig.type}` : `${sig.type} signal`}
              </span>
              <span style={{ fontSize: 7, color: '#475569' }}>{formatTime(sig.time)}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 2, fontSize: 8, color: '#94a3b8' }}>
              <span>Entry: ₹{sig.price.toFixed(0)}</span>
              <span style={{ color: '#ef4444' }}>SL: ₹{sig.sl}</span>
              <span>Conf: {sig.confidence}%</span>
            </div>
            {sig.strong && <div style={{ fontSize: 7, color: '#f59e0b', marginTop: 1 }}>⚡ {sig.consecutive} consecutive, no opposing wick</div>}
            <button onClick={() => openOrderEntry({ symbol, side: sig.type === 'BUY' ? 'BUY' : 'SELL', price: sig.price })} style={{ marginTop: 3, width: '100%', padding: '3px 0', borderRadius: 3, border: 'none', fontSize: 8, fontWeight: 700, cursor: 'pointer', background: sig.type === 'BUY' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: sig.type === 'BUY' ? '#10b981' : '#ef4444' }}>
              ⚡ Execute {sig.type} @ ₹{sig.price.toFixed(0)} (SL: ₹{sig.sl})
            </button>
          </div>
        ))}
      </div>

      {/* SL Study / Win Rate */}
      <div style={{
        padding: '6px 8px', borderRadius: 4, background: 'rgba(139,92,246,0.04)',
        border: '1px solid rgba(139,92,246,0.1)',
      }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: '#8b5cf6', marginBottom: 3 }}>AUTO SL STUDY</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
          <span>Win Rate: <b style={{ color: winRate.rate >= 60 ? '#10b981' : winRate.rate >= 40 ? '#f59e0b' : '#ef4444' }}>{winRate.rate}%</b></span>
          <span>Last {winRate.total}: <span style={{ color: '#10b981' }}>{winRate.wins}W</span> / <span style={{ color: '#ef4444' }}>{winRate.total - winRate.wins}L</span></span>
        </div>
        <div style={{ marginTop: 3, height: 4, borderRadius: 2, background: '#1e2a3a', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${winRate.rate}%`, background: winRate.rate >= 60 ? '#10b981' : '#f59e0b', borderRadius: 2, transition: 'width 0.3s' }} />
        </div>
      </div>
    </div>
  );
}
