import { useState, useEffect } from 'react';
import useMarketStore from '../store/useMarketStore';
import engineConnector from '../services/engineConnector';

export default function PositionPanel() {
  const positionTab = useMarketStore(s => s.positionTab);
  const setPositionTab = useMarketStore(s => s.setPositionTab);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [p, o] = await Promise.all([
          engineConnector.getPositions(),
          engineConnector.getOrders(),
        ]);
        setPositions((p || []).filter(pos => pos.positionType !== 'CLOSED'));
        setOrders(o || []);
      } catch (err) {
        console.error("Error fetching live panel data:", err);
      }
    };
    fetchData();
    const iv = setInterval(fetchData, 5000);
    return () => clearInterval(iv);
  }, []);

  const totalPnl = positions.reduce((acc, p) => acc + (p.unrealizedProfit || 0) + (p.realizedProfit || 0), 0);

  return (
    <div className="bottom-panels open">
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div className="bottom-panel-tabs">
          <button className={`panel-tab${positionTab === 'positions' ? ' active' : ''}`} onClick={() => setPositionTab('positions')}>
            Positions ({positions.length})
          </button>
          <button className={`panel-tab${positionTab === 'orders' ? ' active' : ''}`} onClick={() => setPositionTab('orders')}>
            Orders ({orders.length})
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {positionTab === 'positions' && (
            <table className="positions-table">
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Side</th>
                  <th>Qty</th>
                  <th>Avg</th>
                  <th>LTP</th>
                  <th>P&L</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p, i) => {
                  const netQty = (p.buyQty || 0) - (p.sellQty || 0);
                  const isLong = netQty > 0;
                  const pnl = (p.unrealizedProfit || 0) + (p.realizedProfit || 0);
                  const avg = isLong ? p.buyAvg : p.sellAvg;
                  return (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, textAlign: 'left' }}>{p.tradingSymbol || p.securityId}</td>
                    <td style={{ color: isLong ? 'var(--green-text)' : 'var(--red-text)', fontWeight: 600 }}>{isLong ? 'BUY' : 'SELL'}</td>
                    <td>{Math.abs(netQty)}</td>
                    <td>{(avg || 0).toFixed(2)}</td>
                    <td>{(p.ltp || 0).toFixed(2)}</td>
                    <td className={pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>
                      {pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <div className="position-actions">
                        <button className="pos-btn exit">Exit</button>
                        <button className="pos-btn add">Add</button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {positionTab === 'orders' && (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Instrument</th>
                  <th>Side</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr key={i}>
                    <td style={{ textAlign: 'left' }}>{o.createTime}</td>
                    <td style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, textAlign: 'left' }}>{o.tradingSymbol || o.securityId}</td>
                    <td style={{ color: o.transactionType === 'BUY' ? 'var(--green-text)' : 'var(--red-text)', fontWeight: 600 }}>{o.transactionType}</td>
                    <td>{o.quantity}</td>
                    <td>{(o.price || 0).toFixed(2)}</td>
                    <td>
                      <span className={`change-badge ${['TRADED', 'FILLED'].includes(o.orderStatus) ? 'positive' : 'negative'}`}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td>
                      {['PENDING', 'OPEN'].includes(o.orderStatus) && (
                        <div className="position-actions">
                          <button className="pos-btn add">Modify</button>
                          <button className="pos-btn exit">Cancel</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="position-summary">
          <div className="summary-item">
            <span className="summary-label">Net P&L:</span>
            <span className={`summary-value ${totalPnl >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
              {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Positions:</span>
            <span className="summary-value">{positions.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Net Delta:</span>
            <span className="summary-value">-12.5</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Theta/Day:</span>
            <span className="summary-value pnl-positive">+₹1,200</span>
          </div>
          <div className="panic-btns">
            <button className="panic-btn hedge">Hedge All</button>
            <button className="panic-btn exit-all" onClick={() => alert('⚠️ Exit ALL positions?')}>EXIT ALL</button>
          </div>
        </div>
      </div>
    </div>
  );
}
