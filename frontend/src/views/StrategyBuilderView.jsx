import { useState } from 'react';

const STRATEGIES = [
  { name: 'Long Straddle', legs: [{ type: 'CE', side: 'BUY', strike: 0, qty: 1 }, { type: 'PE', side: 'BUY', strike: 0, qty: 1 }], desc: 'Buy ATM CE + ATM PE — profit from big moves' },
  { name: 'Short Straddle', legs: [{ type: 'CE', side: 'SELL', strike: 0, qty: 1 }, { type: 'PE', side: 'SELL', strike: 0, qty: 1 }], desc: 'Sell ATM CE + ATM PE — profit from low volatility' },
  { name: 'Iron Condor', legs: [{ type: 'CE', side: 'SELL', strike: 100, qty: 1 }, { type: 'CE', side: 'BUY', strike: 200, qty: 1 }, { type: 'PE', side: 'SELL', strike: -100, qty: 1 }, { type: 'PE', side: 'BUY', strike: -200, qty: 1 }], desc: '4-leg bounded risk — collect premium in range' },
  { name: 'Bull Call Spread', legs: [{ type: 'CE', side: 'BUY', strike: 0, qty: 1 }, { type: 'CE', side: 'SELL', strike: 200, qty: 1 }], desc: 'Buy low CE, sell high CE — limited risk bullish' },
  { name: 'Bear Put Spread', legs: [{ type: 'PE', side: 'BUY', strike: 0, qty: 1 }, { type: 'PE', side: 'SELL', strike: -200, qty: 1 }], desc: 'Buy high PE, sell low PE — limited risk bearish' },
  { name: 'Long Strangle', legs: [{ type: 'CE', side: 'BUY', strike: 200, qty: 1 }, { type: 'PE', side: 'BUY', strike: -200, qty: 1 }], desc: 'Buy OTM CE + OTM PE — cheaper than straddle' },
];

