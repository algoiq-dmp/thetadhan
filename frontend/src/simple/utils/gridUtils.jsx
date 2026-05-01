// Reusable Grid Utilities — CSV Export + Sort + Filter for ALL screens

/**
 * Export data array to CSV file and trigger download
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Array of { key, label } for column mapping
 * @param {string} screenName - Name for the file (e.g. 'OrderBook')
 */
export function exportGridCSV(data, columns, screenName) {
  if (!data || data.length === 0) return alert('No data to export')
  const now = new Date()
  const ts = now.toISOString().slice(0, 16).replace('T', '_').replace(':', '-')
  const filename = `LightZ_${screenName}_${ts}.csv`
  const BOM = '\uFEFF'
  const header = columns.map(c => c.label).join(',')
  const rows = data.map(row =>
    columns.map(c => {
      let val = row[c.key]
      if (val === null || val === undefined) return ''
      if (typeof val === 'string' && (val.includes(',') || val.includes('"')))
        return `"${val.replace(/"/g, '""')}"`
      return String(val)
    }).join(',')
  )
  const csv = BOM + header + '\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

/**
 * Sort data array by a column key
 * @param {Array} data - Array of objects
 * @param {string|null} sortKey - Column key to sort by (null = no sort)
 * @param {boolean} sortAsc - True = ascending
 * @returns {Array} Sorted copy of data
 */
export function sortGridData(data, sortKey, sortAsc) {
  if (!sortKey || !data) return data
  return [...data].sort((a, b) => {
    const va = a[sortKey] ?? '', vb = b[sortKey] ?? ''
    if (typeof va === 'number' && typeof vb === 'number') return sortAsc ? va - vb : vb - va
    return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
  })
}

/**
 * Filter data array by a quick text search across all visible column keys
 * @param {Array} data - Array of objects
 * @param {string} query - Search string
 * @param {Array} keys - Column keys to search in
 * @returns {Array} Filtered data
 */
export function filterGridData(data, query, keys) {
  if (!query || query.length < 1) return data
  const q = query.toLowerCase()
  return data.filter(row => keys.some(k => String(row[k] ?? '').toLowerCase().includes(q)))
}

/**
 * Reusable toolbar component for grid screens
 * Renders: title, count, filter input, export button
 */
export function GridToolbar({ title, count, filter, onFilter, onExport, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid var(--border)', fontSize: 9 }}>
      <span style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: 10 }}>{title}</span>
      <span style={{ color: '#5a5a6a' }}>({count})</span>
      {children}
      <input value={filter} onChange={e => onFilter(e.target.value)} placeholder="Filter..."
        style={{ marginLeft: 'auto', height: 18, width: 120, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8', padding: '0 6px', fontSize: 9, outline: 'none' }} />
      <button onClick={onExport} style={{ height: 18, padding: '0 6px', background: '#2a2a44', color: '#9aa0b0', border: '1px solid #3a3a5a', fontSize: 8, cursor: 'pointer' }}>⬇ CSV</button>
    </div>
  )
}

/**
 * Sortable table header cell
 */
export function SortTh({ colKey, label, sortKey, sortAsc, onSort, align, width, style }) {
  const active = sortKey === colKey
  return (
    <th onClick={() => onSort(colKey)} style={{
      textAlign: align || 'right', padding: '3px 6px', fontWeight: 500, fontSize: 9, color: active ? 'var(--accent)' : '#7a7a8c',
      background: 'linear-gradient(180deg, #2a2a44, #1e1e38)', border: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 5, cursor: 'pointer', textTransform: 'uppercase', whiteSpace: 'nowrap',
      width: width, ...style
    }}>
      {label} {active && <span style={{ fontSize: 7, marginLeft: 2 }}>{sortAsc ? '▲' : '▼'}</span>}
    </th>
  )
}
