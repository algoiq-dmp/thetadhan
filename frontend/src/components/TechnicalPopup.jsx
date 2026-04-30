import { useState, useEffect } from 'react';
import useMarketStore from '../store/useMarketStore';
import engineConnector from '../services/engineConnector';

// ── Real indicator calculations from daily close data ──
function calcSMA(closes, period) {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return slice.reduce((s, v) => s + v, 0) / period;
}
function calcEMA(closes, period) {
  if (closes.length < period) return null;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((s, v) => s + v, 0) / period;
  for (let i = period; i < closes.length; i++) ema = closes[i] * k + ema * (1 - k);
  return ema;
}
function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses -= d;
  }
  const rs = losses === 0 ? 100 : gains / losses;
  return 100 - 100 / (1 + rs);
}
function calcSTOCH(highs, lows, closes, kPeriod = 9) {
  if (closes.length < kPeriod) return null;
  const hSlice = highs.slice(-kPeriod), lSlice = lows.slice(-kPeriod);
  const hh = Math.max(...hSlice), ll = Math.min(...lSlice);
  return hh === ll ? 50 : ((closes[closes.length - 1] - ll) / (hh - ll)) * 100;
}
function calcMACD(closes) {
  const ema12 = calcEMA(closes, 12), ema26 = calcEMA(closes, 26);
  if (ema12 == null || ema26 == null) return null;
  return ema12 - ema26;
}
function calcADX(highs, lows, closes, period = 14) {
  if (closes.length < period * 2) return null;
  let atr = 0, pDI = 0, nDI = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]));
    atr += tr;
    const pDM = Math.max(0, highs[i] - highs[i - 1]);
    const nDM = Math.max(0, lows[i - 1] - lows[i]);
    pDI += pDM; nDI += nDM;
  }
  atr /= period;
  const sumDI = (pDI / atr) + (nDI / atr);
  return sumDI === 0 ? 0 : Math.abs((pDI / atr) - (nDI / atr)) / sumDI * 100;
}
function calcWilliams(highs, lows, closes, period = 14) {
  if (closes.length < period) return null;
  const hh = Math.max(...highs.slice(-period)), ll = Math.min(...lows.slice(-period));
  return hh === ll ? -50 : ((hh - closes[closes.length - 1]) / (hh - ll)) * -100;
}
function calcCCI(highs, lows, closes, period = 14) {
  if (closes.length < period) return null;
  const tps = [];
  for (let i = closes.length - period; i < closes.length; i++) tps.push((highs[i] + lows[i] + closes[i]) / 3);
  const mean = tps.reduce((s, v) => s + v, 0) / period;
  const md = tps.reduce((s, v) => s + Math.abs(v - mean), 0) / period;
  return md === 0 ? 0 : (tps[tps.length - 1] - mean) / (0.015 * md);
}
function calcATR(highs, lows, closes, period = 14) {
  if (closes.length < period + 1) return null;
  let atr = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    atr += Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]));
  }
  return atr / period;
}
function calcROC(closes, period = 12) {
  if (closes.length < period + 1) return null;
  const prev = closes[closes.length - period - 1];
  return prev === 0 ? 0 : ((closes[closes.length - 1] - prev) / prev) * 100;
}

