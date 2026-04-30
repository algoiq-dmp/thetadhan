import { useState, useEffect } from 'react';
import engineConnector from '../services/engineConnector';

export default function PortfolioPanel() {
  const [tab, setTab] = useState('positions');
  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const [p, t] = await Promise.all([
        engineConnector.getPositions(),
        engineConnector.getTrades()
      ]);
      setPositions((p || []).filter(pos => pos.positionType !== 'CLOSED'));
      setTrades(t || []);
    };
    fetchData();
    const iv = setInterval(fetchData, 10000);
    return () => clearInterval(iv);
  }, []);

  const totalPnl = positions.reduce((s, p) => s + (p.unrealizedProfit || 0) + (p.realizedProfit || 0), 0);
  const totalWinners = positions.filter(p => (p.unrealizedProfit || 0) + (p.realizedProfit || 0) > 0).length;
  const exposure = positions.reduce((s, p) => s + Math.abs(((p.buyQty || 0) - (p.sellQty || 0)) * (p.buyAvg || p.sellAvg || 0)), 0);

  // Derive daily P&L from trades grouped by date
  const dailyPnl = (() => {
    const grouped = {};
    trades.forEach(t => {
      const date = (t.createTime || '').split(' ')[0] || 'Today';
      if (!grouped[date]) grouped[date] = { date, pnl: 0, trades: 0, winners: 0 };
      grouped[date].trades++;
      // approximate P&L from traded price and quantity
      const val = (t.tradedPrice || t.price || 0) * (t.tradedQuantity || t.quantity || 0);
      const sign = t.transactionType === 'SELL' ? 1 : -1;
      grouped[date].pnl += val * sign * 0.01; // rough approximation
      if (val * sign > 0) grouped[date].winners++;
    });
    return Object.values(grouped).slice(0, 7);
  })();

  const weekPnl = dailyPnl.reduce((s, d) => s + d.pnl, 0) || totalPnl;
  const maxPnl = Math.max(1, ...dailyPnl.map(d => Math.abs(d.pnl)));

  const fmt = (v) => (v >= 0 ? '+' : '') + '₹' + Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const clr = (v) => v >= 0 ? '#10b981' : '#ef4444';

  return (
    <div style={{ padding: 8, fontSize: 11, color: '#e2e8f0' }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>TODAY P&L</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: clr(totalPnl) }}>{fmt(totalPnl)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>TRADES TODAY</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#06b6d4' }}>{trades.length}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>WIN RATE</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#06b6d4' }}>{totalWinners}/{positions.length || 1} ({Math.round(totalWinners / (positions.length || 1) * 100)}%)</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>EXPOSURE</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>₹{(exposure / 100000).toFixed(1)}L</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {['positions', 'greeks', 'history'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, height: 26, borderRadius: 4, border: 'none', fontSize: 10, fontWeight: 600, cursor: 'pointer',
            background: tab === t ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)',
            color: tab === t ? '#06b6d4' : '#64748b',
          }}>{t === 'positions' ? '📊 Positions' : t === 'greeks' ? '🔬 Greeks' : '📅 History'}</button>
        ))}
      </div>

      {/* Positions Tab */}
      {tab === 'positions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {positions.length === 0 && <div style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>No open positions</div>}
          {positions.map((p, i) => {
            const netQty = (p.buyQty || 0) - (p.sellQty || 0);
            const isLong = netQty > 0;
            const pnl = (p.unrealizedProfit || 0) + (p.realizedProfit || 0);
            const avg = isLong ? p.buyAvg : p.sellAvg;
            
            return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6,
              background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2a3a',
            }}>
              <div style={{
                width: 4, height: 28, borderRadius: 2,
                background: isLong ? '#10b981' : '#ef4444',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#f8fafc' }}>
                  {p.tradingSymbol || p.securityId}
                </div>
                <div style={{ fontSize: 9, color: '#64748b' }}>
                  {isLong ? 'BUY' : 'SELL'} {Math.abs(netQty)} @ ₹{(avg || 0).toFixed(2)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: clr(pnl) }}>{fmt(pnl)}</div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Greeks Tab — Available from Dhan v2 Option Chain */}
      {tab === 'greeks' && (
        <div style={{ padding: 12, color: '#64748b' }}>
          <div style={{ fontSize: 10, textAlign: 'center', marginBottom: 12, color: '#06b6d4', fontWeight: 600 }}>
            📡 Greeks available from Dhan v2 Option Chain
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: 'Net Delta', icon: 'Δ', color: '#06b6d4', value: positions.length > 0 ? '—' : '0' },
              { label: 'Net Gamma', icon: 'Γ', color: '#8b5cf6', value: positions.length > 0 ? '—' : '0' },
              { label: 'Net Theta', icon: 'Θ', color: '#ef4444', value: positions.length > 0 ? '—' : '0' },
              { label: 'Net Vega', icon: 'V', color: '#10b981', value: positions.length > 0 ? '—' : '0' },
            ].map(g => (
              <div key={g.label} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: `${g.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: g.color }}>
                  {g.icon}
                </div>
                <div>
                  <div style={{ fontSize: 8, color: '#64748b', fontWeight: 600 }}>{g.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>{g.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Tab — Live Trades */}
      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {trades.length === 0 && <div style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>No trades for today</div>}
          {trades.slice(0, 15).map((t, i) => {
            const pnl = (t.tradedPrice || t.price || 0) * (t.tradedQuantity || t.quantity || 0);
            const isBuy = t.transactionType === 'BUY';
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2a3a',
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', width: 42 }}>{(t.createTime || '').split(' ')[1] || '—'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#f8fafc' }}>{t.tradingSymbol || t.securityId}</div>
                  <div style={{ fontSize: 8, color: isBuy ? '#10b981' : '#ef4444', fontWeight: 700 }}>{t.transactionType} × {t.tradedQuantity || t.quantity}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 60 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>₹{(t.tradedPrice || t.price || 0).toFixed(2)}</div>
                  <div style={{ fontSize: 8, color: '#64748b' }}>{t.orderStatus || 'TRADED'}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Powered by Dhan */}
      <div style={{
        marginTop: 8, padding: '4px 8px', borderRadius: 4, textAlign: 'center',
        background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)',
        fontSize: 9, color: '#8b5cf6', fontWeight: 600,
      }}>
        📡 Live Data — Dhan API
      </div>
    </div>
  );
}

const cardStyle = {
  padding: '8px 10px', borderRadius: 6,
  background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2a3a',
};
