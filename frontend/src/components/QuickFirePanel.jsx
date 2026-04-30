import { useState } from 'react';
import useMarketStore from '../store/useMarketStore';
import { fetchAPI } from '../hooks/useSocket';

const MACROS = [
  { id: 'atm-straddle-sell', name: 'ATM Straddle Sell', desc: 'Sell ATM CE + PE', hotkey: 'Ctrl+1', legs: 2, color: 'var(--red)' },
  { id: 'strangle-sell', name: 'Strangle Sell', desc: 'Sell OTM CE+PE (-5Δ)', hotkey: 'Ctrl+2', legs: 2, color: 'var(--red)' },
  { id: 'atm-straddle-buy', name: 'ATM Straddle Buy', desc: 'Buy ATM CE + PE', hotkey: 'Ctrl+3', legs: 2, color: 'var(--green)' },
  { id: 'strangle-buy', name: 'Strangle Buy', desc: 'Buy OTM CE+PE (+5Δ)', hotkey: 'Ctrl+4', legs: 2, color: 'var(--green)' },
  { id: 'iron-condor', name: 'Iron Condor', desc: 'Sell near OTM + Buy far OTM', hotkey: 'Ctrl+5', legs: 4, color: 'var(--purple)' },
  { id: 'iron-butterfly', name: 'Iron Butterfly', desc: 'ATM sell + OTM buy wings', hotkey: 'Ctrl+6', legs: 4, color: 'var(--purple)' },
  { id: 'bull-call-spread', name: 'Bull Call Spread', desc: 'Buy ATM CE + Sell OTM CE', hotkey: 'Ctrl+7', legs: 2, color: 'var(--blue)' },
  { id: 'bear-put-spread', name: 'Bear Put Spread', desc: 'Buy ATM PE + Sell OTM PE', hotkey: 'Ctrl+8', legs: 2, color: 'var(--blue)' },
  { id: 'synthetic-long', name: 'Synthetic Long', desc: 'Buy CE + Sell PE (ATM)', hotkey: 'Ctrl+9', legs: 2, color: 'var(--cyan)' },
  { id: 'synthetic-short', name: 'Synthetic Short', desc: 'Sell CE + Buy PE (ATM)', hotkey: 'Ctrl+0', legs: 2, color: 'var(--orange)' },
];

export default function QuickFirePanel() {
  const toggleQuickFire = useMarketStore(s => s.toggleQuickFire);
  const getFiltered = useMarketStore(s => s.getFiltered);
  const selectedIdx = useMarketStore(s => s.selectedIdx);
  const filtered = getFiltered();
  const selected = filtered[selectedIdx];
  const [firing, setFiring] = useState(null);
  const [lots, setLots] = useState(1);
  const [distance, setDistance] = useState(5);

  const fireMacro = async (macroId) => {
    if (!selected) return;
    setFiring(macroId);

    try {
      const result = await fetchAPI('/qfm/execute', {
        method: 'POST',
        body: JSON.stringify({
          macroId,
          symbol: selected.symbol,
          params: { lots, distance },
        }),
      });

      // Success toast
      const toast = document.createElement('div');
      toast.textContent = `⚡ QFM: ${macroId} on ${selected.symbol} — ${result.legs?.length || 0} legs fired, ${result.orderIds?.length || 0} filled`;
      toast.style.cssText = 'position:fixed;top:60px;right:20px;z-index:99999;padding:12px 20px;background:#10b981;color:#fff;border-radius:8px;font-size:12px;font-weight:600;animation:fadeIn 0.3s;';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 5000);
    } catch (e) {
      // Paper trading fallback
      const macro = MACROS.find(m => m.id === macroId);
      const toast = document.createElement('div');
      toast.textContent = `📄 QFM Paper: ${macro?.name || macroId} on ${selected.symbol} — ${macro?.legs || 0} legs logged`;
      toast.style.cssText = 'position:fixed;top:60px;right:20px;z-index:99999;padding:12px 20px;background:#06b6d4;color:#fff;border-radius:8px;font-size:12px;font-weight:600;animation:fadeIn 0.3s;';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 5000);
      console.log('📄 QFM Paper:', { macroId, symbol: selected.symbol, lots, distance });
    } finally {
      setTimeout(() => setFiring(null), 500);
    }
  };

  return (
    <div className="quickfire-panel">
      <div className="qf-header">
        <span className="qf-title">⚡ Quick Fire Macros</span>
        <button className="modal-close" onClick={toggleQuickFire} style={{ width: 24, height: 24, fontSize: 14 }}>✕</button>
      </div>

      {selected && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>SELECTED UNDERLYING</div>
          <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: 14 }}>{selected.symbol}</div>
          <div style={{ fontFamily: 'var(--font-mono)', color: selected.changePct >= 0 ? 'var(--green-text)' : 'var(--red-text)' }}>
            {(selected.ltp || 0).toLocaleString('en-IN')} ({(selected.changePct || 0) >= 0 ? '+' : ''}{(selected.changePct || 0).toFixed(2)}%)
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <div className="order-field">
              <label style={{ fontSize: 9 }}>Lots</label>
              <input type="number" value={lots} onChange={e => setLots(+e.target.value)} min={1} max={50} style={{ width: 50, fontSize: 11, padding: '2px 4px' }} />
            </div>
            <div className="order-field">
              <label style={{ fontSize: 9 }}>Δ Distance</label>
              <input type="number" value={distance} onChange={e => setDistance(+e.target.value)} min={1} max={20} style={{ width: 50, fontSize: 11, padding: '2px 4px' }} />
            </div>
          </div>
        </div>
      )}

      <div className="qf-macro-list">
        {MACROS.map(m => (
          <div key={m.id} className={`qf-macro-item${firing === m.id ? ' firing' : ''}`}>
            <div>
              <div className="qf-macro-name">{m.name}</div>
              <div className="qf-macro-desc">
                {m.desc} · {m.legs} legs
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="qf-macro-hotkey">{m.hotkey}</span>
              <button
                className="qf-fire-btn"
                style={{ background: m.color, opacity: firing === m.id ? 0.5 : 1 }}
                disabled={firing === m.id}
                onClick={() => fireMacro(m.id)}
              >
                {firing === m.id ? '...' : 'FIRE'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text-muted)' }}>
        Select underlying → configure lots/distance → FIRE to execute via backend
      </div>
    </div>
  );
}
