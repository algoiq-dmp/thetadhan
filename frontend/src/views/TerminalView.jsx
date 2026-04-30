import MarketGrid from '../components/MarketGrid';
import PositionPanel from '../components/PositionPanel';
import useMarketStore from '../store/useMarketStore';

export default function TerminalView({ onOpenTechnical }) {
  const showPositions = useMarketStore(s => s.showPositions);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <MarketGrid onOpenTechnical={onOpenTechnical} />
      {showPositions && <PositionPanel />}
    </div>
  );
}
