import { useState, useMemo } from 'react';

const MOCK_FII = [
  { date: '18 Apr', fiiBuy: 12450, fiiSell: 10230, diiBuy: 8900, diiSell: 11200 },
  { date: '17 Apr', fiiBuy: 8900, fiiSell: 14500, diiBuy: 13200, diiSell: 7800 },
  { date: '16 Apr', fiiBuy: 15600, fiiSell: 9800, diiBuy: 7500, diiSell: 12100 },
  { date: '15 Apr', fiiBuy: 11200, fiiSell: 13400, diiBuy: 12800, diiSell: 9600 },
  { date: '14 Apr', fiiBuy: 9800, fiiSell: 8700, diiBuy: 10400, diiSell: 11300 },
  { date: '11 Apr', fiiBuy: 14200, fiiSell: 11600, diiBuy: 9100, diiSell: 13500 },
  { date: '10 Apr', fiiBuy: 7600, fiiSell: 15200, diiBuy: 14800, diiSell: 8200 },
];

const MOCK_SECTOR_FII = [
  { sector: 'Banks', fiiNet: 3200, diiNet: -1800, change: '+2.1%' },
  { sector: 'IT', fiiNet: -4500, diiNet: 3200, change: '-1.8%' },
  { sector: 'Pharma', fiiNet: 1200, diiNet: 800, change: '+0.9%' },
  { sector: 'Metal', fiiNet: -2100, diiNet: 1500, change: '-0.4%' },
  { sector: 'Auto', fiiNet: 2800, diiNet: -900, change: '+1.5%' },
  { sector: 'FMCG', fiiNet: -800, diiNet: 2100, change: '+0.3%' },
  { sector: 'Energy', fiiNet: 1600, diiNet: -400, change: '+0.7%' },
  { sector: 'Realty', fiiNet: 3400, diiNet: -2200, change: '+2.8%' },
];

export default function FIIDIIPanel() {
  const [tab, setTab] = useState('flow');

  const totals = useMemo(() => {
    const total = MOCK_FII.reduce((acc, d) => ({
      fiiBuy: acc.fiiBuy + d.fiiBuy,
      fiiSell: acc.fiiSell + d.fiiSell,
      diiBuy: acc.diiBuy + d.diiBuy,
      diiSell: acc.diiSell + d.diiSell,
    }), { fiiBuy: 0, fiiSell: 0, diiBuy: 0, diiSell: 0 });
    return { ...total, fiiNet: total.fiiBuy - total.fiiSell, diiNet: total.diiBuy - total.diiSell };
  }, []);

  const fmt = (v) => `₹${Math.abs(v / 100).toFixed(0)}Cr`;
  const fmtNet = (v) => (v >= 0 ? '+' : '-') + fmt(v);
  const clr = (v) => v >= 0 ? '#10b981' : '#ef4444';
  const maxFlow = Math.max(...MOCK_FII.map(d => Math.max(Math.abs(d.fiiBuy - d.fiiSell), Math.abs(d.diiBuy - d.diiSell))));

  return (
    <div style={{ padding: 8, fontSize: 11, color: '#e2e8f0' }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 8, color: '#64748b', fontWeight: 600 }}>🌍 FII NET (7D)</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: clr(totals.fiiNet) }}>{fmtNet(totals.fiiNet)}</div>
          <div style={{ fontSize: 8, color: '#475569' }}>Buy: {fmt(totals.fiiBuy)} | Sell: {fmt(totals.fiiSell)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 8, color: '#64748b', fontWeight: 600 }}>🏠 DII NET (7D)</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: clr(totals.diiNet) }}>{fmtNet(totals.diiNet)}</div>
          <div style={{ fontSize: 8, color: '#475569' }}>Buy: {fmt(totals.diiBuy)} | Sell: {fmt(totals.diiSell)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {['flow', 'sector'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, height: 26, borderRadius: 4, border: 'none', fontSize: 10, fontWeight: 600, cursor: 'pointer',
            background: tab === t ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)',
            color: tab === t ? '#06b6d4' : '#64748b',
          }}>{t === 'flow' ? '📊 Daily Flow' : '🏭 Sector Flow'}</button>
        ))}
      </div>

      {/* Daily Flow Tab */}
      {tab === 'flow' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {MOCK_FII.map((d, i) => {
            const fiiNet = d.fiiBuy - d.fiiSell;
            const diiNet = d.diiBuy - d.diiSell;
            return (
              <div key={i} style={{
                padding: '6px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2a3a',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>{d.date}</span>
                  <span style={{ fontSize: 9, color: clr(fiiNet + diiNet), fontWeight: 600 }}>
                    Net: {fmtNet(fiiNet + diiNet)}
                  </span>
                </div>
                {/* FII bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <span style={{ fontSize: 8, color: '#64748b', width: 22 }}>FII</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#1e2a3a', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: '50%', top: 0, height: '100%', borderRadius: 3,
                      width: `${(Math.abs(fiiNet) / maxFlow) * 50}%`,
                      ...(fiiNet >= 0 ? { background: '#10b981' } : { right: '50%', left: 'auto', background: '#ef4444' }),
                    }} />
                  </div>
                  <span style={{ fontSize: 8, fontWeight: 700, color: clr(fiiNet), width: 40, textAlign: 'right' }}>{fmtNet(fiiNet)}</span>
                </div>
                {/* DII bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 8, color: '#64748b', width: 22 }}>DII</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#1e2a3a', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: '50%', top: 0, height: '100%', borderRadius: 3,
                      width: `${(Math.abs(diiNet) / maxFlow) * 50}%`,
                      ...(diiNet >= 0 ? { background: '#3b82f6' } : { right: '50%', left: 'auto', background: '#f59e0b' }),
                    }} />
                  </div>
                  <span style={{ fontSize: 8, fontWeight: 700, color: clr(diiNet), width: 40, textAlign: 'right' }}>{fmtNet(diiNet)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sector Flow Tab */}
      {tab === 'sector' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {MOCK_SECTOR_FII.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6,
              background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2a3a',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#f8fafc' }}>
                  {s.sector}
                  <span style={{ fontSize: 8, color: clr(parseFloat(s.change)), marginLeft: 4 }}>{s.change}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 8, color: '#64748b', marginTop: 2 }}>
                  <span>FII: <span style={{ color: clr(s.fiiNet), fontWeight: 600 }}>{fmtNet(s.fiiNet)}</span></span>
                  <span>DII: <span style={{ color: clr(s.diiNet), fontWeight: 600 }}>{fmtNet(s.diiNet)}</span></span>
                </div>
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: s.fiiNet > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                fontSize: 14,
              }}>
                {s.fiiNet > 0 ? '📈' : '📉'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Source */}
      <div style={{
        marginTop: 8, padding: '4px 8px', borderRadius: 4, textAlign: 'center',
        background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)',
        fontSize: 8, color: '#8b5cf6',
      }}>
        Data via NSE Bulk Deal Feed • Updated EOD
      </div>
    </div>
  );
}

const cardStyle = {
  padding: '8px 10px', borderRadius: 6,
  background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2a3a',
};