export default function StrategyBuilderView() {
  const [selected, setSelected] = useState(STRATEGIES[0]);
  const [atm, setAtm] = useState(24200);
  const [lots, setLots] = useState(1);
  const lotSize = 75;

  // Calculate payoff
  const strikes = selected.legs.map(l => atm + l.strike);
  const minStrike = Math.min(...strikes) - 500;
  const maxStrike = Math.max(...strikes) + 500;
  const points = Array.from({ length: 50 }, (_, i) => {
    const spot = minStrike + (i / 49) * (maxStrike - minStrike);
    let pnl = 0;
    selected.legs.forEach(l => {
      const strike = atm + l.strike;
      const premium = Math.abs(l.strike) < 50 ? 180 : Math.abs(l.strike) < 150 ? 120 : 60;
      const mult = l.side === 'BUY' ? 1 : -1;
      if (l.type === 'CE') {
        const intrinsic = Math.max(0, spot - strike);
        pnl += (intrinsic - premium) * mult * l.qty * lots * lotSize;
      } else {
        const intrinsic = Math.max(0, strike - spot);
        pnl += (intrinsic - premium) * mult * l.qty * lots * lotSize;
      }
    });
    return { spot, pnl };
  });

  const maxProfit = Math.max(...points.map(p => p.pnl));
  const maxLoss = Math.min(...points.map(p => p.pnl));
  const breakevens = [];
  for (let i = 1; i < points.length; i++) {
    if ((points[i-1].pnl <= 0 && points[i].pnl > 0) || (points[i-1].pnl >= 0 && points[i].pnl < 0)) {
      breakevens.push(Math.round(points[i].spot));
    }
  }

  const pnlRange = Math.max(Math.abs(maxProfit), Math.abs(maxLoss)) || 1;

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* LEFT: Strategy Selector */}
      <div style={{ width: 260, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', fontSize: 12, fontWeight: 700, color: 'var(--text-heading)' }}>
          🎯 Strategy Templates
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {STRATEGIES.map(s => (
            <div key={s.name} onClick={() => setSelected(s)}
              style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                background: selected.name === s.name ? 'var(--bg-row-selected)' : 'transparent' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 2 }}>{s.name}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{s.legs.length} legs · {s.desc}</div>
            </div>
          ))}
        </div>

        {/* Config */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <div className="order-field" style={{ flex: 1 }}>
              <label>ATM Strike</label>
              <input type="number" value={atm} onChange={e => setAtm(+e.target.value)} step={50} style={{ width: '100%' }} />
            </div>
            <div className="order-field" style={{ flex: 1 }}>
              <label>Lots</label>
              <input type="number" value={lots} onChange={e => setLots(+e.target.value)} min={1} max={50} style={{ width: '100%' }} />
            </div>
          </div>
          <button className="btn-buy" style={{ width: '100%', padding: '8px', fontSize: 11, borderRadius: 4 }}>
            ⚡ Execute Strategy
          </button>
        </div>
      </div>

      {/* CENTER: Payoff Diagram */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>{selected.name}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{selected.legs.length} legs · {lots}× lots · ATM {atm}</span>
        </div>

        {/* Payoff Chart */}
        <div style={{ flex: 1, padding: 16 }}>
          <svg width="100%" height="100%" viewBox="0 0 600 350" preserveAspectRatio="xMidYMid meet">
            {/* Zero line */}
            <line x1="20" y1="175" x2="580" y2="175" stroke="var(--text-muted)" strokeWidth="0.5" strokeDasharray="4,4" />
            {/* Grid */}
            {[-0.75,-0.5,-0.25,0.25,0.5,0.75].map(f => (
              <line key={f} x1="20" y1={175 - f * 150} x2="580" y2={175 - f * 150} stroke="var(--border)" strokeWidth="0.3" strokeDasharray="2,4" />
            ))}
            {/* ATM line */}
            <line x1={20 + ((atm - minStrike) / (maxStrike - minStrike)) * 560} y1="10" x2={20 + ((atm - minStrike) / (maxStrike - minStrike)) * 560} y2="340" stroke="var(--cyan)" strokeWidth="0.5" strokeDasharray="4,4" />
            <text x={20 + ((atm - minStrike) / (maxStrike - minStrike)) * 560} y="345" textAnchor="middle" fill="var(--cyan)" fontSize="8">ATM {atm}</text>

            {/* Payoff line */}
            {points.map((p, i) => {
              if (i === 0) return null;
              const x1 = 20 + ((points[i-1].spot - minStrike) / (maxStrike - minStrike)) * 560;
              const x2 = 20 + ((p.spot - minStrike) / (maxStrike - minStrike)) * 560;
              const y1 = 175 - (points[i-1].pnl / pnlRange) * 140;
              const y2 = 175 - (p.pnl / pnlRange) * 140;
              const color = p.pnl >= 0 ? 'var(--green)' : 'var(--red)';
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2.5" />;
            })}

            {/* Fill green/red areas */}
            <polygon
              points={points.map(p => `${20 + ((p.spot - minStrike) / (maxStrike - minStrike)) * 560},${175 - (Math.max(0, p.pnl) / pnlRange) * 140}`).join(' ') + ` 580,175 20,175`}
              fill="rgba(16,185,129,0.1)" />
            <polygon
              points={points.map(p => `${20 + ((p.spot - minStrike) / (maxStrike - minStrike)) * 560},${175 - (Math.min(0, p.pnl) / pnlRange) * 140}`).join(' ') + ` 580,175 20,175`}
              fill="rgba(239,68,68,0.08)" />

            <text x="10" y="12" fill="var(--text-muted)" fontSize="8">P&L (₹)</text>
            <text x="560" y="345" fill="var(--text-muted)" fontSize="8">Spot</text>
          </svg>
        </div>

        {/* Stats Bar */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-panel)', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, fontSize: 11 }}>
          <div><span style={{ color: 'var(--text-muted)', fontSize: 9 }}>MAX PROFIT</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{maxProfit > 900000 ? '∞' : `₹${(maxProfit/1000).toFixed(0)}K`}</div></div>
          <div><span style={{ color: 'var(--text-muted)', fontSize: 9 }}>MAX LOSS</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>{maxLoss < -900000 ? '∞' : `₹${(maxLoss/1000).toFixed(0)}K`}</div></div>
          <div><span style={{ color: 'var(--text-muted)', fontSize: 9 }}>BREAKEVEN</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{breakevens.join(', ') || '—'}</div></div>
          <div><span style={{ color: 'var(--text-muted)', fontSize: 9 }}>R:R RATIO</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{maxLoss !== 0 ? Math.abs(maxProfit / maxLoss).toFixed(2) : '∞'}:1</div></div>
          <div><span style={{ color: 'var(--text-muted)', fontSize: 9 }}>LEGS</span><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{selected.legs.length} × {lots} lot</div></div>
        </div>
      </div>

      {/* RIGHT: Leg Details */}
      <div style={{ width: 220, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border)' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', fontSize: 11, fontWeight: 700, color: 'var(--text-heading)' }}>
          Position Legs
        </div>
        {selected.legs.map((l, i) => (
          <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3,
                background: l.side === 'BUY' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: l.side === 'BUY' ? 'var(--green)' : 'var(--red)' }}>{l.side}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-heading)' }}>{atm + l.strike} {l.type}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', fontSize: 9, color: 'var(--text-muted)' }}>
              <span>Strike: {atm + l.strike}</span>
              <span>Qty: {l.qty * lots * lotSize}</span>
              <span>Premium: ~₹{Math.abs(l.strike) < 50 ? 180 : Math.abs(l.strike) < 150 ? 120 : 60}</span>
              <span>Delta: {l.side === 'BUY' ? '0.5' : '-0.5'}</span>
            </div>
          </div>
        ))}

        {/* Greeks Summary */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', marginTop: 'auto', background: 'var(--bg-card)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>Net Greeks</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', fontSize: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Delta</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>0.02</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Gamma</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>0.006</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Theta</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--red)' }}>-25.4</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Vega</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>16.8</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
