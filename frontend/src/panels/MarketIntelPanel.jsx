import { useState } from 'react';

const PATTERNS = [
  { name: 'Bullish Engulfing', symbol: 'NIFTY', timeframe: '15m', confidence: 87, type: 'bullish', time: '10:15', description: 'Strong reversal signal with volume confirmation' },
  { name: 'Evening Star', symbol: 'BANKNIFTY', timeframe: '1hr', confidence: 72, type: 'bearish', time: '09:45', description: '3-candle reversal at resistance zone' },
  { name: 'Double Bottom', symbol: 'RELIANCE', timeframe: '1D', confidence: 91, type: 'bullish', time: '09:30', description: 'Support tested twice at 2480, breakout pending' },
  { name: 'Head & Shoulders', symbol: 'HDFCBANK', timeframe: '4hr', confidence: 68, type: 'bearish', time: '14:00', description: 'Neckline at 1710, breakdown target 1680' },
  { name: 'Hammer', symbol: 'SBIN', timeframe: '15m', confidence: 78, type: 'bullish', time: '11:30', description: 'Long lower wick at support with rising volume' },
  { name: 'Bearish Harami', symbol: 'TCS', timeframe: '1hr', confidence: 65, type: 'bearish', time: '13:15', description: 'Inside bar after strong rally, bearish reversal' },
  { name: 'Cup & Handle', symbol: 'INFY', timeframe: '1D', confidence: 83, type: 'bullish', time: '09:30', description: 'Handle formation completing, breakout above 1540' },
  { name: 'Rising Wedge', symbol: 'MIDCPNIFTY', timeframe: '4hr', confidence: 75, type: 'bearish', time: '12:00', description: 'Converging trendlines with declining volume' },
];

const PREMARKET = {
  sgxNifty: { value: 24380, change: +45, changePct: +0.18 },
  dowFutures: { value: 39250, change: +120, changePct: +0.31 },
  nasdaqFutures: { value: 17890, change: -35, changePct: -0.20 },
  vix: { value: 14.2, change: -0.8, changePct: -5.3 },
  dxy: { value: 104.2, change: +0.15, changePct: +0.14 },
  oilCrude: { value: 82.5, change: -1.2, changePct: -1.43 },
  gold: { value: 2345, change: +12, changePct: +0.51 },
  usdInr: { value: 83.45, change: +0.08, changePct: +0.10 },
};

export default function MarketIntelPanel() {
  const [tab, setTab] = useState('patterns');

  const clr = (v) => v >= 0 ? '#10b981' : '#ef4444';

  return (
    <div style={{ padding: 8, fontSize: 11, color: '#e2e8f0' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[
          { id: 'patterns', label: '🔮 Patterns' },
          { id: 'global', label: '🌍 Global' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, height: 26, borderRadius: 4, border: 'none', fontSize: 10, fontWeight: 600, cursor: 'pointer',
            background: tab === t.id ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)',
            color: tab === t.id ? '#06b6d4' : '#64748b',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Patterns Tab */}
      {tab === 'patterns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {PATTERNS.map((p, i) => (
            <div key={i} style={{
              padding: '8px 10px', borderRadius: 6,
              background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2a3a',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12 }}>{p.type === 'bullish' ? '🟢' : '🔴'}</span>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#f8fafc' }}>{p.name}</div>
                    <div style={{ fontSize: 8, color: '#64748b' }}>{p.symbol} • {p.timeframe} • {p.time}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: 10, fontWeight: 800,
                    color: p.confidence >= 80 ? '#10b981' : p.confidence >= 65 ? '#f59e0b' : '#ef4444',
                  }}>{p.confidence}%</div>
                  <div style={{ fontSize: 7, color: '#475569' }}>confidence</div>
                </div>
              </div>
              <div style={{ fontSize: 8, color: '#94a3b8', lineHeight: 1.3 }}>{p.description}</div>
              {/* Confidence Bar */}
              <div style={{ height: 3, borderRadius: 2, background: '#1e2a3a', marginTop: 4, overflow: 'hidden' }}>
                <div style={{
                  width: `${p.confidence}%`, height: '100%', borderRadius: 2,
                  background: p.confidence >= 80 ? '#10b981' : p.confidence >= 65 ? '#f59e0b' : '#ef4444',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Global Market Tab */}
      {tab === 'global' && (
        <div>
          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>PRE-MARKET INDICATORS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(PREMARKET).map(([key, d]) => {
              const labels = {
                sgxNifty: ['📊 SGX NIFTY', 'Singapore'],
                dowFutures: ['🇺🇸 DOW Futures', 'US'],
                nasdaqFutures: ['💻 NASDAQ Futures', 'US Tech'],
                vix: ['😱 INDIA VIX', 'Fear Gauge'],
                dxy: ['💵 DXY', 'Dollar Index'],
                oilCrude: ['🛢️ Crude Oil', 'WTI'],
                gold: ['🥇 Gold', 'COMEX'],
                usdInr: ['🇮🇳 USD/INR', 'Currency'],
              };
              const [label, sub] = labels[key] || [key, ''];
              return (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2a3a',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#f8fafc' }}>{label}</div>
                    <div style={{ fontSize: 8, color: '#475569' }}>{sub}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
                      {d.value.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 9, color: clr(d.change), fontWeight: 600 }}>
                      {d.change >= 0 ? '▲' : '▼'} {Math.abs(d.change)} ({d.changePct >= 0 ? '+' : ''}{d.changePct.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
