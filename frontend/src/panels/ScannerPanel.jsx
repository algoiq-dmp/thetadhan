import { useState } from 'react';
import useMarketStore from '../store/useMarketStore';

const SCANNER_TYPES = ['Gainers', 'Losers', 'Volume', 'OI Change', '52W High', '52W Low'];

export default function ScannerPanel() {
  const [scannerType, setScannerType] = useState('Gainers');
  const universe = useMarketStore(s => s.universe);
  const openChart = useMarketStore(s => s.openChart);
  const openOrderEntry = useMarketStore(s => s.openOrderEntry);

  let sorted = [...universe];
  switch (scannerType) {
    case 'Gainers': sorted.sort((a, b) => b.changePct - a.changePct); break;
    case 'Losers': sorted.sort((a, b) => a.changePct - b.changePct); break;
    case 'Volume': sorted.sort((a, b) => b.volume - a.volume); break;
    case 'OI Change': sorted.sort((a, b) => (b.oi || 0) - (a.oi || 0)); break;
    case '52W High': sorted.sort((a, b) => b.ltp - a.ltp); break;
    case '52W Low': sorted.sort((a, b) => a.ltp - b.ltp); break;
  }
  const rows = sorted.slice(0, 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
        <select value={scannerType} onChange={e => setScannerType(e.target.value)}
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 11, padding: '3px 6px', fontFamily: 'inherit' }}>
          {SCANNER_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="icon-btn" style={{ width: 24, height: 24, fontSize: 11 }} title="Filter">⚙</button>
          <button className="icon-btn" style={{ width: 24, height: 24, fontSize: 11 }} title="Refresh">↻</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Symbol</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-muted)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>LTP</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-muted)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Chg</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-muted)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Chg%</th>
              <th style={{ padding: '6px 4px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 9, fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Trade</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.symbol} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                onClick={() => openChart(r.symbol)}>
                <td style={{ padding: '5px 8px', fontWeight: 600, color: 'var(--cyan)', fontSize: 11 }}>{r.symbol}</td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{r.ltp.toFixed(2)}</td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: r.change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {r.change >= 0 ? '+' : ''}{r.change.toFixed(2)}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: r.changePct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {r.changePct.toFixed(2)}%
                </td>
                <td style={{ padding: '3px 4px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <button onClick={e => { e.stopPropagation(); openOrderEntry({ symbol: r.symbol, side: 'BUY', price: r.ltp }); }} style={{ padding: '1px 5px', borderRadius: 2, border: 'none', fontSize: 8, fontWeight: 700, cursor: 'pointer', background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>B</button>
                    <button onClick={e => { e.stopPropagation(); openOrderEntry({ symbol: r.symbol, side: 'SELL', price: r.ltp }); }} style={{ padding: '1px 5px', borderRadius: 2, border: 'none', fontSize: 8, fontWeight: 700, cursor: 'pointer', background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>S</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
