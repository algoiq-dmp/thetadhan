import { useState, useEffect } from 'react';
import engineConnector from '../services/engineConnector';

const statusColor = { PENDING: 'var(--cyan)', OPEN: 'var(--cyan)', PARTIAL: 'var(--orange)', TRIGGERED: 'var(--purple)', AMO: 'var(--blue)' };
const tradeColor = { TRADED: 'var(--green)', REJECTED: 'var(--red)', CANCELLED: 'var(--text-muted)' };

export default function OrdersPanel() {
  const [tab, setTab] = useState('pending');
  const [orders, setOrders] = useState([]);
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const [o, t] = await Promise.all([
        engineConnector.getOrders(),
        engineConnector.getTrades()
      ]);
      setOrders(o || []);
      setTrades(t || []);
    };
    fetchData();
    const iv = setInterval(fetchData, 5000); // 5 sec polling for live order status
    return () => clearInterval(iv);
  }, []);

  const pendingOrders = orders.filter(o => ['PENDING', 'OPEN', 'PARTIAL', 'TRIGGER_PENDING', 'AMO'].includes(o.orderStatus));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        {[
          { id: 'pending', label: `Pending (${pendingOrders.length})` },
          { id: 'trades', label: `Trades (${trades.length})` },
        ].map(t => (
          <button key={t.id} className={`panel-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)} style={{ flex: 1, fontSize: 10 }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'pending' && pendingOrders.map(o => {
          const dev = o.price > 0 ? (((0 - o.price) / o.price) * 100) : 0; // LTP not available in order response
          return (
            <div key={o.orderId} style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: o.transactionType === 'BUY' ? 'var(--green)' : 'var(--red)' }}>
                    {o.transactionType}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-heading)' }}>{o.tradingSymbol || o.securityId}</span>
                </div>
                <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                  background: statusColor[o.orderStatus] ? `${statusColor[o.orderStatus]}20` : 'transparent',
                  color: statusColor[o.orderStatus] || 'var(--text-muted)' }}>
                  {o.orderStatus}{o.tradedQuantity ? ` (${o.tradedQuantity}/${o.quantity})` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8, fontSize: 9, color: 'var(--text-muted)' }}>
                  <span>Qty: {o.quantity}</span>
                  <span>₹{o.price}</span>
                  <span>{o.createTime}</span>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button style={{ fontSize: 8, padding: '1px 4px', border: '1px solid var(--border)', borderRadius: 2, background: 'transparent', color: 'var(--cyan)', cursor: 'pointer' }}>✏️</button>
                  <button style={{ fontSize: 8, padding: '1px 4px', border: '1px solid var(--border)', borderRadius: 2, background: 'transparent', color: 'var(--red)', cursor: 'pointer' }}>✕</button>
                  <button style={{ fontSize: 8, padding: '1px 4px', border: '1px solid var(--border)', borderRadius: 2, background: 'transparent', color: 'var(--orange)', cursor: 'pointer' }} title="Move to Market">MKT</button>
                </div>
              </div>
            </div>
          );
        })}

        {tab === 'trades' && trades.map(t => (
          <div key={t.orderId} style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: t.transactionType === 'BUY' ? 'var(--green)' : 'var(--red)' }}>
                  {t.transactionType === 'BUY' ? '▲' : '▼'} {t.transactionType}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-heading)' }}>{t.tradingSymbol || t.securityId}</span>
              </div>
              <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                background: tradeColor[t.orderStatus] ? `${tradeColor[t.orderStatus]}20` : 'rgba(255,255,255,0.1)',
                color: tradeColor[t.orderStatus] || 'var(--text-muted)' }}>
                {t.orderStatus || 'TRADED'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, fontSize: 9, color: 'var(--text-muted)' }}>
              <span>Qty: {t.tradedQuantity || t.quantity}</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>₹{t.tradedPrice || t.price}</span>
              <span>{t.createTime}</span>
              {t.legName && <span style={{ color: 'var(--red)' }}>— {t.legName}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '6px 10px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', gap: 4 }}>
        {tab === 'pending' && (
          <button style={{ flex: 1, padding: '4px', fontSize: 9, fontWeight: 700, border: '1px solid var(--red)', borderRadius: 4, background: 'rgba(239,68,68,0.1)', color: 'var(--red)', cursor: 'pointer' }}
            onClick={() => alert('Cancel ALL pending orders?')}>⛔ CANCEL ALL</button>
        )}
        <button style={{ flex: 1, padding: '4px', fontSize: 9, fontWeight: 700, border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
          📋 Export CSV
        </button>
      </div>
    </div>
  );
}
