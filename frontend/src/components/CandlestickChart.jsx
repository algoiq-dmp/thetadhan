import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { createChart, ColorType, CrosshairMode, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries } from 'lightweight-charts';
import useMarketStore from '../store/useMarketStore';

// ---- Heikin Ashi Calculator ----
function toHeikinAshi(ohlc) {
  const ha = [];
  for (let i = 0; i < ohlc.length; i++) {
    const c = ohlc[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0 ? (c.open + c.close) / 2 : (ha[i - 1].open + ha[i - 1].close) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);
    ha.push({ time: c.time, open: +haOpen.toFixed(2), high: +haHigh.toFixed(2), low: +haLow.toFixed(2), close: +haClose.toFixed(2) });
  }
  return ha;
}

// ---- SMA Calculator ----
function calcSMA(data, period) {
  const result = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j].close;
    result.push({ time: data[i].time, value: +(sum / period).toFixed(2) });
  }
  return result;
}

// ---- EMA Calculator ----
function calcEMA(data, period) {
  const result = [];
  const k = 2 / (period + 1);
  let ema = data[0]?.close || 0;
  for (let i = 0; i < data.length; i++) {
    ema = i === 0 ? data[i].close : data[i].close * k + ema * (1 - k);
    if (i >= period - 1) result.push({ time: data[i].time, value: +ema.toFixed(2) });
  }
  return result;
}

// ---- Bollinger Calculator ----
function calcBollinger(data, period = 20, mult = 2) {
  const upper = [], lower = [], mid = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0, sqSum = 0;
    for (let j = i - period + 1; j <= i; j++) { sum += data[j].close; sqSum += data[j].close ** 2; }
    const avg = sum / period;
    const stdDev = Math.sqrt(sqSum / period - avg ** 2);
    mid.push({ time: data[i].time, value: +avg.toFixed(2) });
    upper.push({ time: data[i].time, value: +(avg + mult * stdDev).toFixed(2) });
    lower.push({ time: data[i].time, value: +(avg - mult * stdDev).toFixed(2) });
  }
  return { upper, lower, mid };
}

// ---- Generate Simulated OHLC Data ----
function generateOHLC(symbol, numBars = 200, timeframe = '5m') {
  const bars = [];
  const now = Math.floor(Date.now() / 1000);
  const tfSeconds = { '1m': 60, '3m': 180, '5m': 300, '15m': 900, '1h': 3600, '1d': 86400, '1w': 604800 };
  const interval = tfSeconds[timeframe] || 300;

  // Seed from symbol hash
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) seed += symbol.charCodeAt(i);
  const base = symbol.includes('NIFTY') ? (symbol === 'NIFTY' ? 24500 : symbol === 'BANKNIFTY' ? 52000 : 23500) : 500 + (seed % 4000);
  const volatility = symbol.includes('NIFTY') ? 0.003 : 0.008;

  let price = base;
  for (let i = numBars; i > 0; i--) {
    const time = now - i * interval;
    const change = (Math.random() - 0.48) * price * volatility;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * Math.abs(change) * 0.5;
    const low = Math.min(open, close) - Math.random() * Math.abs(change) * 0.5;
    bars.push({ time, open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2) });
    price = close;
  }
  return bars;
}

// ---- Volume Data ----
function generateVolume(ohlc) {
  return ohlc.map(c => ({
    time: c.time,
    value: Math.floor(Math.random() * 500000 + 50000),
    color: c.close >= c.open ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
  }));
}

