import { useState, useEffect } from 'react';
import engineConnector from '../services/engineConnector';

export default function MessageBar() {
  const [events, setEvents] = useState([]);
  const [scrollPos, setScrollPos] = useState(0);
  const [paused, setPaused] = useState(false);

  // Fetch live orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const orders = await engineConnector.getOrders();
        if (!orders) return;
        
        // Map live orders into events format for the ticker
        const liveEvents = orders.map((o, idx) => {
          let type = 'pending';
          if (['TRADED', 'FILLED'].includes(o.orderStatus)) type = 'fill';
          else if (['REJECTED', 'CANCELLED'].includes(o.orderStatus)) type = 'reject';
          
          return {
            id: o.orderId || idx,
            type,
            side: o.transactionType,
            symbol: o.tradingSymbol || o.securityId,
            qty: o.quantity,
            price: o.price,
            time: o.createTime,
            status: o.orderStatus,
            reason: o.orderStatus // display status string as reason
          };
        });
        setEvents(liveEvents);
      } catch (err) {
        console.error("MessageBar failed to fetch live orders", err);
      }
    };
    
    fetchOrders();
    const fetchIv = setInterval(fetchOrders, 10000); // 10s poll
    return () => clearInterval(fetchIv);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (paused || events.length === 0) return;
    const iv = setInterval(() => {
      setScrollPos(p => p + 1);
    }, 50);
    return () => clearInterval(iv);
  }, [paused, events.length]);

  const fills = events.filter(e => e.type === 'fill');
  const rejects = events.filter(e => e.type === 'reject');
  const pending = events.filter(e => e.type === 'pending');

  return (
    <div style={{
      height: 26, display: 'flex', alignItems: 'center', borderTop: '1px solid var(--border)',
      background: 'var(--bg-panel)', fontSize: 10, overflow: 'hidden', cursor: 'pointer',
      position: 'relative'
    }}
      onClick={() => setPaused(!paused)}
    >
      {/* Pending count badge */}
      <div style={{
        padding: '0 8px', height: '100%', display: 'flex', alignItems: 'center', gap: 8,
        borderRight: '1px solid var(--border)', background: 'var(--bg-card)', flexShrink: 0
      }}>
        <span style={{ color: 'var(--green)', fontWeight: 700 }}>✅{fills.length}</span>
        <span style={{ color: 'var(--orange)', fontWeight: 700 }}>⏳{pending.length}</span>
        <span style={{ color: 'var(--red)', fontWeight: 700 }}>❌{rejects.length}</span>
      </div>

      {/* Scrolling messages */}
      <div style={{
        flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', position: 'relative', height: '100%',
        display: 'flex', alignItems: 'center'
      }}>
        {events.length > 0 ? (
          <div style={{
            display: 'inline-flex', gap: 24,
            transform: `translateX(-${scrollPos % (Math.max(events.length, 1) * 320)}px)`,
            transition: paused ? 'none' : 'transform 0.05s linear'
          }}>
            {[...events, ...events].map((e, i) => (
              <span key={`${e.id}-${i}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0
              }}>
                {e.type === 'fill' && (
                  <>
                    <span style={{ color: e.side === 'BUY' ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                      {e.side === 'BUY' ? '▲' : '▼'} {e.side}
                    </span>
                    <span style={{ color: 'var(--text-heading)', fontWeight: 600 }}>{e.symbol}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {e.qty}×₹{(e.price || 0).toFixed(2)}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{e.time}</span>
                    <span style={{ color: 'var(--green)', fontSize: 8, fontWeight: 700 }}>FILLED</span>
                  </>
                )}
                {e.type === 'reject' && (
                  <>
                    <span style={{ color: 'var(--red)', fontWeight: 700 }}>✕ REJECT</span>
                    <span style={{ color: 'var(--text-heading)', fontWeight: 600 }}>{e.symbol}</span>
                    <span style={{ color: 'var(--red)', fontSize: 9 }}>{e.reason}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{e.time}</span>
                  </>
                )}
                {e.type === 'pending' && (
                  <>
                    <span style={{ color: 'var(--orange)', fontWeight: 700 }}>⏳ {e.side}</span>
                    <span style={{ color: 'var(--text-heading)', fontWeight: 600 }}>{e.symbol}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {e.qty}×₹{(e.price || 0).toFixed(2)}
                    </span>
                    <span style={{ color: 'var(--orange)', fontSize: 8, fontWeight: 700 }}>{e.status}</span>
                  </>
                )}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ padding: '0 16px', color: 'var(--text-muted)' }}>No live orders for today</div>
        )}
      </div>

      {/* Pause indicator */}
      {paused && (
        <div style={{
          padding: '0 8px', color: 'var(--orange)', fontWeight: 700, fontSize: 9,
          borderLeft: '1px solid var(--border)', flexShrink: 0
        }}>
          ⏸ PAUSED
        </div>
      )}
    </div>
  );
}
