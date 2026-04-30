import { useState, useMemo } from 'react';

// Generate mock technical indicator values
function mockIndicators(ltp) {
  const r = (min, max) => +(min + Math.random() * (max - min)).toFixed(3);

  const rsi = r(25, 80);
  const stoch = r(10, 95);
  const stochRSI = r(5, 95);
  const macd = r(-50, 100);
  const adx = r(15, 55);
  const williams = r(-98, -2);
  const cci = r(-150, 200);
  const atr = r(ltp * 0.01, ltp * 0.04);
  const highsLows = r(-5, 5);
  const ultimateOsc = r(20, 80);
  const roc = r(-4, 6);
  const bullBear = r(-100, 100);

  const sig = (v, buyThresh, sellThresh) =>
    v > buyThresh ? 'Buy' : v < sellThresh ? 'Sell' : 'Neutral';

  const indicators = [
    { name: 'RSI(14)', value: rsi, action: rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : sig(rsi, 50, 40) },
    { name: 'STOCH(9,6)', value: stoch, action: stoch > 80 ? 'Overbought' : stoch < 20 ? 'Oversold' : sig(stoch, 50, 40) },
    { name: 'STOCHRSI(14)', value: stochRSI, action: stochRSI > 80 ? 'Overbought' : stochRSI < 20 ? 'Oversold' : sig(stochRSI, 50, 40) },
    { name: 'MACD(12,26)', value: macd, action: sig(macd, 0, -10) },
    { name: 'ADX(14)', value: adx, action: adx > 25 ? 'Buy' : 'Neutral' },
    { name: 'Williams %R', value: williams, action: williams > -20 ? 'Overbought' : williams < -80 ? 'Oversold' : 'Neutral' },
    { name: 'CCI(14)', value: cci, action: cci > 100 ? 'Overbought' : cci < -100 ? 'Oversold' : sig(cci, 0, -50) },
    { name: 'ATR(14)', value: atr, action: atr > ltp * 0.025 ? 'High Volatility' : 'Low Volatility' },
    { name: 'Highs/Lows(14)', value: highsLows, action: sig(highsLows, 0, -1) },
    { name: 'Ultimate Osc', value: ultimateOsc, action: ultimateOsc > 70 ? 'Overbought' : ultimateOsc < 30 ? 'Oversold' : sig(ultimateOsc, 50, 40) },
    { name: 'ROC', value: roc, action: sig(roc, 0, -1) },
    { name: 'Bull/Bear Power', value: bullBear, action: sig(bullBear, 0, -20) },
  ];

  const sma = (period) => +(ltp * (1 + (Math.random() - 0.5) * 0.06)).toFixed(2);
  const ema = (period) => +(ltp * (1 + (Math.random() - 0.5) * 0.055)).toFixed(2);

  const movingAverages = [5, 10, 20, 50, 100, 200].map(p => {
    const sv = sma(p);
    const ev = ema(p);
    return {
      name: `MA${p}`,
      simple: sv, simpleSignal: ltp > sv ? 'Buy' : 'Sell',
      exponential: ev, expSignal: ltp > ev ? 'Buy' : 'Sell',
    };
  });

  const pp = +(ltp * (1 + (Math.random() - 0.5) * 0.005)).toFixed(2);
  const pivotPoints = [
    { name: 'Classic', s3: +(pp - ltp * 0.022).toFixed(2), s2: +(pp - ltp * 0.014).toFixed(2), s1: +(pp - ltp * 0.008).toFixed(2), pp, r1: +(pp + ltp * 0.006).toFixed(2), r2: +(pp + ltp * 0.014).toFixed(2), r3: +(pp + ltp * 0.022).toFixed(2) },
    { name: 'Fibonacci', s3: +(pp - ltp * 0.016).toFixed(2), s2: +(pp - ltp * 0.01).toFixed(2), s1: +(pp - ltp * 0.006).toFixed(2), pp, r1: +(pp + ltp * 0.006).toFixed(2), r2: +(pp + ltp * 0.01).toFixed(2), r3: +(pp + ltp * 0.016).toFixed(2) },
    { name: 'Woodie', s3: +(pp - ltp * 0.02).toFixed(2), s2: +(pp - ltp * 0.013).toFixed(2), s1: +(pp - ltp * 0.005).toFixed(2), pp, r1: +(pp + ltp * 0.008).toFixed(2), r2: +(pp + ltp * 0.015).toFixed(2), r3: +(pp + ltp * 0.021).toFixed(2) },
  ];

  return { indicators, movingAverages, pivotPoints };
}

