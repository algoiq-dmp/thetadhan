import { useState, useEffect } from 'react';
import useMarketStore from '../store/useMarketStore';
import engineConnector from '../services/engineConnector';

const TIMEFRAMES = ['1min', '5min', '15min', '1hr'];
const VWAP_SYMBOLS = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFCBANK', 'SBIN'];

function computeVWAP(ohlcData) {
  if (!ohlcData?.open || ohlcData.open.length < 2) return null;
  const { open, high, low, close, volume, start_Time } = ohlcData;
  let cumTPV = 0, cumVol = 0;
  const vwapPoints = [];

  for (let i = 0; i < open.length; i++) {
    const tp = (high[i] + low[i] + close[i]) / 3;
    const vol = volume?.[i] || 1;
    cumTPV += tp * vol;
    cumVol += vol;
    vwapPoints.push({ tp, vol, vwap: cumTPV / cumVol });
  }

  const vwap = cumVol > 0 ? cumTPV / cumVol : close[close.length - 1];
  const ltp = close[close.length - 1];
  const stdDev = Math.sqrt(vwapPoints.reduce((s, p) => s + (p.tp - vwap) ** 2, 0) / vwapPoints.length);
  const deviation = stdDev > 0 ? (ltp - vwap) / stdDev : 0;
  const totalVol = cumVol;

  // Volume profile
  const priceStep = stdDev > 0 ? stdDev * 0.5 : (Math.max(...high) - Math.min(...low)) / 10;
  const profileMap = {};
  for (let i = 0; i < close.length; i++) {
    const bucket = Math.round(close[i] / priceStep) * priceStep;
    profileMap[bucket] = (profileMap[bucket] || 0) + (volume?.[i] || 1);
  }
  const profile = Object.entries(profileMap)
    .map(([price, vol]) => ({ price: parseFloat(price), vol }))
    .sort((a, b) => b.price - a.price)
    .slice(0, 10);
  const maxVol = Math.max(...profile.map(p => p.vol));
  profile.forEach(p => p.pct = p.vol / maxVol);

  return {
    ltp, vwap: +vwap.toFixed(2), deviation: +deviation.toFixed(2),
    vol: totalVol > 100000 ? `${(totalVol / 100000).toFixed(1)}L` : `${(totalVol / 1000).toFixed(1)}K`,
    trend: ltp >= vwap ? 'above' : 'below',
    bands: {
      upper2: +(vwap + 2 * stdDev).toFixed(2),
      upper1: +(vwap + stdDev).toFixed(2),
      lower1: +(vwap - stdDev).toFixed(2),
      lower2: +(vwap - 2 * stdDev).toFixed(2),
    },
    profile,
  };
}

