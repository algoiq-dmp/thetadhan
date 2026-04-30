import { useState, useEffect, useRef } from 'react';
import useMarketStore from '../store/useMarketStore';

const API_URL = import.meta.env.VITE_API_URL || 'https://thetadhan-api.parlight2.workers.dev';

export default function AddScripDialog({ onAdd, onClose, position }) {
  const addToWatchlist = useMarketStore(s => s.addToWatchlist);
  const setUniverse = useMarketStore(s => s.setUniverse);
  const universe = useMarketStore(s => s.universe);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [segment, setSegment] = useState('NSE_FNO');
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `${API_URL}/api/instruments/search?q=${encodeURIComponent(query)}&segment=${segment}&limit=25`;
        const res = await fetch(url);
        const data = await res.json();
        setResults(data.instruments || []);
        setSelectedIdx(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, [query, segment]);

  const handleAdd = (instrument) => {
    const row = {
      symbol: instrument.symbol || instrument.trading_symbol,
      token: instrument.security_id,
      ntoken: instrument.security_id,
      exchange_segment: instrument.exchange_segment || segment,
      ltp: 0, prevClose: 0, change: 0, changePct: 0,
      todayHigh: 0, todayLow: 0, volume: 0, oi: 0,
      sma30: 0, sma100: 0, sma200: 0, iv: 0,
      sector: instrument.exchange_segment === 'NSE_EQ' ? 'EQ' : 'F&O',
      lotSize: instrument.lot_size || 0,
      strike: instrument.strike_price || 0,
      callPut: instrument.option_type || '',
      expiry: instrument.expiry_date || '',
      type: instrument.instrument_type || '',
      flashClass: '',
    };

    const exists = universe.find(u => String(u.token) === String(row.token));
    if (!exists) {
      setUniverse([...universe, row]);
    }

    addToWatchlist(row.symbol);
    onAdd(row);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[selectedIdx]) handleAdd(results[selectedIdx]);
    else if (e.key === 'Escape') onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div className="modal-title">➕ Add Instrument to Market Watch</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '12px 16px', display: 'flex', gap: 8, borderBottom: '1px solid var(--border)' }}>
          <select value={segment} onChange={e => setSegment(e.target.value)}
            style={{ height: 34, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 11, padding: '0 8px' }}>
            <option value="NSE_FNO">NSE F&O</option>
            <option value="NSE_EQ">NSE Equity</option>
            <option value="">All Segments</option>
          </select>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="Type symbol... e.g. NIFTY, RELIANCE, TCS"
            style={{ flex: 1, height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
          />
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 120 }}>
          {loading && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>⏳ Searching...</div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No instruments found for "{query}"</div>
          )}
          {!loading && query.length < 2 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
              Type at least 2 characters to search 49,000+ instruments
            </div>
          )}
          {results.map((r, i) => (
            <div key={`${r.security_id}-${i}`}
              onClick={() => handleAdd(r)}
              onMouseEnter={() => setSelectedIdx(i)}
              style={{
                padding: '8px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                background: i === selectedIdx ? 'var(--bg-row-selected)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-mono)' }}>
                  {r.symbol || r.trading_symbol}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                  {r.exchange_segment} · {r.instrument_type}
                  {r.expiry_date ? ` · Expiry: ${r.expiry_date}` : ''}
                  {r.strike_price ? ` · Strike: ₹${r.strike_price}` : ''}
                  {r.option_type ? ` · ${r.option_type}` : ''}
                  {r.lot_size ? ` · Lot: ${r.lot_size}` : ''}
                </div>
              </div>
              <button className="btn-buy" style={{ padding: '2px 12px', height: 24, fontSize: 10 }}>
                + Add
              </button>
            </div>
          ))}
        </div>

        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: 9, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
          <span><span className="kbd">↑↓</span> Navigate · <span className="kbd">Enter</span> Add · <span className="kbd">Esc</span> Close</span>
          <span>Insert key also opens this dialog</span>
        </div>
      </div>
    </div>
  );
}
