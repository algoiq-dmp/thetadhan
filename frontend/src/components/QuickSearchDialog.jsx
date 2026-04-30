import { useState, useEffect, useRef } from 'react';
import useMarketStore from '../store/useMarketStore';

const API_URL = import.meta.env.VITE_API_URL || 'https://thetadhan-api.parlight2.workers.dev';

const TABS = [
  { id: 'all', label: 'All F&O' },
  { id: 'indices', label: 'Indices' },
  { id: 'equity', label: 'Equity' },
  { id: 'recent', label: 'Recent' },
];

const INDICES = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX', 'BANKEX'];
const RECENT_DEFAULT = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'HDFCBANK', 'TCS', 'INFY', 'SBIN', 'AXISBANK'];

export default function QuickSearchDialog({ onSelect, onClose }) {
  const addToWatchlist = useMarketStore(s => s.addToWatchlist);
  const setUniverse = useMarketStore(s => s.setUniverse);
  const universe = useMarketStore(s => s.universe);

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Search from D1 database via Worker API
  const searchDB = async (q, segment) => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/instruments/search?q=${encodeURIComponent(q)}&limit=30`;
      if (segment === 'equity') url += '&segment=NSE_EQ';
      else if (segment === 'all' || segment === 'indices') url += '&segment=NSE_FNO';

      const res = await fetch(url);
      const data = await res.json();
      return data.instruments || [];
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Load default results based on tab
  const loadDefaults = async (currentTab) => {
    if (currentTab === 'indices') {
      const r = await searchDB('NIFTY', 'all');
      setResults(r.filter(i => INDICES.some(idx => i.symbol === idx || i.symbol?.startsWith(idx))));
    } else if (currentTab === 'recent') {
      // Show recent symbols from universe or defaults
      const recentFromUniverse = universe.length > 0
        ? universe.slice(0, 20)
        : RECENT_DEFAULT.map(s => ({ symbol: s, ltp: 0, changePct: 0, lotSize: 0, exchange_segment: 'NSE_FNO' }));
      setResults(recentFromUniverse);
    } else {
      // Load popular F&O stocks as default
      const r = await searchDB('NIFTY', 'all');
      setResults(r.slice(0, 20));
    }
  };

  // On tab change, load defaults
  useEffect(() => {
    setQuery('');
    setSelectedIdx(0);
    loadDefaults(tab);
  }, [tab]);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      loadDefaults(tab);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const segment = tab === 'equity' ? 'equity' : 'all';
      const r = await searchDB(query, segment);
      setResults(r.slice(0, 25));
      setSelectedIdx(0);
    }, 250);
  }, [query, tab]);

  const handleSelect = (instrument) => {
    // Normalize to universe row format and add to store
    const row = {
      symbol: instrument.symbol || instrument.trading_symbol,
      token: instrument.security_id,
      ntoken: instrument.security_id,
      exchange_segment: instrument.exchange_segment || 'NSE_FNO',
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

    // Add to universe if not already there
    const exists = universe.find(u => String(u.token) === String(row.token));
    if (!exists) {
      setUniverse([...universe, row]);
    }

    // Add symbol to active watchlist
    addToWatchlist(row.symbol);

    onSelect(row.symbol);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[selectedIdx]) { handleSelect(results[selectedIdx]); }
    else if (e.key === 'Escape') onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: 480, maxHeight: 540, background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12,
          boxShadow: 'var(--shadow)', overflow: 'hidden', position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)' }}>

        {/* Search Input */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>{loading ? '⏳' : '🔍'}</span>
          <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search any symbol... (NIFTY, RELIANCE, TCS...)"
            style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, outline: 'none', fontFamily: 'inherit' }}
          />
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{results.length} results</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          {TABS.map(t => (
            <button key={t.id} className={`panel-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => { setTab(t.id); setSelectedIdx(0); }}
              style={{ flex: 1, fontSize: 10 }}>{t.label}</button>
          ))}
        </div>

        {/* Results */}
        <div style={{ maxHeight: 380, overflow: 'auto' }}>
          {results.map((r, i) => (
            <div key={`${r.symbol}-${r.security_id || i}`}
              onClick={() => handleSelect(r)}
              onMouseEnter={() => setSelectedIdx(i)}
              style={{
                display: 'flex', alignItems: 'center', padding: '8px 16px', cursor: 'pointer',
                background: i === selectedIdx ? 'var(--bg-row-selected)' : 'transparent',
                borderBottom: '1px solid var(--border)', transition: 'background 0.1s'
              }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>
                  {r.symbol || r.trading_symbol}
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 8, fontWeight: 400 }}>
                    {r.exchange_segment} · {r.instrument_type} {r.lot_size ? `· Lot ${r.lot_size}` : ''}
                  </span>
                </div>
                {r.expiry_date && (
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>
                    Expiry: {r.expiry_date} {r.strike_price ? `· Strike: ${r.strike_price}` : ''} {r.option_type || ''}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', marginLeft: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: (r.changePct || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {r.ltp ? r.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                </span>
              </div>
            </div>
          ))}
          {results.length === 0 && !loading && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              {query.length < 2 ? 'Type at least 2 characters to search' : `No results for "${query}"`}
            </div>
          )}
          {loading && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              ⏳ Searching 49,000+ instruments...
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '6px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)' }}>
          <span><span className="kbd">↑↓</span> Navigate · <span className="kbd">Enter</span> Add to Watch · <span className="kbd">Esc</span> Close</span>
          <span>Powered by Dhan Scrip Master · {tab.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
