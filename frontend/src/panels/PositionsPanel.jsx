import { useState, useEffect } from 'react';
import useMarketStore from '../store/useMarketStore';
import engineConnector from '../services/engineConnector';

function calcM2M(positions, type) {
  return positions.reduce((sum, p) => {
    if (type === 'intraday') {
      if (p.positionType === 'CLOSED') return sum;
      return sum + (p.unrealizedProfit || 0) + (p.realizedProfit || 0);
    } else if (type === 'today') {
      return sum + (p.unrealizedProfit || 0) + (p.realizedProfit || 0);
    } else if (type === 'expiry') {
      return sum + (p.unrealizedProfit || 0) + (p.realizedProfit || 0);
    }
    return sum;
  }, 0);
}

export default function PositionsPanel() {
  const [tab, setTab] = useState('open');
  const [m2mType, setM2mType] = useState('intraday');
  const [positions, setPositions] = useState([]);
  const openOrderEntry = useMarketStore(s => s.openOrderEntry);

  useEffect(() => {
    const fetchPos = async () => {
      const data = await engineConnector.getPositions();
      setPositions(data);
    };
    fetchPos();
    const iv = setInterval(fetchPos, 5000); // 5 sec polling for live PnL updates
    return () => clearInterval(iv);
  }, []);

  const intradayM2M = calcM2M(positions, 'intraday');
  const todayM2M = calcM2M(positions, 'today');
  const expiryM2M = calcM2M(positions, 'expiry');

  const winners = positions.filter(p => (p.unrealizedProfit + p.realizedProfit) > 0).length;
  const losers = positions.filter(p => (p.unrealizedProfit + p.realizedProfit) < 0).length;
  const overnight = positions.filter(p => p.productType === 'MARGIN');
  
  const displayPositions = tab === 'overnight' ? overnight : 
                           tab === 'closed' ? positions.filter(p => p.positionType === 'CLOSED') : 
                           positions.filter(p => p.positionType !== 'CLOSED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        {['open', 'closed', 'overnight'].map(t => (
          <button key={t} className={`panel-tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)} style={{ flex: 1, fontSize: 10, textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>

      {/* 3-Type M2M Summary */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          {[
            { id: 'intraday', label: '📈 Intraday', value: intradayM2M },
            { id: 'today', label: '📊 Today', value: todayM2M },
            { id: 'expiry', label: '📅 Expiry', value: expiryM2M },
          ].map(m => (
            <button key={m.id}
              onClick={() => setM2mType(m.id)}
              style={{
                flex: 1, padding: '4px 4px', fontSize: 9, fontWeight: 700, borderRadius: 4, cursor: 'pointer',
                border: m2mType === m.id ? '1px solid var(--cyan)' : '1px solid var(--border)',
                background: m2mType === m.id ? 'var(--cyan-soft)' : 'transparent',
                color: m2mType === m.id ? 'var(--cyan)' : 'var(--text-muted)',
                textAlign: 'center'
              }}>
              <div style={{ fontSize: 8 }}>{m.label}</div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: m.value >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 800 }}>
                {m.value >= 0 ? '+' : ''}₹{m.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 9, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--green)' }}>✅ {winners}W</span>
          <span style={{ color: 'var(--red)' }}>❌ {losers}L</span>
          <span>📊 {positions.length} pos</span>
          <span style={{ color: 'var(--orange)' }}>🌙 {overnight.length} overnight</span>
        </div>
      </div>

      {/* Positions List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {displayPositions.map((p, i) => {
          const netQty = (p.buyQty || 0) - (p.sellQty || 0);
          const absQty = Math.abs(netQty);
          const isLong = netQty > 0;
          
          let pnl;
          if (m2mType === 'intraday') pnl = p.productType === 'MARGIN' ? 0 : (p.unrealizedProfit || 0) + (p.realizedProfit || 0);
          else pnl = (p.unrealizedProfit || 0) + (p.realizedProfit || 0);

          const avgPrice = isLong ? p.buyAvg : p.sellAvg;
          const isOvernight = p.productType === 'MARGIN';

          return (
            <div key={i} style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isOvernight && <span style={{ fontSize: 8, color: 'var(--orange)' }}>🌙</span>}
                  <span style={{ fontSize: 11, fontWeight: 600, color: isLong ? 'var(--green)' : 'var(--red)' }}>
                    {isLong ? '🟢' : '🔴'} {p.tradingSymbol || p.securityId}
                  </span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 9, color: 'var(--text-muted)' }}>
                <span>Qty: {absQty}</span>
                <span>Avg: ₹{(avgPrice || 0).toFixed(2)}</span>
                <span>{p.positionType}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                  {p.positionType !== 'CLOSED' && (
                    <>
                      <button onClick={() => openOrderEntry({ symbol: p.tradingSymbol, side: isLong ? 'SELL' : 'BUY', price: 0 })} style={{ padding: '1px 6px', borderRadius: 3, border: 'none', fontSize: 8, fontWeight: 700, cursor: 'pointer', background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>Exit</button>
                      <button onClick={() => openOrderEntry({ symbol: p.tradingSymbol, side: isLong ? 'BUY' : 'SELL', price: 0 })} style={{ padding: '1px 6px', borderRadius: 3, border: 'none', fontSize: 8, fontWeight: 700, cursor: 'pointer', background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Add</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Panic Buttons */}
      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', gap: 4 }}>
        <button style={{ flex: 1, padding: '6px 4px', fontSize: 9, fontWeight: 700, border: '1px solid var(--red)', borderRadius: 4, background: 'rgba(239,68,68,0.1)', color: 'var(--red)', cursor: 'pointer' }}
          onClick={() => { if (confirm('⚠️ EXIT ALL positions? This will square off everything.')) { import('../hooks/useSocket').then(m => m.fetchAPI('/qfm/execute', { method: 'POST', body: JSON.stringify({ macroId: 'exit-all', symbol: 'ALL', params: {} }) })).catch(() => console.log('📄 Paper: Exit All')); } }}>⛔ EXIT ALL</button>
        <button style={{ flex: 1, padding: '6px 4px', fontSize: 9, fontWeight: 700, border: '1px solid var(--orange)', borderRadius: 4, background: 'rgba(245,158,11,0.1)', color: 'var(--orange)', cursor: 'pointer' }}
          onClick={() => { if (confirm('⚠️ REVERSE ALL positions?')) { console.log('📄 Reverse All triggered'); } }}>🔄 REVERSE</button>
        <button style={{ flex: 1, padding: '6px 4px', fontSize: 9, fontWeight: 700, border: '1px solid var(--blue)', borderRadius: 4, background: 'rgba(59,130,246,0.1)', color: 'var(--blue)', cursor: 'pointer' }}
          onClick={() => { if (confirm('🛡️ HEDGE ALL naked positions?')) { console.log('📄 Hedge All triggered'); } }}>🛡️ HEDGE</button>
      </div>
    </div>
  );
}