export default function VWAPPanel() {
  const [tab, setTab] = useState('vwap');
  const [tf, setTf] = useState('5min');
  const [vwapData, setVwapData] = useState({});
  const universe = useMarketStore(s => s.universe);

  useEffect(() => {
    const fetchAllVWAP = async () => {
      const results = {};
      for (const sym of VWAP_SYMBOLS) {
        const inst = universe.find(u => u.symbol === sym);
        if (!inst) continue;
        try {
          const data = await engineConnector.getIntradayOHLC({
            securityId: inst.token,
            exchangeSegment: inst.exchange_segment || 'NSE_EQ',
            instrument: inst.type || 'EQUITY'
          });
          // Unwrap: data may be { data: { open:[], timestamp:[] }, status } or flat { open:[], timestamp:[] }
          const raw = data?.open ? data : (data?.data || data);
          if (raw?.open && raw?.timestamp) {
            results[sym] = computeVWAP(raw);
          }
        } catch {}
      }
      if (Object.keys(results).length > 0) setVwapData(results);
    };
    if (universe.length > 0) fetchAllVWAP();
  }, [universe.length]);

  const symbols = Object.keys(vwapData);
  const clr = (v) => v >= 0 ? '#10b981' : '#ef4444';
  const activeProfile = vwapData[symbols[0]]?.profile || [];
  const pocIdx = activeProfile.findIndex(p => p.pct === 1.0);

  return (
    <div style={{ padding: 8, fontSize: 11, color: '#e2e8f0' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[
          { id: 'vwap', label: '📏 VWAP' },
          { id: 'profile', label: '📊 Vol Profile' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, height: 26, borderRadius: 4, border: 'none', fontSize: 10, fontWeight: 600, cursor: 'pointer',
            background: tab === t.id ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)',
            color: tab === t.id ? '#06b6d4' : '#64748b',
          }}>{t.label}</button>
        ))}
      </div>

      {symbols.length === 0 && (
        <div style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📏</div>
          <div style={{ fontSize: 11 }}>Loading VWAP data from Dhan...</div>
          <div style={{ fontSize: 9, marginTop: 4 }}>Requires market hours for intraday data</div>
        </div>
      )}

      {/* VWAP Tab */}
      {tab === 'vwap' && symbols.length > 0 && (
        <div>
          <div style={{ display: 'flex', gap: 3, marginBottom: 8, justifyContent: 'center' }}>
            {TIMEFRAMES.map(t => (
              <button key={t} onClick={() => setTf(t)} style={{
                padding: '2px 8px', borderRadius: 4, border: 'none', fontSize: 8, fontWeight: 600, cursor: 'pointer',
                background: tf === t ? 'rgba(139,92,246,0.15)' : 'transparent',
                color: tf === t ? '#8b5cf6' : '#475569',
              }}>{t}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {symbols.map(sym => {
              const d = vwapData[sym];
              if (!d) return null;
              const devColor = d.deviation >= 0 ? '#10b981' : '#ef4444';
              return (
                <div key={sym} style={{
                  padding: '8px 10px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2a3a',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#f8fafc' }}>{sym}</span>
                    <span style={{ fontSize: 8, color: '#64748b' }}>Vol: {d.vol}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 4 }}>
                    <span>LTP: <strong style={{ color: '#f8fafc' }}>₹{d.ltp?.toLocaleString('en-IN')}</strong></span>
                    <span>VWAP: <strong style={{ color: '#06b6d4' }}>₹{d.vwap?.toLocaleString('en-IN')}</strong></span>
                    <span style={{ color: devColor, fontWeight: 700 }}>
                      {d.deviation >= 0 ? '▲' : '▼'} {Math.abs(d.deviation).toFixed(2)}σ
                    </span>
                  </div>
                  <div style={{ position: 'relative', height: 12, borderRadius: 6, background: '#0f1724', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: '20%', right: '20%', height: '100%', background: 'rgba(6,182,212,0.08)', borderRadius: 4 }} />
                    <div style={{ position: 'absolute', left: '35%', right: '35%', height: '100%', background: 'rgba(6,182,212,0.12)', borderRadius: 4 }} />
                    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: '#06b6d4' }} />
                    <div style={{
                      position: 'absolute', left: `${Math.max(5, Math.min(95, 50 + d.deviation * 15))}%`, top: '50%', transform: 'translate(-50%, -50%)',
                      width: 8, height: 8, borderRadius: '50%', background: devColor,
                      boxShadow: `0 0 6px ${devColor}`,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Volume Profile Tab */}
      {tab === 'profile' && activeProfile.length > 0 && (
        <div>
          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600, marginBottom: 6, textAlign: 'center' }}>{symbols[0]} Volume Profile (Today)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activeProfile.map((p, i) => {
              const isPOC = p.pct === 1.0;
              const isVA = p.pct >= 0.7;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 8, color: isPOC ? '#f59e0b' : '#64748b', fontWeight: isPOC ? 800 : 400, width: 50, textAlign: 'right', fontFamily: 'JetBrains Mono' }}>
                    {p.price.toFixed(0)}
                  </span>
                  <div style={{ flex: 1, height: isPOC ? 14 : 10, borderRadius: 3, background: '#0f1724', overflow: 'hidden' }}>
                    <div style={{
                      width: `${p.pct * 100}%`, height: '100%', borderRadius: 3,
                      background: isPOC ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : isVA ? 'rgba(6,182,212,0.4)' : 'rgba(100,116,139,0.2)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
          {pocIdx >= 0 && (
            <div style={{
              marginTop: 8, padding: '8px 10px', borderRadius: 6,
              background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>POC: {activeProfile[pocIdx].price.toFixed(0)}</span>
                <span style={{ color: '#06b6d4' }}>VA: {activeProfile.filter(p => p.pct >= 0.7).at(-1)?.price.toFixed(0)} - {activeProfile.filter(p => p.pct >= 0.7)[0]?.price.toFixed(0)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
