import { useState, useEffect } from 'react';
import useMarketStore from '../store/useMarketStore';
import engineConnector from '../services/engineConnector';

export default function ChainPanel() {
  const universe = useMarketStore(s => s.universe);
  const selectedIdx = useMarketStore(s => s.selectedIdx);
  const getFiltered = useMarketStore(s => s.getFiltered);
  const openOptionChain = useMarketStore(s => s.openOptionChain);

  const filtered = getFiltered();
  const sel = filtered[selectedIdx] || universe[0];

  const [chain, setChain] = useState({ symbol: sel?.symbol, ltp: sel?.ltp || 0, lotSize: sel?.lotSize || 65, atm: sel?.ltp || 0, expiry: '', strikes: [], pcr: 0, maxPain: 0 });
  const [expiries, setExpiries] = useState([]);
  const [selectedExpiry, setSelectedExpiry] = useState('');

  // Fetch expiry list
  useEffect(() => {
    if (!sel) return;
    const fetchExp = async () => {
      const list = await engineConnector.getExpiryList(sel.token || 13, sel.exchange_segment || 'IDX_I');
      const dates = Array.isArray(list) ? list : [];
      setExpiries(dates);
      if (dates.length > 0 && !selectedExpiry) setSelectedExpiry(dates[0]);
    };
    fetchExp();
  }, [sel?.token, sel?.exchange_segment]);

  // Fetch chain data
  useEffect(() => {
    if (!sel || !selectedExpiry) return;
    let active = true;
    const fetchChain = async () => {
      const rawData = await engineConnector.getOptionChain(sel.token || 13, sel.exchange_segment || 'IDX_I', selectedExpiry);
      if (!active || !rawData) return;
      const data = rawData.oc ? rawData : (rawData.data || rawData);
      if (data.oc && typeof data.oc === 'object') {
        const strikes = Object.entries(data.oc).map(([strikeStr, opts]) => {
          const strike = parseFloat(strikeStr);
          const ce = opts.ce || {}, pe = opts.pe || {};
          return {
            strike,
            isATM: Math.abs(strike - (data.last_price || sel.ltp || 0)) < 50,
            callLTP: ce.last_price || 0, callOI: ce.oi || 0,
            putLTP: pe.last_price || 0, putOI: pe.oi || 0,
          };
        }).sort((a, b) => a.strike - b.strike);
        const totalCallOI = strikes.reduce((s, x) => s + x.callOI, 0);
        const totalPutOI = strikes.reduce((s, x) => s + x.putOI, 0);
        const pcr = totalCallOI > 0 ? +(totalPutOI / totalCallOI).toFixed(2) : 0;
        let minPain = Infinity, maxPainStrike = 0;
        strikes.forEach(s => {
          const pain = strikes.reduce((sum, x) => sum + x.callOI * Math.max(0, s.strike - x.strike) + x.putOI * Math.max(0, x.strike - s.strike), 0);
          if (pain < minPain) { minPain = pain; maxPainStrike = s.strike; }
        });
        setChain({ symbol: sel.symbol, ltp: data.last_price || sel.ltp, lotSize: sel.lotSize || 65, atm: data.last_price || sel.ltp, expiry: selectedExpiry, strikes, pcr, maxPain: maxPainStrike });
      }
    };
    fetchChain();
    const iv = setInterval(fetchChain, 10000);
    return () => { active = false; clearInterval(iv); };
  }, [sel?.token, sel?.exchange_segment, selectedExpiry]);

  const fmtExp = (d) => { try { return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)' }}>{sel?.symbol}</span>
            <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', marginLeft: 8, color: (sel?.changePct || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {(sel?.ltp || 0).toFixed(2)}
            </span>
          </div>
          <button onClick={() => openOptionChain(sel?.symbol)}
            style={{ fontSize: 9, padding: '2px 8px', border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
            Full ↗
          </button>
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
          ATM: {(chain.atm || 0).toLocaleString()} | Lot: {chain.lotSize}
          {expiries.length > 0 && (
            <select value={selectedExpiry} onChange={e => setSelectedExpiry(e.target.value)}
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-primary)', fontSize: 9, padding: '1px 4px' }}>
              {expiries.slice(0, 8).map(e => <option key={e} value={e}>{fmtExp(e)}</option>)}
            </select>
          )}
        </div>
      </div>
      <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-around', fontSize: 10 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 8 }}>MAX PAIN</div>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{(chain.maxPain || 0).toLocaleString()}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 8 }}>PCR</div>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{chain.pcr || '—'}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 8 }}>STRADDLE</div>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--orange)' }}>
            ₹{((chain.strikes.find(s => s.isATM)?.callLTP || 0) + (chain.strikes.find(s => s.isATM)?.putLTP || 0)).toFixed(0)}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
          <thead>
            <tr style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1 }}>
              <th style={{ padding: '4px 6px', fontSize: 8, color: 'var(--green)', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>CE ₹</th>
              <th style={{ padding: '4px 6px', fontSize: 8, color: 'var(--text-muted)', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>Strike</th>
              <th style={{ padding: '4px 6px', fontSize: 8, color: 'var(--red)', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>PE ₹</th>
            </tr>
          </thead>
          <tbody>
            {chain.strikes.length === 0 && (
              <tr><td colSpan="3" style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 10 }}>Loading chain...</td></tr>
            )}
            {chain.strikes.map(s => (
              <tr key={s.strike} style={{ borderBottom: '1px solid var(--border)', background: s.isATM ? 'var(--cyan-soft)' : 'transparent', cursor: 'pointer' }}>
                <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--green)' }}>{s.callLTP.toFixed(2)}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: s.isATM ? 'var(--cyan)' : 'var(--text-heading)' }}>{s.strike}</td>
                <td style={{ padding: '4px 6px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--red)' }}>{s.putLTP.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