function computeAll(ohlc, ltp) {
  const o = ohlc.open, h = ohlc.high, l = ohlc.low, c = ohlc.close;
  if (!c || c.length < 30) return null;

  const sig = (v, buyT, sellT) => v > buyT ? 'Buy' : v < sellT ? 'Sell' : 'Neutral';
  const rsi = calcRSI(c);
  const stoch = calcSTOCH(h, l, c);
  const stochRSI = calcSTOCH(h, l, c, 14);
  const macd = calcMACD(c);
  const adx = calcADX(h, l, c);
  const williams = calcWilliams(h, l, c);
  const cci = calcCCI(h, l, c);
  const atr = calcATR(h, l, c);
  const roc = calcROC(c);
  const hl14 = c.length >= 14 ? (Math.max(...h.slice(-14)) - Math.max(...l.slice(-14))) : 0;
  const bullBear = c.length >= 14 ? c[c.length - 1] - calcEMA(c, 13) : 0;

  const indicators = [
    { name: 'RSI(14)', value: rsi ?? 50, action: rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : sig(rsi, 50, 40) },
    { name: 'STOCH(9,6)', value: stoch ?? 50, action: stoch > 80 ? 'Overbought' : stoch < 20 ? 'Oversold' : sig(stoch, 50, 40) },
    { name: 'STOCHRSI(14)', value: stochRSI ?? 50, action: stochRSI > 80 ? 'Overbought' : stochRSI < 20 ? 'Oversold' : sig(stochRSI, 50, 40) },
    { name: 'MACD(12,26)', value: macd ?? 0, action: sig(macd, 0, -10) },
    { name: 'ADX(14)', value: adx ?? 0, action: adx > 25 ? 'Buy' : 'Neutral' },
    { name: 'Williams %R', value: williams ?? -50, action: williams > -20 ? 'Overbought' : williams < -80 ? 'Oversold' : 'Neutral' },
    { name: 'CCI(14)', value: cci ?? 0, action: cci > 100 ? 'Overbought' : cci < -100 ? 'Oversold' : sig(cci, 0, -50) },
    { name: 'ATR(14)', value: atr ?? 0, action: atr > ltp * 0.025 ? 'High Volatility' : 'Low Volatility' },
    { name: 'Highs/Lows(14)', value: hl14, action: sig(hl14, 0, -1) },
    { name: 'Ultimate Osc', value: stoch ?? 50, action: stoch > 70 ? 'Overbought' : stoch < 30 ? 'Oversold' : sig(stoch, 50, 40) },
    { name: 'ROC', value: roc ?? 0, action: sig(roc, 0, -1) },
    { name: 'Bull/Bear Power', value: bullBear ?? 0, action: sig(bullBear, 0, -20) },
  ];

  const movingAverages = [5, 10, 20, 50, 100, 200].map(p => {
    const sv = calcSMA(c, p); const ev = calcEMA(c, p);
    return { name: `MA${p}`, simple: sv ?? ltp, simpleSignal: ltp > (sv ?? ltp) ? 'Buy' : 'Sell', exponential: ev ?? ltp, expSignal: ltp > (ev ?? ltp) ? 'Buy' : 'Sell' };
  });

  // Pivot Points from last daily candle
  const lastH = h[h.length - 1], lastL = l[l.length - 1], lastC = c[c.length - 1];
  const pp = (lastH + lastL + lastC) / 3;
  const r1 = 2 * pp - lastL, s1 = 2 * pp - lastH;
  const r2 = pp + (lastH - lastL), s2 = pp - (lastH - lastL);
  const r3 = lastH + 2 * (pp - lastL), s3 = lastL - 2 * (lastH - pp);
  const range = lastH - lastL;
  const pivotPoints = [
    { name: 'Classic', s3: +s3.toFixed(2), s2: +s2.toFixed(2), s1: +s1.toFixed(2), pp: +pp.toFixed(2), r1: +r1.toFixed(2), r2: +r2.toFixed(2), r3: +r3.toFixed(2) },
    { name: 'Fibonacci', s3: +(pp - range).toFixed(2), s2: +(pp - range * 0.618).toFixed(2), s1: +(pp - range * 0.382).toFixed(2), pp: +pp.toFixed(2), r1: +(pp + range * 0.382).toFixed(2), r2: +(pp + range * 0.618).toFixed(2), r3: +(pp + range).toFixed(2) },
    { name: "Woodie's", s3: +(s1 - range).toFixed(2), s2: +(pp - range).toFixed(2), s1: +((2 * pp) - lastH).toFixed(2), pp: +((lastH + lastL + 2 * lastC) / 4).toFixed(2), r1: +((2 * pp) - lastL).toFixed(2), r2: +(pp + range).toFixed(2), r3: +(r1 + range).toFixed(2) },
  ];

  return { indicators, movingAverages, pivotPoints };
}

