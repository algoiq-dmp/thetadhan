import { useState, useEffect } from 'react';
import engineConnector from '../services/engineConnector';

export default function TradeJournal() {
  const [filter, setFilter] = useState('all');
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const fetchTrades = async () => {
      const t = await engineConnector.getTrades();
      setTrades(t || []);
    };
    fetchTrades();
    const iv = setInterval(fetchTrades, 15000);
    return () => clearInterval(iv);
  }, []);

  // Map Dhan trades to journal entries
  const journal = trades.map((t, i) => {
    const pnl = t.transactionType === 'SELL'
      ? ((t.tradedPrice || t.price || 0) - (t.price || 0)) * (t.tradedQuantity || t.quantity || 0)
      : 0; // Approximate — real P&L needs entry/exit pairing
    return {
      id: t.orderId || i,
      date: (t.createTime || '').split(' ')[0] || 'Today',
      symbol: t.tradingSymbol || t.securityId,
      side: t.transactionType,
      entry: t.price || 0,
      exit: t.tradedPrice || t.price || 0,
      qty: t.tradedQuantity || t.quantity || 0,
      pnl,
      status: t.orderStatus || 'TRADED',
    };
  });

  const filtered = filter === 'winners' ? journal.filter(t => t.pnl > 0) :
                   filter === 'losers' ? journal.filter(t => t.pnl < 0) : journal;

  const totalPnl = journal.reduce((s, t) => s + t.pnl, 0);
  const winners = journal.filter(t => t.pnl > 0);
  const losers = journal.filter(t => t.pnl < 0);
  const winRate = journal.length > 0 ? (winners.length / journal.length * 100) : 0;
  const avgWin = winners.length > 0 ? winners.reduce((s, t) => s + t.pnl, 0) / winners.length : 0;
  const avgLoss = losers.length > 0 ? losers.reduce((s, t) => s + t.pnl, 0) / losers.length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-heading)' }}>📓 Trade Journal</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {['all', 'winners', 'losers'].map(f => (
            <button key={f} className={`sector-pill${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)} style={{ fontSize: 9, padding: '2px 6px', textTransform: 'capitalize' }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>TRADES</div>
          <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
            {journal.length}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>WIN RATE</div>
          <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-mono)', color: winRate > 50 ? 'var(--green)' : 'var(--orange)' }}>
            {winRate.toFixed(0)}%
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>BUYS</div>
          <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{journal.filter(j => j.side === 'BUY').length}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>SELLS</div>
          <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>{journal.filter(j => j.side === 'SELL').length}</div>
        </div>
      </div>

      {/* Journal Entries */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📓</div>
            No trades recorded today
          </div>
        )}
        {filtered.map(t => (
          <div key={t.id} style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: t.side === 'BUY' ? 'var(--green)' : 'var(--red)' }}>{t.side === 'BUY' ? '▲' : '▼'} {t.side}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-heading)' }}>{t.symbol}</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-heading)' }}>
                ₹{t.exit.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, fontSize: 9, color: 'var(--text-muted)' }}>
              <span>{t.date}</span>
              <span>Price: ₹{t.entry.toFixed(2)}</span>
              <span>Qty: {t.qty}</span>
              <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--cyan)' }}>
                {t.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
