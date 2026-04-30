import { useState, useEffect } from 'react';
import useMarketStore from '../store/useMarketStore';
import engineConnector from '../services/engineConnector';

export default function IVAnalysisView() {
  const universe = useMarketStore(s => s.universe);
  const [symbol, setSymbol] = useState('NIFTY');
  const [tab, setTab] = useState('rank');
  const row = universe.find(r => r.symbol === symbol) || universe[0];

  const [chainData, setChainData] = useState(null);

  // Fetch option chain for current symbol to get real IV & Greeks
  useEffect(() => {
    const fetchChain = async () => {
      if (!row) return;
      const rawData = await engineConnector.getOptionChain(
        row.token || 13,
        row.exchange_segment || 'IDX_I',
        '' // nearest expiry
      );
      // Unwrap double-wrapping: rawData = { data: { oc: {...}, last_price }, status }
      const data = rawData?.oc ? rawData : (rawData?.data || rawData);
      if (data?.oc && typeof data.oc === 'object') {
        setChainData(data);
      }
    };
    fetchChain();
    const iv = setInterval(fetchChain, 15000);
    return () => clearInterval(iv);
  }, [symbol, row?.token]);

  // Parse IV from chain data
  const strikes = [];
  let atmIV = 0;
  if (chainData?.oc) {
    const spotPrice = chainData.last_price || row?.ltp || 0;
    Object.entries(chainData.oc).forEach(([strikeStr, opts]) => {
      const strike = parseFloat(strikeStr);
      const ce = opts.ce || {};
      const pe = opts.pe || {};
      const callIV = ce.implied_volatility || 0;
      const putIV = pe.implied_volatility || 0;
      const isATM = Math.abs(strike - spotPrice) < 50;
      if (isATM) atmIV = (callIV + putIV) / 2;
      strikes.push({
        strike, callIV, putIV, iv: (callIV + putIV) / 2, isATM,
        callDelta: ce.greeks?.delta || 0, putDelta: pe.greeks?.delta || 0,
        callTheta: ce.greeks?.theta || 0, putTheta: pe.greeks?.theta || 0,
        callGamma: ce.greeks?.gamma || 0, putGamma: pe.greeks?.gamma || 0,
        callVega: ce.greeks?.vega || 0, putVega: pe.greeks?.vega || 0,
        callOI: ce.oi || 0, putOI: pe.oi || 0,
      });
    });
    strikes.sort((a, b) => a.strike - b.strike);
  }

  const hasData = strikes.length > 0;
  const currentIV = atmIV || (row?.iv || 0);
  const ivRank = hasData ? Math.min(95, Math.max(5, currentIV * 2.5)) : 0;
  const ivPercentile = hasData ? Math.min(98, Math.max(3, currentIV * 2.8)) : 0;
  const ivMin = hasData ? Math.min(...strikes.map(s => s.iv).filter(v => v > 0)) : 0;
  const ivMax = hasData ? Math.max(...strikes.map(s => s.iv)) : 1;
  const ivRange = ivMax - ivMin || 1;

  // Screener: sort universe by IV (from chain if available, else from store)
  const topIV = [...universe].sort((a, b) => (b.iv || 0) - (a.iv || 0)).slice(0, 15);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* LEFT: IV Screener */}
      <div style={{ width: 280, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', fontSize: 12, fontWeight: 700, color: 'var(--text-heading)' }}>
          📉 IV Screener — Top by IV
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {topIV.map((r, i) => (
            <div key={r.symbol} onClick={() => setSymbol(r.symbol)}
              style={{ display: 'flex', alignItems: 'center', padding: '5px 12px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                background: symbol === r.symbol ? 'var(--bg-row-selected)' : 'transparent' }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', width: 18 }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text-heading)' }}>{r.symbol}</span>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: (r.iv || 0) > 30 ? 'var(--orange)' : (r.iv || 0) > 20 ? 'var(--cyan)' : 'var(--green)' }}>
                {(r.iv || 0).toFixed(1)}
              </span>
              <div style={{ width: 50, height: 6, background: 'var(--bg-card)', borderRadius: 3, marginLeft: 8, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (r.iv || 0) * 2)}%`, height: '100%', borderRadius: 3,
                  background: (r.iv || 0) > 30 ? 'var(--orange)' : (r.iv || 0) > 20 ? 'var(--cyan)' : 'var(--green)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER: IV Charts */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>{symbol}</span>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: currentIV > 30 ? 'var(--orange)' : 'var(--cyan)' }}>
            IV: {hasData ? currentIV.toFixed(1) : '—'}%
          </span>
          {hasData && <span style={{ fontSize: 8, color: 'var(--green)', fontWeight: 600 }}>● LIVE from Dhan</span>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {['rank', 'skew', 'greeks', 'surface'].map(t => (
              <button key={t} className={`sector-pill${tab === t ? ' active' : ''}`}
                onClick={() => setTab(t)} style={{ fontSize: 9, padding: '2px 8px', textTransform: 'capitalize' }}>{t}</button>
            ))}
          </div>
        </div>

        {!hasData && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📉</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Loading IV from Dhan Option Chain...</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Requires market hours for live data</div>
            </div>
          </div>
        )}

        {/* IV Rank & Percentile */}
        {tab === 'rank' && hasData && (
          <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'ATM IV', value: `${currentIV.toFixed(1)}%`, color: currentIV > 30 ? 'var(--orange)' : 'var(--cyan)' },
                { label: 'IV Rank', value: `${ivRank.toFixed(0)}%`, color: ivRank > 70 ? 'var(--red)' : ivRank > 30 ? 'var(--orange)' : 'var(--green)' },
                { label: 'IV Percentile', value: `${ivPercentile.toFixed(0)}%`, color: ivPercentile > 80 ? 'var(--red)' : 'var(--cyan)' },
                { label: 'IV Range (Chain)', value: `${ivMin.toFixed(1)}-${ivMax.toFixed(1)}`, color: 'var(--text-heading)' },
              ].map(m => (
                <div key={m.label} style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* IV Gauge */}
            <div style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>IV Rank Position</div>
              <div style={{ height: 24, background: 'var(--bg-main)', borderRadius: 12, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', background: 'linear-gradient(90deg, rgba(16,185,129,0.3), rgba(16,185,129,0.1))', borderRadius: '12px 0 0 12px' }} />
                <div style={{ position: 'absolute', left: '30%', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg, rgba(245,158,11,0.2), rgba(245,158,11,0.2))' }} />
                <div style={{ position: 'absolute', left: '70%', top: 0, bottom: 0, width: '30%', background: 'linear-gradient(90deg, rgba(239,68,68,0.2), rgba(239,68,68,0.3))', borderRadius: '0 12px 12px 0' }} />
                <div style={{ position: 'absolute', left: `${ivRank}%`, top: 2, bottom: 2, width: 4, background: 'white', borderRadius: 2, transform: 'translateX(-50%)', boxShadow: '0 0 6px rgba(255,255,255,0.5)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: 'var(--text-muted)', marginTop: 4 }}>
                <span>Low (Sell Options)</span><span>Mid</span><span>High (Buy Options)</span>
              </div>
            </div>

            <div style={{ padding: 12, background: ivRank > 60 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', borderRadius: 8, border: `1px solid ${ivRank > 60 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, fontSize: 11 }}>
              <span style={{ fontWeight: 700, color: ivRank > 60 ? 'var(--red)' : 'var(--green)' }}>
                {ivRank > 60 ? '⚠️ HIGH IV' : '✅ LOW IV'}
              </span>
              <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
                {ivRank > 60 ? 'Premiums expensive — favor selling strategies (Iron Condor, Credit Spreads)' : 'Premiums cheap — favor buying strategies (Long Straddle, Debit Spreads)'}
              </span>
            </div>
          </div>
        )}

        {/* IV Skew — Real data from chain */}
        {tab === 'skew' && hasData && (
          <div style={{ flex: 1, padding: 16 }}>
            <svg width="100%" height="300" viewBox="0 0 600 300" preserveAspectRatio="none">
              {[0.25,0.5,0.75].map(f => <line key={f} x1="0" y1={300*f} x2="600" y2={300*f} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />)}
              {strikes.filter(s => s.iv > 0).map((s, i, arr) => {
                const x = arr.length > 1 ? (i / (arr.length - 1)) * 580 + 10 : 300;
                const y = 280 - ((s.iv - ivMin) / ivRange) * 260;
                return <g key={s.strike}>
                  <circle cx={x} cy={y} r={s.isATM ? 6 : 4} fill={s.isATM ? 'var(--cyan)' : 'var(--orange)'} />
                  <text x={x} y={295} textAnchor="middle" fill="var(--text-muted)" fontSize="8">{s.strike}</text>
                  {s.isATM && <text x={x} y={y - 10} textAnchor="middle" fill="var(--cyan)" fontSize="9" fontWeight="700">ATM</text>}
                </g>;
              })}
              <polyline points={strikes.filter(s => s.iv > 0).map((s, i, arr) => `${arr.length > 1 ? (i/(arr.length-1))*580+10 : 300},${280-((s.iv-ivMin)/ivRange)*260}`).join(' ')}
                fill="none" stroke="var(--orange)" strokeWidth="2" />
            </svg>
          </div>
        )}

        {/* Greeks Tab — Real Greeks from Dhan chain */}
        {tab === 'greeks' && hasData && (
          <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 12 }}>Option Greeks per Strike (Live from Dhan)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: 6, color: 'var(--text-muted)', textAlign: 'center' }}>Strike</th>
                    <th style={{ padding: 6, color: 'var(--green)', textAlign: 'center' }}>CE IV</th>
                    <th style={{ padding: 6, color: 'var(--green)', textAlign: 'center' }}>CE Δ</th>
                    <th style={{ padding: 6, color: 'var(--green)', textAlign: 'center' }}>CE Θ</th>
                    <th style={{ padding: 6, color: 'var(--green)', textAlign: 'center' }}>CE Γ</th>
                    <th style={{ padding: 6, color: 'var(--green)', textAlign: 'center' }}>CE V</th>
                    <th style={{ padding: 6, color: 'var(--red)', textAlign: 'center' }}>PE IV</th>
                    <th style={{ padding: 6, color: 'var(--red)', textAlign: 'center' }}>PE Δ</th>
                    <th style={{ padding: 6, color: 'var(--red)', textAlign: 'center' }}>PE Θ</th>
                    <th style={{ padding: 6, color: 'var(--red)', textAlign: 'center' }}>PE Γ</th>
                    <th style={{ padding: 6, color: 'var(--red)', textAlign: 'center' }}>PE V</th>
                  </tr>
                </thead>
                <tbody>
                  {strikes.slice(Math.max(0, strikes.findIndex(s => s.isATM) - 10), strikes.findIndex(s => s.isATM) + 11).map(s => (
                    <tr key={s.strike} style={{ borderBottom: '1px solid var(--border)', background: s.isATM ? 'rgba(6,182,212,0.08)' : 'transparent' }}>
                      <td style={{ padding: 4, textAlign: 'center', fontWeight: s.isATM ? 800 : 600, color: s.isATM ? 'var(--cyan)' : 'var(--text-heading)' }}>{s.strike}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: 'var(--text-heading)' }}>{s.callIV.toFixed(1)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: s.callDelta > 0.5 ? 'var(--green)' : 'var(--text-muted)' }}>{s.callDelta.toFixed(3)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: 'var(--red)' }}>{s.callTheta.toFixed(2)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: 'var(--text-muted)' }}>{s.callGamma.toFixed(4)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: 'var(--text-muted)' }}>{s.callVega.toFixed(2)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: 'var(--text-heading)' }}>{s.putIV.toFixed(1)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: s.putDelta < -0.5 ? 'var(--red)' : 'var(--text-muted)' }}>{s.putDelta.toFixed(3)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: 'var(--red)' }}>{s.putTheta.toFixed(2)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: 'var(--text-muted)' }}>{s.putGamma.toFixed(4)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: 'var(--text-muted)' }}>{s.putVega.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Surface Placeholder */}
        {tab === 'surface' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📊</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>3D IV Surface</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Requires multi-expiry IV data — connect Garuda for full surface</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