export default function CandlestickChart({
  symbol = 'NIFTY',
  width,
  height = 400,
  chartType: initialChartType = 'candlestick',
  showToolbar = true,
  showOverlays = true,
  compact = false,
  onTrade,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [chartType, setChartType] = useState(initialChartType);
  const [timeframe, setTimeframe] = useState('5m');
  const [overlays, setOverlays] = useState({ sma30: true, sma100: false, sma200: false, ema9: false, ema21: false, bb: false, volume: true });

  // Try fetching real OHLC from backend (Dhan API), fallback to mock
  const [liveOHLC, setLiveOHLC] = useState(null);
  const universe = useMarketStore(s => s.universe);

  // Map timeframe labels to Dhan interval values
  const tfIntervalMap = { '1m': '1', '3m': '5', '5m': '5', '15m': '15', '1h': '60', '1d': null, '1w': null };

  // Store volume data alongside OHLC
  const [liveVolume, setLiveVolume] = useState(null);

  useEffect(() => {
    // 1. Get instrument metadata from universe
    const activeUniverse = universe?.length ? universe : (window.ty_universe || []);
    const inst = activeUniverse.find(u => u.symbol === symbol) || { token: '1333', exchange_segment: 'NSE_EQ', type: 'EQUITY' };

    const token = localStorage.getItem('dhan_token');
    const clientId = localStorage.getItem('dhan_client_id');
    if (!token) return;

    const isIntraday = ['1m', '3m', '5m', '15m', '1h'].includes(timeframe);
    const today = new Date();
    
    // Format dates as YYYY-MM-DD
    const formatDate = (d) => d.toISOString().split('T')[0];
    const toDateStr = formatDate(today);

    let instrumentType = 'EQUITY';
    if (inst.type?.includes('FUT')) instrumentType = 'FUT';
    if (inst.type?.includes('OPT')) instrumentType = 'OPT';
    if (inst.exchange_segment === 'IDX_I' || inst.exchange_segment === 'NSE_IDX' || inst.exchange_segment === 'BSE_INDEX') instrumentType = 'INDEX';

    // Build request payload
    const payload = {
      securityId: String(inst.token),
      exchangeSegment: inst.exchange_segment || 'NSE_EQ',
      instrument: instrumentType,
      oi: false,
      expiryCode: 0,
    };

    if (isIntraday) {
      // Dhan intraday requires: interval, fromDate/toDate as datetime strings
      payload.interval = tfIntervalMap[timeframe] || '5';
      // Last 5 trading days for intraday
      const fromD = new Date();
      fromD.setDate(fromD.getDate() - 5);
      payload.fromDate = formatDate(fromD) + ' 09:15:00';
      payload.toDate = toDateStr + ' 15:30:00';
      payload.isIntraday = true; // tells worker to use /charts/intraday
    } else {
      // Dhan historical: fromDate/toDate as YYYY-MM-DD
      const fromD = new Date();
      fromD.setFullYear(fromD.getFullYear() - 1); // 1 year history
      payload.fromDate = formatDate(fromD);
      payload.toDate = toDateStr;
      payload.isIntraday = false;
    }

    const apiUrl = `${import.meta.env.VITE_API_URL || 'https://thetadhan-api.parlight2.workers.dev'}/api/market/historical`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Client-Id': clientId || 'SYSTEM'
    };
    
    // Pass user-provided Data API token if set in settings
    const dataToken = localStorage.getItem('dhan_data_token');
    if (dataToken) {
      headers['X-Data-Token'] = dataToken;
    }

    fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        // Dhan response: { data: { open:[], high:[], low:[], close:[], timestamp:[], volume:[] } }
        // OR wrapped: { success: true, data: { open:[], ... } }
        const ddata = res?.data?.open ? res.data : res?.data?.data;
        const times = ddata?.timestamp || ddata?.start_Time;
        if (ddata && times && times.length > 2) {
          const opens = ddata.open;
          const highs = ddata.high;
          const lows = ddata.low;
          const closes = ddata.close;
          const volumes = ddata.volume;
          
          const candles = [];
          const volData = [];
          const IST_OFFSET = 19800; // +5:30 in seconds
          for (let i = 0; i < times.length; i++) {
             const t = times[i];
             const epoch = (t > 1e11 ? Math.floor(t / 1000) : t) + IST_OFFSET; // UTC → IST for display
             candles.push({
               time: epoch, 
               open: opens[i], high: highs[i], low: lows[i], close: closes[i],
             });
             if (volumes) {
               volData.push({
                 time: epoch,
                 value: volumes[i] || 0,
                 color: closes[i] >= opens[i] ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
               });
             }
          }
          setLiveOHLC(candles);
          if (volData.length > 0) setLiveVolume(volData);
          console.log(`[Chart] ✓ ${symbol} ${isIntraday ? 'intraday' : 'daily'}: ${candles.length} candles loaded from Dhan`);
        } else {
          console.warn('[Chart] Dhan returned empty/invalid data:', res);
        }
      })
      .catch((err) => { console.warn('[Chart] Dhan Historical error:', err); });
  }, [symbol, timeframe, universe?.length]);

  const ohlcData = useMemo(() => liveOHLC || [], [symbol, timeframe, liveOHLC]);
  const haData = useMemo(() => toHeikinAshi(ohlcData), [ohlcData]);

  const toggleOverlay = useCallback((key) => {
    setOverlays(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    // Cleanup previous
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const containerWidth = width || containerRef.current.clientWidth;
    const chart = createChart(containerRef.current, {
      width: containerWidth,
      height: height,
      layout: { background: { type: ColorType.Solid, color: '#0a0e17' }, textColor: '#64748b', fontSize: 10 },
      grid: { vertLines: { color: 'rgba(30,42,58,0.5)' }, horzLines: { color: 'rgba(30,42,58,0.5)' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#1e2a3a' },
      timeScale: { borderColor: '#1e2a3a', timeVisible: true, secondsVisible: false },
    });
    chartRef.current = chart;

    const data = chartType === 'heikinashi' ? haData : ohlcData;

    // Main series
    if (chartType === 'line') {
      const lineSeries = chart.addSeries(LineSeries, { color: '#06b6d4', lineWidth: 2 });
      lineSeries.setData(data.map(c => ({ time: c.time, value: c.close })));
    } else if (chartType === 'area') {
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(6,182,212,0.4)', bottomColor: 'rgba(6,182,212,0.0)',
        lineColor: '#06b6d4', lineWidth: 2,
      });
      areaSeries.setData(data.map(c => ({ time: c.time, value: c.close })));
    } else {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981', downColor: '#ef4444',
        borderUpColor: '#10b981', borderDownColor: '#ef4444',
        wickUpColor: '#10b981', wickDownColor: '#ef4444',
      });
      candleSeries.setData(data);
    }

    // Overlays (on original OHLC data for accuracy)
    if (showOverlays) {
      if (overlays.sma30) {
        const s = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, lineStyle: 0 });
        s.setData(calcSMA(ohlcData, 30));
      }
      if (overlays.sma100) {
        const s = chart.addSeries(LineSeries, { color: '#8b5cf6', lineWidth: 1, lineStyle: 0 });
        s.setData(calcSMA(ohlcData, 100));
      }
      if (overlays.sma200) {
        const s = chart.addSeries(LineSeries, { color: '#ec4899', lineWidth: 1, lineStyle: 0 });
        s.setData(calcSMA(ohlcData, 200));
      }
      if (overlays.ema9) {
        const s = chart.addSeries(LineSeries, { color: '#22d3ee', lineWidth: 1, lineStyle: 2 });
        s.setData(calcEMA(ohlcData, 9));
      }
      if (overlays.ema21) {
        const s = chart.addSeries(LineSeries, { color: '#a78bfa', lineWidth: 1, lineStyle: 2 });
        s.setData(calcEMA(ohlcData, 21));
      }
      if (overlays.bb) {
        const bb = calcBollinger(ohlcData);
        const su = chart.addSeries(LineSeries, { color: 'rgba(139,92,246,0.4)', lineWidth: 1, lineStyle: 2 });
        su.setData(bb.upper);
        const sl = chart.addSeries(LineSeries, { color: 'rgba(139,92,246,0.4)', lineWidth: 1, lineStyle: 2 });
        sl.setData(bb.lower);
      }
    }

    // Volume — use real Dhan volume data if available, else generate mock
    if (overlays.volume) {
      const volSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
      });
      chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
      volSeries.setData(liveVolume || generateVolume(ohlcData));
    }

    chart.timeScale().fitContent();

    // Resize observer
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const w = e.contentRect.width;
        if (w > 0) chart.applyOptions({ width: w });
      }
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  }, [symbol, chartType, timeframe, overlays, ohlcData, haData, height, width, showOverlays]);

  const btnStyle = (active) => ({
    padding: compact ? '2px 5px' : '3px 8px', borderRadius: 3, border: 'none', fontSize: compact ? 8 : 9,
    fontWeight: active ? 700 : 400, cursor: 'pointer',
    background: active ? 'rgba(6,182,212,0.15)' : 'transparent',
    color: active ? '#06b6d4' : '#475569',
  });

  const ovlBtnStyle = (active) => ({
    ...btnStyle(active),
    color: active ? '#f59e0b' : '#475569',
    background: active ? 'rgba(245,158,11,0.1)' : 'transparent',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#0a0e17', borderRadius: compact ? 4 : 8, border: '1px solid #1e2a3a', overflow: 'hidden' }}>
      {showToolbar && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: compact ? '3px 6px' : '4px 8px', borderBottom: '1px solid #1e2a3a', gap: 4, flexWrap: 'wrap' }}>
          {/* Left: Chart type + Symbol */}
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <span style={{ fontSize: compact ? 9 : 10, fontWeight: 700, color: '#f8fafc', marginRight: 6 }}>{symbol}</span>
            {onTrade && !compact && (
              <>
                <button onClick={() => onTrade({ symbol, side: 'BUY' })} style={{ padding: '2px 8px', borderRadius: 3, border: 'none', fontSize: 9, fontWeight: 700, cursor: 'pointer', background: 'rgba(16,185,129,0.15)', color: '#10b981' }} title={`Buy ${symbol}`}>B</button>
                <button onClick={() => onTrade({ symbol, side: 'SELL' })} style={{ padding: '2px 8px', borderRadius: 3, border: 'none', fontSize: 9, fontWeight: 700, cursor: 'pointer', background: 'rgba(239,68,68,0.15)', color: '#ef4444', marginRight: 4 }} title={`Sell ${symbol}`}>S</button>
              </>
            )}
            {['candlestick', 'heikinashi', 'line', 'area'].map(t => (
              <button key={t} onClick={() => setChartType(t)} style={btnStyle(chartType === t)}>
                {t === 'candlestick' ? '🕯️' : t === 'heikinashi' ? '🔮HA' : t === 'line' ? '📈' : '📊'}
              </button>
            ))}
          </div>

          {/* Center: Timeframes */}
          <div style={{ display: 'flex', gap: 2 }}>
            {['1m', '3m', '5m', '15m', '1h', '1d'].map(tf => (
              <button key={tf} onClick={() => setTimeframe(tf)} style={btnStyle(timeframe === tf)}>
                {tf}
              </button>
            ))}
          </div>

          {/* Right: Overlays */}
          {showOverlays && (
            <div style={{ display: 'flex', gap: 2 }}>
              <button onClick={() => toggleOverlay('sma30')} style={ovlBtnStyle(overlays.sma30)}>SMA30</button>
              <button onClick={() => toggleOverlay('sma100')} style={ovlBtnStyle(overlays.sma100)}>SMA100</button>
              <button onClick={() => toggleOverlay('ema9')} style={ovlBtnStyle(overlays.ema9)}>EMA9</button>
              <button onClick={() => toggleOverlay('ema21')} style={ovlBtnStyle(overlays.ema21)}>EMA21</button>
              <button onClick={() => toggleOverlay('bb')} style={ovlBtnStyle(overlays.bb)}>BB</button>
              <button onClick={() => toggleOverlay('volume')} style={ovlBtnStyle(overlays.volume)}>Vol</button>
            </div>
          )}
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%' }} />
    </div>
  );
}

// Export utilities for other components
export { toHeikinAshi, generateOHLC, calcSMA, calcEMA };