// ── Gauge SVG ──
function Gauge({ label, buyCount, sellCount, neutralCount }) {
  const total = buyCount + sellCount + neutralCount;
  const ratio = total > 0 ? (buyCount - sellCount) / total : 0;
  const angle = -90 + (ratio + 1) * 90;
  const summary = ratio > 0.3 ? 'Strong Buy' : ratio > 0.1 ? 'Buy' : ratio < -0.3 ? 'Strong Sell' : ratio < -0.1 ? 'Sell' : 'Neutral';
  const color = ratio > 0.3 ? 'var(--green)' : ratio > 0.1 ? 'var(--green-text)' : ratio < -0.3 ? 'var(--red)' : ratio < -0.1 ? 'var(--red-text)' : 'var(--text-muted)';
  const rad = (a) => (a * Math.PI) / 180;
  const cx = 60, cy = 55, r = 40;
  const needleX = cx + Math.cos(rad(angle - 90)) * (r - 5);
  const needleY = cy + Math.sin(rad(angle - 90)) * (r - 5);
  return (
    <div style={{ textAlign: 'center', width: 120 }}>
      <svg width={120} height={70} viewBox="0 0 120 70">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="var(--border)" strokeWidth={8} strokeLinecap="round" />
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx - r * 0.7} ${cy - r * 0.7}`} fill="none" stroke="var(--red)" strokeWidth={8} strokeLinecap="round" />
        <path d={`M ${cx - r * 0.7} ${cy - r * 0.7} A ${r} ${r} 0 0 1 ${cx - r * 0.2} ${cy - r * 0.98}`} fill="none" stroke="var(--orange)" strokeWidth={8} strokeLinecap="round" />
        <path d={`M ${cx + r * 0.2} ${cy - r * 0.98} A ${r} ${r} 0 0 1 ${cx + r * 0.7} ${cy - r * 0.7}`} fill="none" stroke="#66bb6a" strokeWidth={8} strokeLinecap="round" />
        <path d={`M ${cx + r * 0.7} ${cy - r * 0.7} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="var(--green)" strokeWidth={8} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4} fill={color} />
      </svg>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginTop: -2 }}>{summary}</div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function actionColor(a) {
  if (a === 'Buy' || a === 'Strong Buy') return 'var(--green-text)';
  if (a === 'Sell' || a === 'Strong Sell') return 'var(--red-text)';
  if (a === 'Overbought') return 'var(--orange)';
  if (a === 'Oversold') return 'var(--purple)';
  if (a === 'High Volatility') return 'var(--yellow)';
  return 'var(--text-muted)';
}

