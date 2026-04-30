import { useState, useEffect } from 'react';
import useMarketStore from '../store/useMarketStore';
import engineConnector from '../services/engineConnector';

export default function OptionsTraderView() {
  const universe = useMarketStore(s => s.universe);
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
  const [expiry, setExpiry] = useState('');
  const [expiries, setExpiries] = useState([]);
  const [liveChain, setLiveChain] = useState(null);

  const activeUniverse = universe?.length ? universe : [];
  const row = activeUniverse.find(r => r.symbol === selectedSymbol) || activeUniverse[0] || { symbol: 'NIFTY', ltp: 0, lotSize: 25, changePct: 0, token: 13, exchange_segment: 'IDX_I' };

  // Fetch live expiry dates when symbol changes
  useEffect(() => {
    const fetchExpiries = async () => {
      const list = await engineConnector.getExpiryList(row.token || 13, row.exchange_segment || 'IDX_I');
      const dates = Array.isArray(list) ? list : [];
      setExpiries(dates);
      if (dates.length > 0 && !expiry) setExpiry(dates[0]);
    };
    fetchExpiries();
  }, [row.token, row.exchange_segment]);

  // Fetch option chain
  useEffect(() => {
    if (!expiry) return;
    let active = true;
    const fetchChain = async () => {
      const rawData = await engineConnector.getOptionChain(row.token || 13, row.exchange_segment || 'IDX_I', expiry);
      if (!active || !rawData) return;
      const data = rawData.oc ? rawData : (rawData.data || rawData);

      if (data.oc && typeof data.oc === 'object') {
        const strikes = Object.entries(data.oc).map(([strikeStr, opts]) => {
          const strike = parseFloat(strikeStr);
          const ce = opts.ce || {}, pe = opts.pe || {};
          return {
            strike,
            isATM: Math.abs(strike - (data.last_price || row.ltp || 0)) < 50,
            callLTP: ce.last_price || 0, callOI: ce.oi || 0, callVolume: ce.volume || 0,
            callIV: ce.implied_volatility || 0,
            callDelta: ce.greeks?.delta || 0, callTheta: ce.greeks?.theta || 0,
            callGamma: ce.greeks?.gamma || 0, callVega: ce.greeks?.vega || 0,
            callBid: ce.top_bid_price || 0, callAsk: ce.top_ask_price || 0,
            callPrevOI: ce.previous_oi || 0,
            callBuildup: (ce.oi || 0) > (ce.previous_oi || 0) ? 'Long' : 'Short',
            putLTP: pe.last_price || 0, putOI: pe.oi || 0, putVolume: pe.volume || 0,
            putIV: pe.implied_volatility || 0,
            putDelta: pe.greeks?.delta || 0, putTheta: pe.greeks?.theta || 0,
            putGamma: pe.greeks?.gamma || 0, putVega: pe.greeks?.vega || 0,
            putBid: pe.top_bid_price || 0, putAsk: pe.top_ask_price || 0,
            putPrevOI: pe.previous_oi || 0,
            putBuildup: (pe.oi || 0) > (pe.previous_oi || 0) ? 'Long' : 'Short',
          };
        }).sort((a, b) => a.strike - b.strike);

        // Compute PCR & Max Pain
        const totalCallOI = strikes.reduce((s, x) => s + x.callOI, 0);
        const totalPutOI = strikes.reduce((s, x) => s + x.putOI, 0);
        const pcr = totalCallOI > 0 ? +(totalPutOI / totalCallOI).toFixed(2) : 0;

        let minPain = Infinity, maxPainStrike = 0;
        strikes.forEach(s => {
          const pain = strikes.reduce((sum, x) => {
            const callPain = x.callOI * Math.max(0, s.strike - x.strike);
            const putPain = x.putOI * Math.max(0, x.strike - s.strike);
            return sum + callPain + putPain;
          }, 0);
          if (pain < minPain) { minPain = pain; maxPainStrike = s.strike; }
        });

        setLiveChain({ symbol: row.symbol, ltp: data.last_price || row.ltp, lotSize: row.lotSize, atm: data.last_price || row.ltp, strikes, pcr, maxPain: maxPainStrike });
      }
    };
    fetchChain();
    const iv = setInterval(fetchChain, 10000);
    return () => { active = false; clearInterval(iv); };
  }, [row.token, row.exchange_segment, expiry, row.ltp]);

  const chain = liveChain || { symbol: row.symbol, ltp: row.ltp || 0, lotSize: row.lotSize || 25, atm: row.ltp || 0, strikes: [], pcr: 0, maxPain: 0 };
  const atmStrike = chain.strikes.find(s => s.isATM);

  // Format expiry for display: "2026-05-01" -> "01 May"
  const fmtExp = (d) => { try { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }); } catch { return d; } };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: 1 }}>
      {/* LEFT: Option Chain */}
      <div style={{ width: '42%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
          <select value={selectedSymbol} onChange={e => setSelectedSymbol(e.target.value)}
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 12, padding: '4px 8px', fontWeight: 700, fontFamily: 'inherit' }}>
            {['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'RELIANCE', 'HDFCBANK', 'TCS', 'INFY'].map(s => <option key={s}>{s}</option>)}
          </select>
          <span style={{ fontSize: 13, fontWeight: 700, color: (row.changePct || 0) >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>
            {(row.ltp || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span style={{ fontSize: 10, color: (row.changePct || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {(row.changePct || 0) >= 0 ? '+' : ''}{(row.changePct || 0).toFixed(2)}%
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {expiries.slice(0, 5).map(e => (
              <button key={e} className={`sector-pill${expiry === e ? ' active' : ''}`}
                onClick={() => setExpiry(e)} style={{ fontSize: 9, padding: '2px 8px' }}>{fmtExp(e)}</button>
            ))}
            {expiries.length > 5 && (
              <select value={expiry} onChange={e => setExpiry(e.target.value)}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 9, padding: '1px 4px' }}>
                {expiries.map(e => <option key={e} value={e}>{fmtExp(e)}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Chain Table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 2 }}>
                <th colSpan="4" style={{ padding: '4px 8px', textAlign: 'center', color: 'var(--green)', fontSize: 9, borderBottom: '2px solid var(--green)', borderRight: '1px solid var(--border)' }}>CALLS</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', color: 'var(--text-heading)', fontSize: 9, borderBottom: '2px solid var(--cyan)' }}>STRIKE</th>
                <th colSpan="4" style={{ padding: '4px 8px', textAlign: 'center', color: 'var(--red)', fontSize: 9, borderBottom: '2px solid var(--red)', borderLeft: '1px solid var(--border)' }}>PUTS</th>
              </tr>
              <tr style={{ position: 'sticky', top: 22, background: 'var(--bg-panel)', zIndex: 2 }}>
                {['OI','IV','LTP','Δ'].map(h => <th key={'c'+h} style={{ padding: '3px 6px', fontSize: 8, color: 'var(--text-muted)', textAlign: 'right' }}>{h}</th>)}
                <th style={{ padding: '3px 6px', fontSize: 8 }}></th>
                {['Δ','LTP','IV','OI'].map(h => <th key={'p'+h} style={{ padding: '3px 6px', fontSize: 8, color: 'var(--text-muted)', textAlign: 'right' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {chain.strikes.length === 0 && (
                <tr><td colSpan="9" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                  {expiry ? 'Loading chain...' : 'Select expiry to load chain'}
                </td></tr>
              )}
              {chain.strikes.map(s => {
                const isATM = s.isATM;
                const isITMCall = s.strike < (row.ltp || 0);
                const isITMPut = s.strike > (row.ltp || 0);
                return (
                  <tr key={s.strike} style={{ borderBottom: '1px solid var(--border)', background: isATM ? 'var(--cyan-soft)' : 'transparent' }}>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', background: isITMCall ? 'rgba(38,166,154,0.05)' : 'transparent' }}>{(s.callOI / 1000).toFixed(0)}K</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 9, color: s.callIV > 25 ? 'var(--orange)' : 'var(--text-muted)' }}>{s.callIV.toFixed(1)}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--green)' }}>{s.callLTP.toFixed(2)}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}>{s.callDelta.toFixed(2)}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: isATM ? 'var(--cyan)' : 'var(--text-heading)' }}>
                      {s.strike.toLocaleString()}{isATM && <span style={{ fontSize: 7, color: 'var(--cyan)', marginLeft: 4 }}>ATM</span>}
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', borderLeft: '1px solid var(--border)' }}>{s.putDelta.toFixed(2)}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--red)' }}>{s.putLTP.toFixed(2)}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 9, color: s.putIV > 25 ? 'var(--orange)' : 'var(--text-muted)' }}>{s.putIV.toFixed(1)}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', background: isITMPut ? 'rgba(239,83,80,0.05)' : 'transparent' }}>{(s.putOI / 1000).toFixed(0)}K</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '6px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg-panel)', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
          <span>ATM: {(chain.atm || 0).toLocaleString()} | Lot: {chain.lotSize}</span>
          <span>Max Pain: <strong style={{ color: 'var(--green)' }}>{(chain.maxPain || 0).toLocaleString()}</strong></span>
          <span>PCR: <strong style={{ color: 'var(--text-heading)' }}>{chain.pcr || '—'}</strong></span>
        </div>
      </div>

      {/* CENTER: Chart placeholder */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>{row.symbol}</span>
          <span style={{ fontSize: 11, color: (row.changePct || 0) >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>
            {(row.ltp || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div style={{ flex: 1, padding: 12, position: 'relative' }}>
          <svg width="100%" height="100%" viewBox="0 0 600 300" preserveAspectRatio="none">
            {[0.2, 0.4, 0.6, 0.8].map(f => <line key={f} x1="0" y1={300*f} x2="600" y2={300*f} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,4" />)}
            {/* OI chart from chain data */}
            {chain.strikes.length > 0 && (() => {
              const maxOI = Math.max(1, ...chain.strikes.map(x => Math.max(x.callOI, x.putOI)));
              const barW = 600 / Math.max(chain.strikes.length, 1) - 1;
              return chain.strikes.map((s, i) => (
                <g key={i}>
                  <rect x={i * (barW + 1)} y={300 - (s.callOI / maxOI) * 280} width={barW / 2} height={(s.callOI / maxOI) * 280} fill="rgba(239,83,80,0.4)" />
                  <rect x={i * (barW + 1) + barW / 2} y={300 - (s.putOI / maxOI) * 280} width={barW / 2} height={(s.putOI / maxOI) * 280} fill="rgba(6,182,212,0.4)" />
                </g>
              ));
            })()}
          </svg>
          <div style={{ position: 'absolute', top: 12, left: 12, fontSize: 10, color: 'var(--text-muted)' }}>
            <span style={{ color: '#ef4444', marginRight: 12 }}>■ Call OI</span>
            <span style={{ color: '#06b6d4' }}>■ Put OI</span>
          </div>
          <div style={{ position: 'absolute', right: 16, top: 16, background: (row.changePct || 0) >= 0 ? 'var(--green)' : 'var(--red)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {(row.ltp || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg-panel)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-buy" style={{ padding: '6px 20px', fontSize: 11, borderRadius: 4 }}>BUY CE</button>
          <button className="btn-sell" style={{ padding: '6px 20px', fontSize: 11, borderRadius: 4 }}>SELL CE</button>
          <div className="separator" style={{ height: 20 }} />
          <button className="btn-buy" style={{ padding: '6px 20px', fontSize: 11, borderRadius: 4 }}>BUY PE</button>
          <button className="btn-sell" style={{ padding: '6px 20px', fontSize: 11, borderRadius: 4 }}>SELL PE</button>
          <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>
            ATM CE: <strong style={{ color: 'var(--green)' }}>₹{(atmStrike?.callLTP || 0).toFixed(2)}</strong>
            {' | '}
            ATM PE: <strong style={{ color: 'var(--red)' }}>₹{(atmStrike?.putLTP || 0).toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* RIGHT: ATM Analysis — all values from live chain */}
      <div style={{ width: '22%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>ATM Analysis</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: 11 }}>
            <div><span style={{ color: 'var(--text-muted)' }}>ATM Strike</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{(atmStrike?.strike || chain.atm || 0).toLocaleString()}</div></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Straddle</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--orange)' }}>₹{((atmStrike?.callLTP || 0) + (atmStrike?.putLTP || 0)).toFixed(2)}</div></div>
            <div><span style={{ color: 'var(--text-muted)' }}>CE IV</span><div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{(atmStrike?.callIV || 0).toFixed(1)}%</div></div>
            <div><span style={{ color: 'var(--text-muted)' }}>PE IV</span><div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{(atmStrike?.putIV || 0).toFixed(1)}%</div></div>
            <div><span style={{ color: 'var(--text-muted)' }}>PCR</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{chain.pcr || '—'}</div></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Max Pain</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{(chain.maxPain || 0).toLocaleString()}</div></div>
          </div>
        </div>

        {/* Greeks from live ATM data */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>Greeks (ATM CE)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Delta</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{(atmStrike?.callDelta || 0).toFixed(3)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Gamma</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{(atmStrike?.callGamma || 0).toFixed(4)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Theta</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--red)' }}>{(atmStrike?.callTheta || 0).toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Vega</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{(atmStrike?.callVega || 0).toFixed(2)}</span></div>
          </div>
        </div>

        {/* OI Distribution near ATM */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>OI at ATM ±3</div>
          {(() => {
            const atmIdx = chain.strikes.findIndex(s => s.isATM);
            const nearby = chain.strikes.slice(Math.max(0, atmIdx - 3), atmIdx + 4);
            const maxOI = Math.max(1, ...nearby.map(s => Math.max(s.callOI, s.putOI)));
            return nearby.map(s => (
              <div key={s.strike} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3, height: 14 }}>
                <div style={{ width: '35%', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: `${(s.callOI / maxOI) * 100}%`, height: 8, background: 'rgba(239,68,68,0.5)', borderRadius: '2px 0 0 2px', minWidth: 2 }} />
                </div>
                <div style={{ width: '30%', textAlign: 'center', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600, color: s.isATM ? 'var(--cyan)' : 'var(--text-muted)' }}>{s.strike}</div>
                <div style={{ width: '35%' }}>
                  <div style={{ width: `${(s.putOI / maxOI) * 100}%`, height: 8, background: 'rgba(6,182,212,0.5)', borderRadius: '0 2px 2px 0', minWidth: 2 }} />
                </div>
              </div>
            ));
          })()}
        </div>

        {/* Buildup */}
        <div style={{ padding: '10px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>Buildup</div>
          {(() => {
            const atmIdx = chain.strikes.findIndex(s => s.isATM);
            return chain.strikes.slice(Math.max(0, atmIdx - 2), atmIdx + 3).map(s => (
              <div key={s.strike} style={{ fontSize: 10, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{s.strike}</span>
                <span style={{ color: s.callBuildup === 'Long' ? 'var(--green)' : 'var(--red)', fontSize: 9, fontWeight: 600 }}>{s.callBuildup}</span>
                <span style={{ color: s.putBuildup === 'Long' ? 'var(--green)' : 'var(--red)', fontSize: 9, fontWeight: 600 }}>{s.putBuildup}</span>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
