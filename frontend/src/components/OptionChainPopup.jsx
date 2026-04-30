import { useState, useMemo, useEffect } from 'react';
import useMarketStore from '../store/useMarketStore';
import engineConnector from '../services/engineConnector';
import { fetchAPI } from '../hooks/useSocket';

function fmt(n) {
  if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function buildupClass(b) {
  if (!b) return '';
  if (b === 'Long' || b === 'Long Build') return 'long-build';
  if (b === 'Short' || b === 'Short Build') return 'short-build';
  if (b === 'Short Cover') return 'short-cover';
  return 'long-unwind';
}

export default function OptionChainPopup({ symbol }) {
  const closeOptionChain = useMarketStore(s => s.closeOptionChain);
  const universe = useMarketStore(s => s.universe);
  const openOrderEntry = useMarketStore(s => s.openOrderEntry);
  const row = universe.find(r => r.symbol === symbol);
  
  const [chain, setChain] = useState({
    symbol, ltp: row?.ltp || 0, lotSize: row?.lotSize || 65, atm: row?.ltp || 0,
    expiry: '', strikes: [],
  });
  const [expiries, setExpiries] = useState([]);
  const [selectedExpiry, setSelectedExpiry] = useState('');

  // Fetch live expiry list
  useEffect(() => {
    const fetchExp = async () => {
      const list = await engineConnector.getExpiryList(row?.token || 13, row?.exchange_segment || 'IDX_I');
      const dates = Array.isArray(list) ? list : [];
      setExpiries(dates);
      if (dates.length > 0 && !selectedExpiry) setSelectedExpiry(dates[0]);
    };
    fetchExp();
  }, [symbol, row?.token]);

  useEffect(() => {
    if (!selectedExpiry) return;
    let active = true;
    const fetchChain = async () => {
      const rawData = await engineConnector.getOptionChain(
        row?.token || 13,
        row?.exchange_segment || 'IDX_I',
        selectedExpiry
      );
      if (!active || !rawData) return;
      // Unwrap double-wrapping
      const data = rawData.oc ? rawData : (rawData.data || rawData);

      if (data.oc && typeof data.oc === 'object') {
        const strikes = Object.entries(data.oc).map(([strikeStr, opts]) => {
          const strike = parseFloat(strikeStr);
          const ce = opts.ce || {};
          const pe = opts.pe || {};
          return {
            strike,
            isATM: Math.abs(strike - (data.last_price || row?.ltp || 0)) < 50,
            callLTP: ce.last_price || 0, callOI: ce.oi || 0,
            callIV: ce.implied_volatility || 0,
            callDelta: ce.greeks?.delta || 0, callTheta: ce.greeks?.theta || 0,
            callGamma: ce.greeks?.gamma || 0, callVega: ce.greeks?.vega || 0,
            callBid: ce.top_bid_price || 0, callAsk: ce.top_ask_price || 0,
            callPrevOI: ce.previous_oi || 0,
            callBuildup: (ce.oi || 0) > (ce.previous_oi || 0) ? 'Long' : 'Short',
            putLTP: pe.last_price || 0, putOI: pe.oi || 0,
            putIV: pe.implied_volatility || 0,
            putDelta: pe.greeks?.delta || 0, putTheta: pe.greeks?.theta || 0,
            putGamma: pe.greeks?.gamma || 0, putVega: pe.greeks?.vega || 0,
            putBid: pe.top_bid_price || 0, putAsk: pe.top_ask_price || 0,
            putPrevOI: pe.previous_oi || 0,
            putBuildup: (pe.oi || 0) > (pe.previous_oi || 0) ? 'Long' : 'Short',
          };
        }).sort((a, b) => a.strike - b.strike);

        setChain({
          symbol, ltp: data.last_price || row?.ltp || 0,
          lotSize: row?.lotSize || 65,
          atm: data.last_price || row?.ltp || 0,
          expiry: selectedExpiry, strikes,
        });
      }
    };
    fetchChain();
    const iv = setInterval(fetchChain, 10000);
    return () => { active = false; clearInterval(iv); };
  }, [symbol, row?.token, selectedExpiry]);

  const [selectedStrike, setSelectedStrike] = useState(null);
  const [selectedSide, setSelectedSide] = useState(null);
  const [qty, setQty] = useState(row?.lotSize || 100);
  const [orderType, setOrderType] = useState('MKT');
  const [product, setProduct] = useState('MIS');
  const [selectedStrikes, setSelectedStrikes] = useState(new Set());
  const [groupMode, setGroupMode] = useState(false);
  const [strikeRange, setStrikeRange] = useState(20); // ATM ± N strikes

  // Filter strikes around ATM
  const displayStrikes = (() => {
    if (!chain.strikes.length) return [];
    const atmIdx = chain.strikes.findIndex(s => s.isATM);
    if (atmIdx < 0 || strikeRange >= chain.strikes.length) return chain.strikes;
    const start = Math.max(0, atmIdx - strikeRange);
    const end = Math.min(chain.strikes.length, atmIdx + strikeRange + 1);
    return chain.strikes.slice(start, end);
  })();

  const handleClickLTP = (strike, side) => {
    setSelectedStrike(strike);
    setSelectedSide(side);
    setQty(row?.lotSize || 100);
  };

  const toggleStrikeSelect = (strike) => {
    setSelectedStrikes(prev => {
      const next = new Set(prev);
      if (next.has(strike)) next.delete(strike); else next.add(strike);
      return next;
    });
  };

  // Quick OC macros
  const fireMacro = async (macroId) => {
    try {
      const result = await fetchAPI('/qfm/execute', {
        method: 'POST',
        body: JSON.stringify({ macroId, symbol, params: { lots: 1, distance: 5 } }),
      });
      const toast = document.createElement('div');
      toast.textContent = `⚡ ${macroId} on ${symbol} — ${result.legs?.length || 0} legs fired`;
      toast.style.cssText = 'position:fixed;top:60px;right:20px;z-index:99999;padding:12px 20px;background:#10b981;color:#fff;border-radius:8px;font-size:12px;font-weight:600;';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    } catch {
      const toast = document.createElement('div');
      toast.textContent = `📄 Paper: ${macroId} on ${symbol}`;
      toast.style.cssText = 'position:fixed;top:60px;right:20px;z-index:99999;padding:12px 20px;background:#06b6d4;color:#fff;border-radius:8px;font-size:12px;font-weight:600;';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    }
  };

  const chainMacros = useMemo(() => {
    const atm = chain.strikes.find(s => s.isATM);
    if (!atm) return [];
    return [
      { label: 'Sell ATM Straddle', icon: '⚡', action: () => fireMacro('atm-straddle-sell') },
      { label: 'Buy ATM Straddle', icon: '🛡️', action: () => fireMacro('atm-straddle-buy') },
      { label: 'Iron Condor', icon: '🦅', action: () => fireMacro('iron-condor') },
      { label: 'Bull Call Spread', icon: '📈', action: () => fireMacro('bull-call-spread') },
    ];
  }, [chain, symbol]);

  const instrument = selectedStrike
    ? `${symbol} ${selectedStrike.strike} ${selectedSide}`
    : 'Click any LTP to select';

  return (
    <div className="modal-overlay" onClick={closeOptionChain}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            🔗 {symbol} Option Chain
            <select className="expiry-select" value={selectedExpiry} onChange={e => setSelectedExpiry(e.target.value)}>
              {expiries.map(e => <option key={e} value={e}>{new Date(e + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</option>)}
            </select>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>
              Spot: {chain.ltp?.toLocaleString('en-IN')} | ATM: {chain.atm}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => setGroupMode(!groupMode)} style={{
              padding: '3px 10px', fontSize: 10, fontWeight: 600, borderRadius: 4, border: 'none', cursor: 'pointer',
              background: groupMode ? 'rgba(6,182,212,0.15)' : 'var(--bg-card)', color: groupMode ? '#06b6d4' : 'var(--text-muted)',
            }}>☑ Group</button>
            <button className="modal-close" onClick={closeOptionChain}>✕</button>
          </div>
        </div>

        {/* Quick OC Macros */}
        <div style={{ padding: '4px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, alignItems: 'center', background: 'var(--bg-card)' }}>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>QUICK:</span>
          {chainMacros.map((m, i) => (
            <button key={i} onClick={m.action} className="sector-pill" style={{ fontSize: 9, padding: '2px 8px' }}>{m.icon} {m.label}</button>
          ))}
          {selectedStrikes.size > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 9, color: '#06b6d4', fontWeight: 600 }}>
              {selectedStrikes.size} strikes selected
              <button onClick={() => alert(`Group order for ${selectedStrikes.size} strikes`)} style={{
                marginLeft: 6, padding: '2px 8px', fontSize: 9, fontWeight: 700, border: 'none', borderRadius: 4,
                cursor: 'pointer', background: 'rgba(16,185,129,0.15)', color: '#10b981',
              }}>Place Group Order</button>
            </span>
          )}
        </div>

        <div className="modal-body">
          <table className="chain-table">
            <thead>
              <tr>
                {groupMode && <th style={{ width: 24 }}></th>}
                <th className="chain-header-calls">Buildup</th>
                <th className="chain-header-calls">OI</th>
                <th className="chain-header-calls">IV</th>
                <th className="chain-header-calls">Delta</th>
                <th className="chain-header-calls">CE LTP</th>
                <th style={{ textAlign: 'center', background: 'var(--bg-card)', fontWeight: 800, fontSize: 11 }}>STRIKE</th>
                <th className="chain-header-puts">PE LTP</th>
                <th className="chain-header-puts">Delta</th>
                <th className="chain-header-puts">IV</th>
                <th className="chain-header-puts">OI</th>
                <th className="chain-header-puts">Buildup</th>
                <th style={{ width: 50, textAlign: 'center' }}>Trade</th>
              </tr>
            </thead>
            <tbody>
              {displayStrikes.map(s => (
                <tr key={s.strike} className={s.isATM ? 'atm-row' : s.isDelta01 ? 'delta-row' : ''}>
                  {groupMode && (
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedStrikes.has(s.strike)} onChange={() => toggleStrikeSelect(s.strike)} style={{ accentColor: '#06b6d4' }} />
                    </td>
                  )}
                  <td style={{ textAlign: 'left' }}>
                    <span className={`buildup-badge ${buildupClass(s.callBuildup)}`}>{s.callBuildup?.split(' ').map(w => w[0]).join('')}</span>
                  </td>
                  <td style={{ fontSize: 10 }}>{fmt(s.callOI)}</td>
                  <td>{s.callIV.toFixed(1)}</td>
                  <td>{s.callDelta.toFixed(2)}</td>
                  <td
                    onClick={() => handleClickLTP(s, 'CE')}
                    style={{ color: 'var(--green-text)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {s.callLTP.toFixed(2)}
                  </td>
                  <td className="strike-col">{s.strike}</td>
                  <td
                    onClick={() => handleClickLTP(s, 'PE')}
                    style={{ color: 'var(--red-text)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {s.putLTP.toFixed(2)}
                  </td>
                  <td>{s.putDelta.toFixed(2)}</td>
                  <td>{s.putIV.toFixed(1)}</td>
                  <td style={{ fontSize: 10 }}>{fmt(s.putOI)}</td>
                  <td style={{ textAlign: 'left' }}>
                    <span className={`buildup-badge ${buildupClass(s.putBuildup)}`}>{s.putBuildup?.split(' ').map(w => w[0]).join('')}</span>
                  </td>
                  <td style={{ padding: '2px 4px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                      <button onClick={() => openOrderEntry({ symbol: `${symbol} ${s.strike} CE`, side: 'BUY', price: s.callLTP })} style={{ padding: '1px 4px', borderRadius: 2, border: 'none', fontSize: 7, fontWeight: 700, cursor: 'pointer', background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>B</button>
                      <button onClick={() => openOrderEntry({ symbol: `${symbol} ${s.strike} CE`, side: 'SELL', price: s.callLTP })} style={{ padding: '1px 4px', borderRadius: 2, border: 'none', fontSize: 7, fontWeight: 700, cursor: 'pointer', background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>S</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Load More / Load All */}
          {chain.strikes.length > displayStrikes.length && (
            <div style={{ textAlign: 'center', padding: '8px 0', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Showing {displayStrikes.length} of {chain.strikes.length} strikes
              </span>
              <button onClick={() => setStrikeRange(r => r + 10)}
                style={{ padding: '3px 12px', fontSize: 10, fontWeight: 600, borderRadius: 4, border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.08)', color: '#06b6d4', cursor: 'pointer' }}>
                +10 More
              </button>
              <button onClick={() => setStrikeRange(9999)}
                style={{ padding: '3px 12px', fontSize: 10, fontWeight: 600, borderRadius: 4, border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.08)', color: '#06b6d4', cursor: 'pointer' }}>
                Load All
              </button>
            </div>
          )}
          {chain.strikes.length > 0 && chain.strikes.length <= displayStrikes.length && (
            <div style={{ textAlign: 'center', padding: '4px 0', fontSize: 9, color: 'var(--text-muted)' }}>
              All {chain.strikes.length} strikes shown
            </div>
          )}
        </div>

        <div className="quick-order-strip">
          <span className="order-instrument">{instrument}</span>
          <div className="order-field">
            <label>Qty</label>
            <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} />
          </div>
          <div className="order-field">
            <label>Type</label>
            <select value={orderType} onChange={e => setOrderType(e.target.value)}>
              <option value="MKT">MKT</option>
              <option value="LMT">LMT</option>
              <option value="SL">SL</option>
              <option value="SL-M">SL-M</option>
            </select>
          </div>
          <div className="order-field">
            <label>Product</label>
            <select value={product} onChange={e => setProduct(e.target.value)}>
              <option value="MIS">MIS</option>
              <option value="NRML">NRML</option>
            </select>
          </div>
          <button className="btn-buy" onClick={() => {
            if (selectedStrike) openOrderEntry({ symbol: `${symbol} ${selectedStrike.strike} ${selectedSide}`, side: 'BUY', price: selectedSide === 'CE' ? selectedStrike.callLTP : selectedStrike.putLTP });
          }}>
            BUY (B)
          </button>
          <button className="btn-sell" onClick={() => {
            if (selectedStrike) openOrderEntry({ symbol: `${symbol} ${selectedStrike.strike} ${selectedSide}`, side: 'SELL', price: selectedSide === 'CE' ? selectedStrike.callLTP : selectedStrike.putLTP });
          }}>
            SELL (S)
          </button>
        </div>
      </div>
    </div>
  );
}
