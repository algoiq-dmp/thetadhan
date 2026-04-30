import useMarketStore from '../store/useMarketStore';
import CandlestickChart from './CandlestickChart';

export default function ChartPopup({ symbol }) {
  const closeChart = useMarketStore(s => s.closeChart);
  const universe = useMarketStore(s => s.universe);
  const openOrderEntry = useMarketStore(s => s.openOrderEntry);
  const row = universe.find(r => r.symbol === symbol);

  const handleTrade = ({ symbol: sym, side }) => {
    openOrderEntry({ symbol: sym, side, price: row?.ltp || 0 });
  };

  return (
    <div className="modal-overlay" onClick={closeChart}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 960, maxHeight: '80vh' }}>
        <div className="modal-header">
          <div className="modal-title">
            📊 {symbol}
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: row?.changePct >= 0 ? 'var(--green-text)' : 'var(--red-text)', fontWeight: 600, marginLeft: 8 }}>
              {row?.ltp?.toLocaleString('en-IN')}
              <span style={{ fontSize: 11, marginLeft: 6 }}>({row?.changePct >= 0 ? '+' : ''}{row?.changePct?.toFixed(2)}%)</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => handleTrade({ symbol, side: 'BUY' })} style={{ padding: '4px 12px', borderRadius: 4, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>🛒 Buy</button>
            <button onClick={() => handleTrade({ symbol, side: 'SELL' })} style={{ padding: '4px 12px', borderRadius: 4, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>📤 Sell</button>
            <button className="modal-close" onClick={closeChart}>✕</button>
          </div>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          <CandlestickChart symbol={symbol} height={420} showToolbar={true} showOverlays={true} onTrade={handleTrade} />
        </div>
      </div>
    </div>
  );
}