// Gauge SVG Component
function Gauge({ label, buyCount, sellCount, neutralCount }) {
  const total = buyCount + sellCount + neutralCount;
  const ratio = total > 0 ? (buyCount - sellCount) / total : 0; // -1 to +1
  const angle = -90 + (ratio + 1) * 90; // -90 to +90 degrees
  const summary = ratio > 0.3 ? 'Strong Buy' : ratio > 0.1 ? 'Buy' : ratio < -0.3 ? 'Strong Sell' : ratio < -0.1 ? 'Sell' : 'Neutral';
  const color = ratio > 0.3 ? 'var(--green)' : ratio > 0.1 ? 'var(--green-text)' : ratio < -0.3 ? 'var(--red)' : ratio < -0.1 ? 'var(--red-text)' : 'var(--text-muted)';

  const rad = (a) => (a * Math.PI) / 180;
  const cx = 60, cy = 55, r = 40;
  const needleX = cx + Math.cos(rad(angle - 90)) * (r - 5);
  const needleY = cy + Math.sin(rad(angle - 90)) * (r - 5);

  return (
    <div style={{ textAlign: 'center', width: 120 }}>
      <svg width={120} height={70} viewBox="0 0 120 70">
        {/* Arc background */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="var(--border)" strokeWidth={8} strokeLinecap="round" />
        {/* Colored segments */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx - r * 0.7} ${cy - r * 0.7}`}
          fill="none" stroke="var(--red)" strokeWidth={8} strokeLinecap="round" />
        <path d={`M ${cx - r * 0.7} ${cy - r * 0.7} A ${r} ${r} 0 0 1 ${cx - r * 0.2} ${cy - r * 0.98}`}
          fill="none" stroke="var(--orange)" strokeWidth={8} strokeLinecap="round" />
        <path d={`M ${cx + r * 0.2} ${cy - r * 0.98} A ${r} ${r} 0 0 1 ${cx + r * 0.7} ${cy - r * 0.7}`}
          fill="none" stroke="#66bb6a" strokeWidth={8} strokeLinecap="round" />
        <path d={`M ${cx + r * 0.7} ${cy - r * 0.7} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="var(--green)" strokeWidth={8} strokeLinecap="round" />
        {/* Needle */}
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
  const data = useMemo(() => mockIndicators(ltp), [symbol, ltp]);

  const indBuy = data.indicators.filter(i => i.action === 'Buy').length;
  const indSell = data.indicators.filter(i => i.action === 'Sell').length;
  const indNeutral = data.indicators.length - indBuy - indSell;
  const maBuy = data.movingAverages.filter(m => m.simpleSignal === 'Buy').length + data.movingAverages.filter(m => m.expSignal === 'Buy').length;
  const maSell = data.movingAverages.filter(m => m.simpleSignal === 'Sell').length + data.movingAverages.filter(m => m.expSignal === 'Sell').length;
  const maNeutral = data.movingAverages.length * 2 - maBuy - maSell;
  const totalBuy = indBuy + maBuy;
  const totalSell = indSell + maSell;
  const totalNeutral = indNeutral + maNeutral;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, maxHeight: '85vh' }}>
        <div className="modal-header">
          <div className="modal-title">📈 {symbol} Technical Analysis</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: 16 }}>
          {/* Summary Gauges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 20, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <Gauge label="Technical Indicators" buyCount={indBuy} sellCount={indSell} neutralCount={indNeutral} />
            <Gauge label="Summary" buyCount={totalBuy} sellCount={totalSell} neutralCount={totalNeutral} />
            <Gauge label="Moving Averages" buyCount={maBuy} sellCount={maSell} neutralCount={maNeutral} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
            <span>MA: <span style={{ color: 'var(--green-text)' }}>Buy({maBuy})</span> <span style={{ color: 'var(--red-text)' }}>Sell({maSell})</span></span>
            <span>Indicators: <span style={{ color: 'var(--green-text)' }}>Buy({indBuy})</span> <span style={{ color: 'var(--red-text)' }}>Sell({indSell})</span></span>
          </div>

          {/* Tabs */}
          <div className="bottom-panel-tabs" style={{ marginBottom: 8 }}>
            <button className={`panel-tab${tab === 'indicators' ? ' active' : ''}`} onClick={() => setTab('indicators')}>Indicators</button>
            <button className={`panel-tab${tab === 'ma' ? ' active' : ''}`} onClick={() => setTab('ma')}>Moving Averages</button>
            <button className={`panel-tab${tab === 'pivots' ? ' active' : ''}`} onClick={() => setTab('pivots')}>Pivot Points</button>
          </div>

          {tab === 'indicators' && (
            <table className="positions-table" style={{ fontSize: 11 }}>
              <thead><tr><th style={{ textAlign: 'left' }}>Name</th><th>Value</th><th>Action</th></tr></thead>
              <tbody>
                {data.indicators.map(ind => (
                  <tr key={ind.name}>
                    <td style={{ fontFamily: 'var(--font-sans)', textAlign: 'left', fontWeight: 500 }}>{ind.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{ind.value.toFixed(3)}</td>
                    <td style={{ color: actionColor(ind.action), fontWeight: 600, fontFamily: 'var(--font-sans)' }}>{ind.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'ma' && (
            <table className="positions-table" style={{ fontSize: 11 }}>
              <thead><tr><th style={{ textAlign: 'left' }}>Name</th><th>Simple</th><th>Signal</th><th>Exponential</th><th>Signal</th></tr></thead>
              <tbody>
                {data.movingAverages.map(ma => (
                  <tr key={ma.name}>
                    <td style={{ fontFamily: 'var(--font-sans)', textAlign: 'left', fontWeight: 500 }}>{ma.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{ma.simple.toLocaleString('en-IN')}</td>
                    <td style={{ color: actionColor(ma.simpleSignal), fontWeight: 600, fontFamily: 'var(--font-sans)' }}>{ma.simpleSignal}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{ma.exponential.toLocaleString('en-IN')}</td>
                    <td style={{ color: actionColor(ma.expSignal), fontWeight: 600, fontFamily: 'var(--font-sans)' }}>{ma.expSignal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'pivots' && (
            <table className="positions-table" style={{ fontSize: 11 }}>
              <thead><tr><th style={{ textAlign: 'left' }}>Name</th><th>S3</th><th>S2</th><th>S1</th><th>PP</th><th>R1</th><th>R2</th><th>R3</th></tr></thead>
              <tbody>
                {data.pivotPoints.map(pp => (
                  <tr key={pp.name}>
                    <td style={{ fontFamily: 'var(--font-sans)', textAlign: 'left', fontWeight: 500 }}>{pp.name}</td>
                    <td style={{ color: 'var(--red-text)' }}>{pp.s3.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--red-text)' }}>{pp.s2.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--red-text)' }}>{pp.s1.toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{pp.pp.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--green-text)' }}>{pp.r1.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--green-text)' }}>{pp.r2.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--green-text)' }}>{pp.r3.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
