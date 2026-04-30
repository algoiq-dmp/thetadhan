import { useState, useEffect } from 'react';

const MOCK_TRADES = [];
function generateTrade() {
  const symbols = ['NIFTY 25000 CE', 'NIFTY 24800 PE', 'BANKNIFTY 52000 CE', 'NIFTY 25200 PE'];
  const sides = ['BUY', 'SELL'];
  const sym = symbols[Math.floor(Math.random() * symbols.length)];
  const side = sides[Math.floor(Math.random() * 2)];
  const qty = [25, 50, 75, 100, 150, 200][Math.floor(Math.random() * 6)];
  const price = sym.includes('NIFTY 25') ? Math.round(200 + Math.random() * 150) : Math.round(300 + Math.random() * 200);
  const aggressor = Math.random() > 0.5 ? 'aggressive' : 'passive';
  return { sym, side, qty, price, aggressor, ts: Date.now() };
}

export default function OrderFlowPanel() {
  const [trades, setTrades] = useState(() => Array.from({ length: 20 }, generateTrade));
  const [filter, setFilter] = useState('all');
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const iv = setInterval(() => {
      setTrades(prev => [generateTrade(), ...prev].slice(0, 50));
    }, 1500);
    return () => clearInterval(iv);
  }, [paused]);

  const filtered = filter === 'all' ? trades : trades.filter(t => t.side.toLowerCase() === filter);

  // Aggregate buy/sell pressure
  const buyVol = trades.filter(t => t.side === 'BUY').reduce((s, t) => s + t.qty, 0);
  const sellVol = trades.filter(t => t.side === 'SELL').reduce((s, t) => s + t.qty, 0);
  const totalVol = buyVol + sellVol || 1;
  const buyPct = Math.round((buyVol / totalVol) * 100);
  const aggressiveBuy = trades.filter(t => t.side === 'BUY' && t.aggressor === 'aggressive').reduce((s, t) => s + t.qty, 0);
  const aggressiveSell = trades.filter(t => t.side === 'SELL' && t.aggressor === 'aggressive').reduce((s, t) => s + t.qty, 0);

  return (
    <div style={{ padding: 8, fontSize: 11, color: '#e2e8f0' }}>
      {/* Pressure Gauge */}
      <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2a3a', marginBottom: 8 }}>
        <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>ORDER FLOW PRESSURE</div>
        <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{ width: `${buyPct}%`, background: 'linear-gradient(90deg, #10b981, #059669)', transition: 'width 0.3s' }} />
          <div style={{ flex: 1, background: 'linear-gradient(90deg, #dc2626, #ef4444)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
          <span style={{ color: '#10b981', fontWeight: 700 }}>BUY {buyPct}% ({buyVol})</span>
          <span style={{ color: '#ef4444', fontWeight: 700 }}>SELL {100 - buyPct}% ({sellVol})</span>
        </div>
      </div>

      {/* Aggressor Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
        <div style={{ padding: '6px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', textAlign: 'center' }}>
          <div style={{ fontSize: 8, color: '#64748b' }}>🟢 Aggressive Buy</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#10b981' }}>{aggressiveBuy}</div>
        </div>
        <div style={{ padding: '6px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', textAlign: 'center' }}>
          <div style={{ fontSize: 8, color: '#64748b' }}>🔴 Aggressive Sell</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#ef4444' }}>{aggressiveSell}</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {['all', 'buy', 'sell'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            flex: 1, height: 22, borderRadius: 4, border: 'none', fontSize: 9, fontWeight: 600, cursor: 'pointer',
            background: filter === f ? (f === 'buy' ? 'rgba(16,185,129,0.15)' : f === 'sell' ? 'rgba(239,68,68,0.15)' : 'rgba(6,182,212,0.15)') : 'rgba(255,255,255,0.03)',
            color: filter === f ? (f === 'buy' ? '#10b981' : f === 'sell' ? '#ef4444' : '#06b6d4') : '#475569',
          }}>{f.toUpperCase()}</button>
        ))}
        <button onClick={() => setPaused(!paused)} style={{
          width: 28, height: 22, borderRadius: 4, border: 'none', fontSize: 10, cursor: 'pointer',
          background: paused ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)', color: paused ? '#f59e0b' : '#475569',
        }}>{paused ? '▶' : '⏸'}</button>
      </div>

      {/* Trade Tape */}
      <div style={{ maxHeight: 280, overflow: 'auto', borderRadius: 6, background: '#0a0e17', border: '1px solid #1e2a3a' }}>
        {filtered.slice(0, 30).map((t, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px', fontSize: 9,
            borderBottom: '1px solid #111827',
            background: i === 0 ? (t.side === 'BUY' ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)') : 'transparent',
          }}>
            <span style={{
              width: 4, height: 4, borderRadius: '50%',
              background: t.side === 'BUY' ? '#10b981' : '#ef4444',
              boxShadow: i === 0 ? `0 0 4px ${t.side === 'BUY' ? '#10b981' : '#ef4444'}` : 'none',
            }} />
            <span style={{ color: t.side === 'BUY' ? '#10b981' : '#ef4444', fontWeight: 700, width: 28 }}>{t.side}</span>
            <span style={{ color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.sym}</span>
            <span style={{ color: '#f8fafc', fontWeight: 600, fontFamily: 'JetBrains Mono', width: 28, textAlign: 'right' }}>{t.qty}</span>
            <span style={{ color: '#64748b', fontFamily: 'JetBrains Mono', width: 32, textAlign: 'right' }}>₹{t.price}</span>
            <span style={{ fontSize: 7, color: t.aggressor === 'aggressive' ? '#f59e0b' : '#2d3a4a', width: 8 }}>
              {t.aggressor === 'aggressive' ? '⚡' : '·'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
