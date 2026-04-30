import { useState, useCallback, useRef } from 'react';
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

// All available columns — togglable, reorderable, deletable
const ALL_COLUMNS = [
  { id: 'idx', label: '#', default: true, width: 30, locked: true },
  { id: 'symbol', label: 'Symbol', default: true, sortKey: 'symbol', width: 110, locked: true },
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
  { id: 'actions', label: 'Actions', default: true, locked: true },
];

const DEFAULT_COLS = ALL_COLUMNS.filter(c => c.default).map(c => c.id);

function loadCols() {
  try {
    const saved = JSON.parse(localStorage.getItem('ty_grid_cols'));
    if (Array.isArray(saved) && saved.length > 2) return saved;
  } catch {}
  return DEFAULT_COLS;
}

export default function MarketGrid({ onOpenTechnical }) {
  const getFiltered = useMarketStore(s => s.getFiltered);
  const selectedIdx = useMarketStore(s => s.selectedIdx);
  const setSelectedIdx = useMarketStore(s => s.setSelectedIdx);
  const openOptionChain = useMarketStore(s => s.openOptionChain);
  const openChart = useMarketStore(s => s.openChart);
  const openOrderEntry = useMarketStore(s => s.openOrderEntry);

  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [visibleCols, setVisibleCols] = useState(loadCols);
  const [contextMenu, setContextMenu] = useState(null);
  const [dragCol, setDragCol] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Persist columns
  const saveCols = (cols) => {
    setVisibleCols(cols);
    localStorage.setItem('ty_grid_cols', JSON.stringify(cols));
  };

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
    const next = visibleCols.includes(id) ? visibleCols.filter(c => c !== id) : [...visibleCols, id];
    saveCols(next);
  };

  const removeCol = (id) => {
    const c = ALL_COLUMNS.find(x => x.id === id);
    if (c?.locked) return; // Can't remove locked columns
    saveCols(visibleCols.filter(c => c !== id));
  };

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // Drag-and-drop column reorder
  const handleDragStart = (col) => { setDragCol(col); };
  const handleDragOver = (e, col) => { e.preventDefault(); setDragOverCol(col); };
  const handleDrop = (targetCol) => {
    if (!dragCol || dragCol === targetCol) { setDragCol(null); setDragOverCol(null); return; }
    const cols = [...visibleCols];
    const fromIdx = cols.indexOf(dragCol);
    const toIdx = cols.indexOf(targetCol);
    if (fromIdx < 0 || toIdx < 0) return;
    cols.splice(fromIdx, 1);
    cols.splice(toIdx, 0, dragCol);
    saveCols(cols);
    setDragCol(null);
    setDragOverCol(null);
  };
  const handleDragEnd = () => { setDragCol(null); setDragOverCol(null); };

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
      case 'symbol':
        return <td key={col}><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span className={`symbol-name ${row.flashClass || ''}`}>{row.symbol}</span><span className="exchange-badge">{row.exchange_segment === 'IDX_I' ? 'IDX' : row.exchange_segment === 'BSE_INDEX' ? 'BSE' : 'NSE'}</span></div></td>;
      case 'ltp':
        return <td key={col} className={priceClass(row.changePct)}><span className="ltp-value">{(row.ltp || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>;
      case 'changePct':
        return <td key={col} className={priceClass(row.changePct)}><span className="change-value">{(row.changePct || 0) >= 0 ? '+' : ''}{(row.changePct || 0).toFixed(2)}%</span></td>;
      case 'todayHigh': return <td key={col}>{(row.todayHigh || 0).toLocaleString('en-IN')}</td>;
      case 'todayLow': return <td key={col}>{(row.todayLow || 0).toLocaleString('en-IN')}</td>;
      case 'yesterdayHigh': return <td key={col}>{(row.yesterdayHigh || 0).toLocaleString('en-IN')}</td>;
      case 'yesterdayLow': return <td key={col}>{(row.yesterdayLow || 0).toLocaleString('en-IN')}</td>;
      case 'volume': return <td key={col}>{fmt(row.volume)}</td>;
      case 'oi': return <td key={col}>{fmt(row.oi)}</td>;
      case 'd7HL':
        return <td key={col}><span style={{ fontSize: 10 }}>{(row.d7High || 0).toLocaleString('en-IN')} / {(row.d7Low || 0).toLocaleString('en-IN')}</span></td>;
      case 'sma30': return <td key={col} className={row.ltp > row.sma30 ? 'above-sma' : 'below-sma'}>{(row.sma30 || 0).toLocaleString('en-IN')}</td>;
      case 'sma100': return <td key={col}>{(row.sma100 || 0).toLocaleString('en-IN')}</td>;
      case 'sma200': return <td key={col}>{(row.sma200 || 0).toLocaleString('en-IN')}</td>;
      case 'iv': return <td key={col} style={{ color: 'var(--orange)' }}>{(row.iv || 0).toFixed(1)}</td>;
      case 'iv5d': return <td key={col}><span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{(row.ivHigh5d || 0).toFixed(0)} — {(row.ivLow5d || 0).toFixed(0)}</span></td>;
      case 'ceDelta': return <td key={col} style={{ color: 'var(--green)' }}>{(row.ceDelta || 0).toFixed(2)}</td>;
      case 'peDelta': return <td key={col} style={{ color: 'var(--red)' }}>{(row.peDelta || 0).toFixed(2)}</td>;
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
      <table className="market-table" style={{ borderSpacing: '0 2px' }}>
        <thead>
          <tr onContextMenu={handleContextMenu}>
            {visibleCols.map(col => {
              const c = ALL_COLUMNS.find(x => x.id === col);
              const isDragOver = dragOverCol === col && dragCol !== col;
              return (
                <th key={col}
                  draggable={!c?.locked}
                  onDragStart={() => handleDragStart(col)}
                  onDragOver={(e) => handleDragOver(e, col)}
                  onDrop={() => handleDrop(col)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleSort(col)}
                  style={{
                    ...(c?.width ? { width: c.width } : {}),
                    borderLeft: isDragOver ? '2px solid #06b6d4' : 'none',
                    cursor: c?.locked ? 'default' : 'grab',
                    padding: '6px 8px',
                    userSelect: 'none',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span>{c?.label}{sortIcon(col)}</span>
                    {!c?.locked && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeCol(col); }}
                        title={`Remove ${c?.label}`}
                        style={{ opacity: 0.3, border: 'none', background: 'transparent', color: 'var(--red)', fontSize: 8, cursor: 'pointer', padding: 0, lineHeight: 1, marginLeft: 2, transition: 'opacity 0.2s' }}
                        onMouseEnter={e => e.target.style.opacity = 1}
                        onMouseLeave={e => e.target.style.opacity = 0.3}
                      >✕</button>
                    )}
                  </div>
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
                onDoubleClick={() => openOptionChain(row.symbol)}
                style={{ marginBottom: 2 }}>
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
          boxShadow: 'var(--shadow)', padding: '6px 0', minWidth: 200, maxHeight: 450, overflow: 'auto'
        }}>
          <div style={{ padding: '6px 12px', fontSize: 10, fontWeight: 700, color: 'var(--text-heading)', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
            ⚙️ Column Manager — Drag headers to reorder
          </div>
          {ALL_COLUMNS.map(c => (
            <div key={c.id} onClick={() => toggleCol(c.id)}
              style={{ padding: '5px 12px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ width: 18, fontSize: 11, textAlign: 'center' }}>{visibleCols.includes(c.id) ? '✅' : '⬜'}</span>
              <span style={{ flex: 1 }}>{c.label}</span>
              {c.locked && <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>🔒</span>}
              {!c.default && <span style={{ fontSize: 8, color: 'var(--orange)' }}>NEW</span>}
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 4, padding: '6px 12px', display: 'flex', gap: 6 }}>
            <button onClick={() => saveCols(ALL_COLUMNS.map(c => c.id))}
              style={{ flex: 1, padding: '4px', fontSize: 9, border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--cyan)', cursor: 'pointer', fontWeight: 600 }}>Show All</button>
            <button onClick={() => saveCols(DEFAULT_COLS)}
              style={{ flex: 1, padding: '4px', fontSize: 9, border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Reset Default</button>
          </div>
        </div>
      )}
    </div>
  );
}