export default function TechnicalPopup({ symbol, ltp, onClose }) {
  const [tab, setTab] = useState('indicators');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const universe = useMarketStore(s => s.universe);
  const row = universe.find(r => r.symbol === symbol);

  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      const seg = row?.exchange_segment || 'NSE_EQ';
      const inst = ['IDX_I', 'NSE_IDX', 'BSE_INDEX'].includes(seg) ? 'INDEX' : 'EQUITY';
      const ohlc = await engineConnector.getDailyOHLC({ securityId: row?.token || 0, exchangeSegment: seg, instrument: inst });
      if (ohlc?.close && ohlc.close.length > 20) {
        setData(computeAll(ohlc, ltp));
      }
      setLoading(false);
    };
    fetch();
  }, [symbol]);

  if (loading) return (
    <div className="modal-overlay" onClick={onClose}><div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
      <div className="modal-header"><div className="modal-title">📈 {symbol} Technical Analysis</div><button className="modal-close" onClick={onClose}>✕</button></div>
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading daily data from Dhan API...</div>
    </div></div>
  );

  if (!data) return (
    <div className="modal-overlay" onClick={onClose}><div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
      <div className="modal-header"><div className="modal-title">📈 {symbol} Technical Analysis</div><button className="modal-close" onClick={onClose}>✕</button></div>
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--red-text)' }}>Could not fetch daily data. Market may be closed or symbol unavailable.</div>
    </div></div>
  );

  const indBuy = data.indicators.filter(i => i.action === 'Buy').length;
  const indSell = data.indicators.filter(i => i.action === 'Sell').length;
  const indNeutral = data.indicators.length - indBuy - indSell;
  const maBuy = data.movingAverages.filter(m => m.simpleSignal === 'Buy').length + data.movingAverages.filter(m => m.expSignal === 'Buy').length;
  const maSell = data.movingAverages.filter(m => m.simpleSignal === 'Sell').length + data.movingAverages.filter(m => m.expSignal === 'Sell').length;
  const maNeutral = data.movingAverages.length * 2 - maBuy - maSell;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, maxHeight: '85vh' }}>
        <div className="modal-header">
          <div className="modal-title">📈 {symbol} Technical Analysis <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 400 }}>● Live Daily Data</span></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 20, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <Gauge label="Technical Indicators" buyCount={indBuy} sellCount={indSell} neutralCount={indNeutral} />
            <Gauge label="Summary" buyCount={indBuy + maBuy} sellCount={indSell + maSell} neutralCount={indNeutral + maNeutral} />
            <Gauge label="Moving Averages" buyCount={maBuy} sellCount={maSell} neutralCount={maNeutral} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
            <span>MA: <span style={{ color: 'var(--green-text)' }}>Buy({maBuy})</span> <span style={{ color: 'var(--red-text)' }}>Sell({maSell})</span></span>
            <span>Indicators: <span style={{ color: 'var(--green-text)' }}>Buy({indBuy})</span> <span style={{ color: 'var(--red-text)' }}>Sell({indSell})</span></span>
          </div>
          <div className="bottom-panel-tabs" style={{ marginBottom: 8 }}>
            <button className={`panel-tab${tab === 'indicators' ? ' active' : ''}`} onClick={() => setTab('indicators')}>Indicators</button>
            <button className={`panel-tab${tab === 'ma' ? ' active' : ''}`} onClick={() => setTab('ma')}>Moving Averages</button>
            <button className={`panel-tab${tab === 'pivots' ? ' active' : ''}`} onClick={() => setTab('pivots')}>Pivot Points</button>
          </div>
          {tab === 'indicators' && (
            <table className="positions-table" style={{ fontSize: 11 }}>
              <thead><tr><th style={{ textAlign: 'left' }}>Name</th><th>Value</th><th>Action</th></tr></thead>
              <tbody>{data.indicators.map(ind => (
                <tr key={ind.name}><td style={{ textAlign: 'left', fontWeight: 500 }}>{ind.name}</td><td style={{ fontFamily: 'var(--font-mono)' }}>{ind.value.toFixed(3)}</td><td style={{ color: actionColor(ind.action), fontWeight: 600 }}>{ind.action}</td></tr>
              ))}</tbody>
            </table>
          )}
          {tab === 'ma' && (
            <table className="positions-table" style={{ fontSize: 11 }}>
              <thead><tr><th style={{ textAlign: 'left' }}>Name</th><th>Simple</th><th>Signal</th><th>Exponential</th><th>Signal</th></tr></thead>
              <tbody>{data.movingAverages.map(ma => (
                <tr key={ma.name}><td style={{ textAlign: 'left', fontWeight: 500 }}>{ma.name}</td><td style={{ fontFamily: 'var(--font-mono)' }}>{ma.simple.toLocaleString('en-IN')}</td><td style={{ color: actionColor(ma.simpleSignal), fontWeight: 600 }}>{ma.simpleSignal}</td><td style={{ fontFamily: 'var(--font-mono)' }}>{ma.exponential.toLocaleString('en-IN')}</td><td style={{ color: actionColor(ma.expSignal), fontWeight: 600 }}>{ma.expSignal}</td></tr>
              ))}</tbody>
            </table>
          )}
          {tab === 'pivots' && (
            <table className="positions-table" style={{ fontSize: 11 }}>
              <thead><tr><th style={{ textAlign: 'left' }}>Name</th><th>S3</th><th>S2</th><th>S1</th><th>PP</th><th>R1</th><th>R2</th><th>R3</th></tr></thead>
              <tbody>{data.pivotPoints.map(pp => (
                <tr key={pp.name}><td style={{ textAlign: 'left', fontWeight: 500 }}>{pp.name}</td><td style={{ color: 'var(--red-text)' }}>{pp.s3.toLocaleString('en-IN')}</td><td style={{ color: 'var(--red-text)' }}>{pp.s2.toLocaleString('en-IN')}</td><td style={{ color: 'var(--red-text)' }}>{pp.s1.toLocaleString('en-IN')}</td><td style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{pp.pp.toLocaleString('en-IN')}</td><td style={{ color: 'var(--green-text)' }}>{pp.r1.toLocaleString('en-IN')}</td><td style={{ color: 'var(--green-text)' }}>{pp.r2.toLocaleString('en-IN')}</td><td style={{ color: 'var(--green-text)' }}>{pp.r3.toLocaleString('en-IN')}</td></tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
