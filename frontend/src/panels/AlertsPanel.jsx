import { useState } from 'react';
import useMarketStore from '../store/useMarketStore';

const MOCK_ALERTS = [
  { id: 1, symbol: 'NIFTY', condition: 'Price > 24500', status: 'active', type: 'price', createdAt: '09:45' },
  { id: 2, symbol: 'BANKNIFTY', condition: 'PCR < 0.8', status: 'active', type: 'pcr', createdAt: '10:12' },
  { id: 3, symbol: 'RELIANCE', condition: 'IV > 40', status: 'triggered', type: 'iv', createdAt: '10:30' },
  { id: 4, symbol: 'HDFCBANK', condition: 'Near Upper Circuit', status: 'active', type: 'circuit', createdAt: '11:05' },
];

const ALERT_TYPES = [
  { value: 'price', label: '💰 Price', desc: 'Price crosses above/below level' },
  { value: 'oi', label: '📊 OI Change', desc: 'OI change exceeds threshold' },
  { value: 'iv', label: '📉 IV Level', desc: 'IV crosses above/below level' },
  { value: 'pcr', label: '📈 PCR', desc: 'Put-Call Ratio threshold' },
  { value: 'volume', label: '📊 Volume', desc: 'Volume spike detection' },
  { value: 'circuit', label: '🚨 Circuit', desc: 'Near upper/lower circuit' },
];

export default function AlertsPanel() {
  const [tab, setTab] = useState('active');
  const [showCreate, setShowCreate] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const openOrderEntry = useMarketStore(s => s.openOrderEntry);

  const filtered = MOCK_ALERTS.filter(a => tab === 'active' ? a.status === 'active' : a.status === 'triggered');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        {['active', 'triggered', 'all'].map(t => (
          <button key={t} className={`panel-tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)} style={{ flex: 1, fontSize: 10, textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>

      {/* Controls */}
      <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => setShowCreate(!showCreate)}
          style={{ padding: '4px 10px', fontSize: 10, fontWeight: 700, border: '1px solid var(--cyan)', borderRadius: 4, background: 'var(--cyan-soft)', color: 'var(--cyan)', cursor: 'pointer' }}>
          + Create Alert
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, fontSize: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={voiceEnabled} onChange={e => setVoiceEnabled(e.target.checked)} /> 🔊 Voice
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={soundEnabled} onChange={e => setSoundEnabled(e.target.checked)} /> 🎵 Sound
          </label>
        </div>
      </div>

      {/* Create Alert Form */}
      {showCreate && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>New Alert</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div className="order-field" style={{ flex: 1 }}>
              <label>Symbol</label>
              <input defaultValue="NIFTY" style={{ width: '100%' }} />
            </div>
            <div className="order-field" style={{ flex: 1 }}>
              <label>Type</label>
              <select style={{ width: '100%' }}>
                {ALERT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div className="order-field" style={{ flex: 1 }}>
              <label>Condition</label>
              <select style={{ width: '100%' }}>
                <option>Crosses Above</option>
                <option>Crosses Below</option>
                <option>Greater Than</option>
                <option>Less Than</option>
              </select>
            </div>
            <div className="order-field" style={{ flex: 1 }}>
              <label>Value</label>
              <input type="number" defaultValue="24500" style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked /> Toast
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked /> Voice
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked /> Sound
            </label>
            <button onClick={() => { setShowCreate(false); alert('Alert created!'); }}
              style={{ marginLeft: 'auto', padding: '4px 16px', fontSize: 10, fontWeight: 700, border: 'none', borderRadius: 4, background: 'var(--cyan)', color: '#fff', cursor: 'pointer' }}>
              Create
            </button>
          </div>
        </div>
      )}

      {/* Alert List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No {tab} alerts
          </div>
        )}
        {filtered.map(a => (
          <div key={a.id} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.status === 'active' ? 'var(--green)' : 'var(--orange)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-heading)' }}>
                {a.symbol} — {a.condition}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                {a.type.toUpperCase()} · Created {a.createdAt}
              </div>
            </div>
            <button onClick={() => openOrderEntry({ symbol: a.symbol, side: 'BUY' })} style={{ background: 'none', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 4, color: '#10b981', cursor: 'pointer', fontSize: 9, padding: '2px 6px', fontWeight: 600 }} title={`Trade ${a.symbol}`}>🛒</button>
            <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--red)', cursor: 'pointer', fontSize: 10, padding: '2px 6px' }}
              title="Delete alert">✕</button>
          </div>
        ))}
      </div>

      {/* Quick Alerts */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Quick Alerts</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {['NIFTY ±100', 'BN ±200', 'All Circuit', 'IV Spike', 'OI Breakout'].map(q => (
            <button key={q} className="sector-pill" style={{ fontSize: 8, padding: '2px 6px' }}>{q}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
