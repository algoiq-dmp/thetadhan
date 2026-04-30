import useMarketStore from '../store/useMarketStore';

export default function StatusBar() {
  const universe = useMarketStore(s => s.universe);
  const simulatedFeeds = useMarketStore(s => s.simulatedFeeds);
  const adv = universe.filter(r => r.changePct > 0).length;
  const dec = universe.filter(r => r.changePct < 0).length;
  const unch = universe.length - adv - dec;
  const nifty = universe.find(r => r.symbol === 'NIFTY');
  const bnifty = universe.find(r => r.symbol === 'BANKNIFTY');

  return (
    <footer className="app-statusbar">
      <div className="status-left">
        {simulatedFeeds.enabled && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '1px 8px', borderRadius: 4, marginRight: 8,
            background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
            animation: 'pulse 2s infinite',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 4px #f59e0b' }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', letterSpacing: 0.5 }}>
              SIM {simulatedFeeds.tickSpeed}s · {simulatedFeeds.volatility}× · {simulatedFeeds.trendBias === 'bullish' ? '📈' : simulatedFeeds.trendBias === 'bearish' ? '📉' : '↔'}
            </span>
          </span>
        )}
        <span>
          <span className="status-advance">↑{adv}</span>
          {' '}
          <span className="status-decline">↓{dec}</span>
          {' '}
          <span className="status-unchanged">—{unch}</span>
        </span>
      </div>
      <div className="status-center">
        {nifty && (
          <span className="status-index">
            <span className="idx-name">NIFTY</span>
            <span className={nifty.changePct >= 0 ? 'price-up' : 'price-down'}>
              {(nifty.ltp || 0).toLocaleString('en-IN')} ({(nifty.changePct || 0) >= 0 ? '+' : ''}{(nifty.changePct || 0).toFixed(2)}%)
            </span>
          </span>
        )}
        {bnifty && (
          <span className="status-index">
            <span className="idx-name">BANKNIFTY</span>
            <span className={bnifty.changePct >= 0 ? 'price-up' : 'price-down'}>
              {(bnifty.ltp || 0).toLocaleString('en-IN')} ({(bnifty.changePct || 0) >= 0 ? '+' : ''}{(bnifty.changePct || 0).toFixed(2)}%)
            </span>
          </span>
        )}
      </div>
      <div className="status-right">
        <span className="layer-status"><span className="layer-dot" />L1: {simulatedFeeds.enabled ? `${simulatedFeeds.tickSpeed}s` : '2s'}</span>
        <span className="layer-status"><span className="layer-dot" />L2: 5m</span>
        <span className="layer-status"><span className="layer-dot" />L3: BOD ✓</span>
        <span style={{ opacity: 0.3 }}>|</span>
        <span className="layer-status" title="TalkOptions API"><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#8b5cf6', display: 'inline-block', marginRight: 3 }} />TO</span>
        <span className="layer-status" title="TalkDelta Feed"><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#06b6d4', display: 'inline-block', marginRight: 3 }} />TD</span>
      </div>
    </footer>
  );
}
