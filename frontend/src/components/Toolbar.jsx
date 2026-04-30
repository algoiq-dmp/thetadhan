import useMarketStore from '../store/useMarketStore';
import { SECTOR_NAMES } from '../data/sectors';

export default function Toolbar({ searchRef, onAddScrip }) {
  const { searchQuery, sectorFilter, movementFilter, universe } = useMarketStore();
  const setSearch = useMarketStore(s => s.setSearch);
  const setSector = useMarketStore(s => s.setSector);
  const setMovement = useMarketStore(s => s.setMovement);
  const getFiltered = useMarketStore(s => s.getFiltered);

  const filtered = getFiltered();

  return (
    <div className="app-toolbar">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          ref={searchRef}
          type="text"
          placeholder="Search symbols... (Ctrl+F)"
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
        />
        {searchQuery && (
          <button style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      <div className="separator" />

      <div className="sector-pills">
        <button className={`sector-pill${sectorFilter === 'ALL' ? ' active' : ''}`} onClick={() => setSector('ALL')}>All</button>
        {SECTOR_NAMES.map(s => (
          <button key={s} className={`sector-pill${sectorFilter === s ? ' active' : ''}`} onClick={() => setSector(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="separator" />

      <select className="filter-select" value={movementFilter} onChange={e => setMovement(e.target.value)}>
        <option value="ALL">All Movement</option>
        <option value="GAINERS">Gainers {'>'} 1%</option>
        <option value="LOSERS">Losers {'<'}-1%</option>
        <option value="STRONG_UP">Strong {'>'} 3%</option>
        <option value="STRONG_DOWN">Strong {'<'}-3%</option>
      </select>

      <div className="toolbar-right">
        {onAddScrip && (
          <button onClick={onAddScrip} title="Add Instrument (Insert)"
            style={{ padding: '3px 10px', fontSize: 10, fontWeight: 700, borderRadius: 4, border: '1px solid rgba(6,182,212,0.3)', cursor: 'pointer', background: 'rgba(6,182,212,0.08)', color: '#06b6d4', marginRight: 8, transition: 'all 0.2s' }}>
            + Add Scrip
          </button>
        )}
        <span>Showing: <span className="toolbar-count">{filtered.length}</span> / <span className="toolbar-count">{universe.length}</span></span>
      </div>
    </div>
  );
}
