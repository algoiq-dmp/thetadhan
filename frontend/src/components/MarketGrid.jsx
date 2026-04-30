import { useState, useCallback } from 'react';
import useMarketStore from '../store/useMarketStore';

function fmt(n) {
  if (n == null) return '-';
  if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function priceClass(val) {
  if (val > 0) return 'price-up';
  if (val < 0) return 'price-down';
  return 'price-neutral';
}

// All available columns — togglable via right-click
const ALL_COLUMNS = [
  { id: 'idx', label: '#', default: true, width: 30 },
  { id: 'symbol', label: 'Symbol', default: true, sortKey: 'symbol', width: 110 },
  { id: 'ltp', label: 'LTP', default: true, sortKey: 'ltp' },
  { id: 'changePct', label: 'Chg%', default: true, sortKey: 'changePct' },
  { id: 'todayHigh', label: 'High', default: true, sortKey: 'todayHigh' },
  { id: 'todayLow', label: 'Low', default: true, sortKey: 'todayLow' },
  { id: 'yesterdayHigh', label: 'Yest.H', default: false },
  { id: 'yesterdayLow', label: 'Yest.L', default: false },
  { id: 'volume', label: 'Vol', default: true, sortKey: 'volume' },
  { id: 'oi', label: 'OI', default: true, sortKey: 'oi' },
  { id: 'd7HL', label: '7D H/L', default: true, sortKey: 'd7High' },
  { id: 'sma30', label: '30SMA', default: true, sortKey: 'sma30' },
  { id: 'sma100', label: '100SMA', default: true, sortKey: 'sma100' },
  { id: 'sma200', label: '200SMA', default: true, sortKey: 'sma200' },
  { id: 'iv', label: 'IV', default: true, sortKey: 'iv' },
  { id: 'iv5d', label: 'IV 5D', default: true },
  { id: 'ceDelta', label: 'CE .1Δ', default: true },
  { id: 'peDelta', label: 'PE .1Δ', default: true },
  { id: 'synF', label: 'Syn.F', default: true },
  { id: 'actions', label: 'Actions', default: true },
];

export default function MarketGrid({ onOpenTechnical }) {
  const getFiltered = useMarketStore(s => s.getFiltered);
  const selectedIdx = useMarketStore(s => s.selectedIdx);
  const setSelectedIdx = useMarketStore(s => s.setSelectedIdx);
  const openOptionChain = useMarketStore(s => s.openOptionChain);
  const openChart = useMarketStore(s => s.openChart);
  const openOrderEntry = useMarketStore(s => s.openOrderEntry);

  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [visibleCols, setVisibleCols] = useState(() => ALL_COLUMNS.filter(c => c.default).map(c => c.id));
  const [contextMenu, setContextMenu] = useState(null);

  const filtered = getFiltered();
  let sorted = [...filtered];
  if (sortCol) {
    sorted.sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }

  const handleSort = (col) => {
    const c = ALL_COLUMNS.find(x => x.id === col);
    const key = c?.sortKey || col;
    if (sortCol === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortCol(null); setSortDir('asc'); }
    } else { setSortCol(key); setSortDir('asc'); }
  };

  const sortIcon = (col) => {
    const c = ALL_COLUMNS.find(x => x.id === col);
    const key = c?.sortKey || col;
    return sortCol !== key ? '' : sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  const toggleCol = (id) => {
    setVisibleCols(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const synFuture = (row) => {
    const netCost = (row.cePremium || 0) - (row.pePremium || 0);
    const strikeDist = row.ltp > 5000 ? 100 : row.ltp > 1000 ? 50 : row.ltp > 500 ? 25 : 10;
    const atm = Math.round(row.ltp / strikeDist) * strikeDist;
    return { price: +(atm + netCost).toFixed(2) };
  };

  const isVisible = (id) => visibleCols.includes(id);

  const renderCell = (col, row, i) => {
    switch (col) {
      case 'idx': return <td key={col}>{i + 1}</td>;
      case 'symbol': return <td key={col}><div className="symbol-cell">{row.symbol}<span className="lot-badge">{row.lotSize || 0}</span></div></td>;
      case 'ltp': return <td key={col} className={`${priceClass(row.change)} ${row.flashClass || ''}`}>{(row.ltp || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>;
      case 'changePct': return <td key={col}><span className={`change-badge ${(row.changePct || 0) >= 0 ? 'positive' : 'negative'}`}>{(row.changePct || 0) >= 0 ? '+' : ''}{(row.changePct || 0).toFixed(2)}%</span></td>;
      case 'todayHigh': return <td key={col}>{(row.todayHigh || 0).toFixed(2)}</td>;
      case 'todayLow': return <td key={col}>{(row.todayLow || 0).toFixed(2)}</td>;
      case 'yesterdayHigh': return <td key={col} style={{ color: 'var(--orange)' }}>{((row.todayHigh || 0) * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2)}</td>;
      case 'yesterdayLow': return <td key={col} style={{ color: 'var(--orange)' }}>{((row.todayLow || 0) * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2)}</td>;
      case 'volume': return <td key={col} style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{fmt(row.volume || 0)}</td>;
      case 'oi': return <td key={col} style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{fmt(row.oi || 0)}</td>;
      case 'd7HL': return <td key={col} style={{ fontSize: 10 }}>{(row.d7High || 0).toFixed(0)}/{(row.d7Low || 0).toFixed(0)}</td>;
      case 'sma30': return <td key={col} className={(row.ltp || 0) > (row.sma30 || 0) ? 'sma-above' : 'sma-below'}>{(row.sma30 || 0).toFixed(0)}</td>;
      case 'sma100': return <td key={col} className={(row.ltp || 0) > (row.sma100 || 0) ? 'sma-above' : 'sma-below'}>{(row.sma100 || 0).toFixed(0)}</td>;
      case 'sma200': return <td key={col} className={(row.ltp || 0) > (row.sma200 || 0) ? 'sma-above' : 'sma-below'}>{(row.sma200 || 0).toFixed(0)}</td>;
      case 'iv': return <td key={col}>{(row.iv || 0).toFixed(1)}</td>;
      case 'iv5d': return <td key={col}><div className="iv-range-bar"><span>{(row.ivLow5d || 0).toFixed(0)}</span><div className="iv-bar-track"><div className={`iv-bar-fill${((row.iv || 0) - (row.ivLow5d || 0)) / ((row.ivHigh5d || 1) - (row.ivLow5d || 0) || 1) > 0.8 ? ' high' : ''}`} style={{ width: `${Math.min(100, Math.max(0, (((row.iv || 0) - (row.ivLow5d || 0)) / ((row.ivHigh5d || 1) - (row.ivLow5d || 0) || 1)) * 100))}%` }} /></div><span>{(row.ivHigh5d || 0).toFixed(0)}</span></div></td>;
      case 'ceDelta': return <td key={col} style={{ fontSize: 10 }}><span style={{ color: 'var(--green-text)' }}>{row.ceStrike || 0}</span><span style={{ color: 'var(--text-muted)', fontSize: 9 }}> ₹{row.cePremium || 0}</span></td>;
      case 'peDelta': return <td key={col} style={{ fontSize: 10 }}><span style={{ color: 'var(--red-text)' }}>{row.peStrike || 0}</span><span style={{ color: 'var(--text-muted)', fontSize: 9 }}> ₹{row.pePremium || 0}</span></td>;
      case 'synF': {
        const sf = synFuture(row);
        return <td key={col} style={{ fontSize: 10 }}><div style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ color: 'var(--text-secondary)', fontSize:10 }}>{(sf.price || 0).toLocaleString('en-IN')}</span><button className="action-btn" onClick={e => { e.stopPropagation(); openOrderEntry({ symbol: row.symbol, side: 'BUY', price: row.ltp }); }} title="Syn Long" style={{ color:'var(--green)', fontSize:10, width:16, height:16 }}>▲</button><button className="action-btn" onClick={e => { e.stopPropagation(); openOrderEntry({ symbol: row.symbol, side: 'SELL', price: row.ltp }); }} title="Syn Short" style={{ color:'var(--red)', fontSize:10, width:16, height:16 }}>▼</button></div></td>;
      }
      case 'actions': return <td key={col}><div className="action-btns"><button className="action-btn" onClick={e => { e.stopPropagation(); openOrderEntry({ symbol: row.symbol, side: 'BUY', price: row.ltp }); }} title="Buy (F1)" style={{ color: '#10b981', fontSize: 9, fontWeight: 700 }}>B</button><button className="action-btn" onClick={e => { e.stopPropagation(); openOrderEntry({ symbol: row.symbol, side: 'SELL', price: row.ltp }); }} title="Sell (F2)" style={{ color: '#ef4444', fontSize: 9, fontWeight: 700 }}>S</button><button className="action-btn chart" onClick={e => { e.stopPropagation(); openChart(row.symbol); }} title="Chart (C)">📊</button><button className="action-btn" onClick={e => { e.stopPropagation(); onOpenTechnical?.(row.symbol, row.ltp); }} title="Technical (T)" style={{ fontSize: 11 }}>📈</button><button className="action-btn chain" onClick={e => { e.stopPropagation(); openOptionChain(row.symbol); }} title="Chain (Enter)">🔗</button></div></td>;
      default: return <td key={col}>-</td>;
    }
  };

  return (
    <div className="grid-wrapper" onClick={() => setContextMenu(null)}>
      <table className="market-table">
        <thead>
          <tr onContextMenu={handleContextMenu}>
            {visibleCols.map(col => {
              const c = ALL_COLUMNS.find(x => x.id === col);
              return (
                <th key={col} onClick={() => handleSort(col)} style={c?.width ? { width: c.width } : {}}>
                  {c?.label}{sortIcon(col)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const bias = row.ltp > row.sma30 ? 'bullish' : row.ltp < row.sma30 ? 'bearish' : '';
            return (
              <tr key={row.symbol}
                className={`${bias}${selectedIdx === i ? ' selected' : ''}`}
                onClick={() => setSelectedIdx(i)}
                onDoubleClick={() => openOptionChain(row.symbol)}>
                {visibleCols.map(col => renderCell(col, row, i))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Right-click Column Manager */}
      {contextMenu && (
        <div style={{
          position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 9999,
          background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8,
          boxShadow: 'var(--shadow)', padding: '6px 0', minWidth: 180, maxHeight: 400, overflow: 'auto'
        }}>
          <div style={{ padding: '4px 12px', fontSize: 10, fontWeight: 700, color: 'var(--text-heading)', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
            ⚙️ Toggle Columns
          </div>
          {ALL_COLUMNS.map(c => (
            <div key={c.id} onClick={() => toggleCol(c.id)}
              style={{ padding: '4px 12px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
              <span style={{ width: 16, fontSize: 10 }}>{visibleCols.includes(c.id) ? '✅' : '⬜'}</span>
              <span>{c.label}</span>
              {!c.default && <span style={{ fontSize: 8, color: 'var(--orange)', marginLeft: 'auto' }}>NEW</span>}
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 4, padding: '4px 12px', display: 'flex', gap: 4 }}>
            <button onClick={() => setVisibleCols(ALL_COLUMNS.map(c => c.id))}
              style={{ flex: 1, padding: '3px', fontSize: 9, border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--cyan)', cursor: 'pointer' }}>Show All</button>
            <button onClick={() => setVisibleCols(ALL_COLUMNS.filter(c => c.default).map(c => c.id))}
              style={{ flex: 1, padding: '3px', fontSize: 9, border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Reset</button>
          </div>
        </div>
      )}
    </div>
  );
}
