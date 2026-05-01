import React, { useState, useRef, useEffect, useCallback } from 'react'
import useAppStore from '../stores/useAppStore'
import InlineSettings, { SField, SSel, SChk, GearBtn } from '../components/InlineSettings'
import ContextMenu from '../components/ContextMenu'
import { PORTFOLIO_REGISTRY } from '../mock/portfolios'
import ActionIcon from '../components/ActionIcons'
import ContractDetailPopup from '../components/ContractDetailPopup'

// All 30 KB-spec columns
const ALL_COLUMNS = [
  { key: 'symbol', label: 'Symbol', w: 95, align: 'left', locked: true, render: (v) => <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{v}</span> },
  { key: 'exchange', label: 'Exch', w: 36 },
  { key: 'instrument', label: 'Inst', w: 48 },
  { key: 'ltp', label: 'LTP', w: 68, locked: true, render: (v, r) => <span style={{ fontWeight: 700, color: r.chg >= 0 ? '#22c55e' : '#ef4444' }}>{v?.toFixed(2)}</span> },
  { key: 'chg', label: 'Chg', w: 52, render: (v) => <span className={v >= 0 ? 'price-up' : 'price-down'}>{v >= 0 ? '+' : ''}{v?.toFixed(2)}</span> },
  { key: 'chgP', label: '%Chg', w: 50, render: (v) => <span className={v >= 0 ? 'price-up' : 'price-down'}>{v >= 0 ? '+' : ''}{v?.toFixed(2)}%</span> },
  { key: 'open', label: 'Open', w: 62, render: v => v?.toFixed(2) },
  { key: 'high', label: 'High', w: 62, render: v => <span style={{ color: '#22c55e' }}>{v?.toFixed(2)}</span> },
  { key: 'low', label: 'Low', w: 62, render: v => <span style={{ color: '#ef4444' }}>{v?.toFixed(2)}</span> },
  { key: 'close', label: 'Prev Cls', w: 62, render: v => v?.toFixed(2) },
  { key: 'bid', label: 'Bid', w: 58, render: (v) => <span style={{ color: '#4dabf7' }}>{v?.toFixed(2)}</span> },
  { key: 'bidQty', label: 'Bid Qty', w: 50, render: v => v?.toLocaleString() },
  { key: 'ask', label: 'Ask', w: 58, render: (v) => <span style={{ color: '#ff6b6b' }}>{v?.toFixed(2)}</span> },
  { key: 'askQty', label: 'Ask Qty', w: 50, render: v => v?.toLocaleString() },
  { key: 'vol', label: 'Volume', w: 58, render: v => v >= 100000 ? (v / 100000).toFixed(1) + 'L' : (v / 1000).toFixed(1) + 'K' },
  { key: 'oi', label: 'OI', w: 55, render: v => v > 0 ? (v / 100000).toFixed(1) + 'L' : '—' },
  { key: 'oiChg', label: 'OI Chg', w: 55, render: v => v !== 0 ? (v > 0 ? '+' : '') + (v / 100000).toFixed(1) + 'L' : '—' },
  { key: 'atp', label: 'ATP', w: 62, render: v => v?.toFixed(2) },
  { key: 'ltq', label: 'LTQ', w: 42, render: v => v?.toLocaleString() },
  { key: 'totalBuyQty', label: 'Tot Buy', w: 55, render: v => v >= 100000 ? (v / 100000).toFixed(1) + 'L' : (v / 1000).toFixed(0) + 'K' },
  { key: 'totalSellQty', label: 'Tot Sell', w: 55, render: v => v >= 100000 ? (v / 100000).toFixed(1) + 'L' : (v / 1000).toFixed(0) + 'K' },
  { key: 'upperCkt', label: 'Up Ckt', w: 62, render: v => v > 0 ? v.toFixed(2) : '—' },
  { key: 'lowerCkt', label: 'Lw Ckt', w: 62, render: v => v > 0 ? v.toFixed(2) : '—' },
  { key: 'w52High', label: '52W Hi', w: 62, render: v => v > 0 ? v.toFixed(2) : '—' },
  { key: 'w52Low', label: '52W Lo', w: 62, render: v => v > 0 ? v.toFixed(2) : '—' },
  { key: 'expiry', label: 'Expiry', w: 80, render: v => v || '—' },
  { key: 'strikePrice', label: 'Strike', w: 50, render: v => v || '—' },
  { key: 'optionType', label: 'OT', w: 28, render: v => v ? <span style={{ color: v === 'CE' ? '#4dabf7' : '#ff6b6b', fontWeight: 600 }}>{v}</span> : '—' },
  { key: 'lotSize', label: 'Lot', w: 42, render: v => v?.toLocaleString() },
  { key: 'turnover', label: 'Turnover', w: 65, render: v => v >= 100000 ? '₹' + (v / 100000).toFixed(1) + 'L' : '₹' + (v / 1000).toFixed(1) + 'K' },
]

const DEFAULT_VISIBLE = ['symbol', 'exchange', 'ltp', 'chg', 'chgP', 'open', 'high', 'low', 'close', 'bid', 'ask', 'vol', 'oi']
const BUILTIN_NAMES = Object.keys(PORTFOLIO_REGISTRY)
const loadCustomPortfolios = () => { try { return JSON.parse(localStorage.getItem('lightz-custom-portfolios')) || {} } catch { return {} } }
const saveCustomPortfolios = (p) => localStorage.setItem('lightz-custom-portfolios', JSON.stringify(p))
const EXCHANGE_FILTERS = ['ALL', 'NSE', 'BSE', 'MCX']
const INSTRUMENT_FILTERS = ['ALL', 'EQ', 'FUT', 'CE', 'PE', 'IDX']

// Load persisted column order + widths
const loadColState = () => {
  try { return JSON.parse(localStorage.getItem('lightz-mw-cols')) } catch { return null }
}
const saveColState = (visible, order, widths) => {
  localStorage.setItem('lightz-mw-cols', JSON.stringify({ visible, order, widths }))
}
// Named Column Profiles
const COLUMN_PROFILES = {
  'Equity View': ['symbol', 'exchange', 'ltp', 'chg', 'chgP', 'open', 'high', 'low', 'close', 'vol', 'turnover', 'w52High', 'w52Low'],
  'FnO View': ['symbol', 'exchange', 'ltp', 'chg', 'chgP', 'bid', 'ask', 'vol', 'oi', 'oiChg', 'expiry', 'strikePrice', 'optionType', 'lotSize'],
  'Scalping View': ['symbol', 'ltp', 'chg', 'bid', 'bidQty', 'ask', 'askQty', 'vol', 'ltq'],
  'Full View': ALL_COLUMNS.map(c => c.key),
}
const loadSavedProfiles = () => { try { return JSON.parse(localStorage.getItem('lightz-col-profiles')) || {} } catch { return {} } }
const saveSavedProfiles = (p) => localStorage.setItem('lightz-col-profiles', JSON.stringify(p))

export default function MarketWatch({ mwId = 1 }) {
  const storeSymbols = useAppStore(s => s.symbols)
  const setSelectedToken = useAppStore(s => s.setSelectedToken)
  const selectedToken = useAppStore(s => s.selectedToken)
  const openWindow = useAppStore(s => s.openWindow)

  const [customPortfolios, setCustomPortfolios] = useState(loadCustomPortfolios)
  const PORTFOLIO_NAMES = [...BUILTIN_NAMES, ...Object.keys(customPortfolios)]

  const [portfolio, setPortfolio] = useState('Default')
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showColPicker, setShowColPicker] = useState(false)
  const [ctxMenu, setCtxMenu] = useState(null)
  const [flashTokens, setFlashTokens] = useState({})
  const [separators, setSeparators] = useState([])
  const [removedTokens, setRemovedTokens] = useState([])
  const [customOrder, setCustomOrder] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [addScrip, setAddScrip] = useState({ exchange: 'NSE', instrument: 'EQ', symbol: '', expiry: '24-Apr-2026', strike: '24200', optType: 'CE' })
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [contractPopup, setContractPopup] = useState(null) // { sym, x, y }
  const searchRef = useRef(null)
  const prevLtps = useRef({})
  const dragRowRef = useRef(null)
  const gridRef = useRef(null)

  // Column state — persisted
  const saved = loadColState()
  const [visibleCols, setVisibleCols] = useState(saved?.visible || DEFAULT_VISIBLE)
  const [colOrder, setColOrder] = useState(saved?.order || ALL_COLUMNS.map(c => c.key))
  const [colWidths, setColWidths] = useState(saved?.widths || {})
  const [sortCol, setSortCol] = useState(null)
  const [sortAsc, setSortAsc] = useState(true)
  const resizingCol = useRef(null)
  const resizeStartX = useRef(0)
  const resizeStartW = useRef(0)

  // Filter state
  const [exchFilter, setExchFilter] = useState('ALL')
  const [instFilter, setInstFilter] = useState('ALL')
  const [quickFilter, setQuickFilter] = useState('')

  // Persist column state on change
  useEffect(() => { saveColState(visibleCols, colOrder, colWidths) }, [visibleCols, colOrder, colWidths])

  // Settings
  const [mwSettings, setMwSettings] = useState({
    flash: true, gridlines: true, freezeSymbol: true
  })
  const setMw = (k, v) => setMwSettings(p => ({ ...p, [k]: v }))

  // Get active symbols from portfolio, removing deleted ones
  const rawSymbols = portfolio === 'Default' ? storeSymbols : (customPortfolios[portfolio] || PORTFOLIO_REGISTRY[portfolio] || storeSymbols)
  const activeSymbols = rawSymbols.filter(s => !removedTokens.includes(s.token))

  // Apply filters
  let filtered = activeSymbols
  if (exchFilter !== 'ALL') filtered = filtered.filter(s => s.exchange === exchFilter)
  if (instFilter !== 'ALL') {
    if (instFilter === 'FUT') filtered = filtered.filter(s => s.type === 'FUT' || s.instrument?.includes('FUT'))
    else if (instFilter === 'CE') filtered = filtered.filter(s => s.optionType === 'CE')
    else if (instFilter === 'PE') filtered = filtered.filter(s => s.optionType === 'PE')
    else if (instFilter === 'IDX') filtered = filtered.filter(s => s.type === 'IDX' || s.instrument === 'INDEX')
    else filtered = filtered.filter(s => s.instrument === instFilter || s.type === instFilter)
  }
  if (quickFilter) filtered = filtered.filter(s => s.symbol.toLowerCase().includes(quickFilter.toLowerCase()))

  // Apply sort
  if (sortCol) {
    filtered = [...filtered].sort((a, b) => {
      const va = a[sortCol] ?? '', vb = b[sortCol] ?? ''
      if (typeof va === 'number') return sortAsc ? va - vb : vb - va
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })
  }

  // Column order + visibility
  const orderedCols = colOrder.map(k => ALL_COLUMNS.find(c => c.key === k)).filter(Boolean)
  const cols = orderedCols.filter(c => visibleCols.includes(c.key))

  // Persist column changes
  useEffect(() => { saveColState(visibleCols, colOrder) }, [visibleCols, colOrder])

  // LTP Flash + tick direction tracking
  useEffect(() => {
    if (!mwSettings.flash) return
    const interval = setInterval(() => {
      const newFlash = {}
      activeSymbols.forEach(sym => {
        const prev = prevLtps.current[sym.token]
        if (prev !== undefined && prev !== sym.ltp) newFlash[sym.token] = sym.ltp > prev ? 'up' : 'down'
        prevLtps.current[sym.token] = sym.ltp
      })
      if (Object.keys(newFlash).length > 0) {
        setFlashTokens(prev => ({ ...prev, ...newFlash }))
        setLastUpdate(new Date())
        setTimeout(() => setFlashTokens(prev => {
          const next = { ...prev }; Object.keys(newFlash).forEach(k => { if (next[k]) next[k] = next[k] + '-done' }); return next
        }), 500)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [activeSymbols, mwSettings.flash])

  // Delete scrip
  const deleteScrip = (token) => setRemovedTokens(prev => [...prev, token])

  // Insert separator after selected row
  const insertSeparator = (afterIdx) => setSeparators(prev => [...prev, afterIdx])

  // CSV Export
  const exportCSV = () => {
    const header = cols.map(c => c.label).join(',')
    const rows = filtered.map(s => cols.map(c => s[c.key] ?? '').join(','))
    const csv = header + '\n' + rows.join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `${portfolio}_market_watch.csv`; a.click()
  }

  // Copy row to clipboard
  const copyRow = (sym) => {
    const text = cols.map(c => sym[c.key] ?? '').join('\t')
    navigator.clipboard.writeText(text)
  }

  // Row drag reorder
  const onRowDragStart = (e, idx) => { dragRowRef.current = idx; e.dataTransfer.effectAllowed = 'move' }
  const onRowDrop = (e, targetIdx) => {
    e.preventDefault(); const fromIdx = dragRowRef.current; if (fromIdx === null || fromIdx === targetIdx) return
    const arr = customOrder ? [...customOrder] : filtered.map((_, i) => i)
    const [moved] = arr.splice(fromIdx, 1); arr.splice(targetIdx, 0, moved)
    setCustomOrder(arr); dragRowRef.current = null
  }

  const toggleCol = (key) => {
    const col = ALL_COLUMNS.find(c => c.key === key)
    if (col?.locked) return
    setVisibleCols(v => v.includes(key) ? v.filter(k => k !== key) : [...v, key])
  }

  const moveCol = (key, dir) => {
    setColOrder(prev => {
      const idx = prev.indexOf(key)
      if (idx < 0) return prev
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const arr = [...prev]
      ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
      return arr
    })
  }

  const handleSort = (key) => {
    if (sortCol === key) setSortAsc(!sortAsc)
    else { setSortCol(key); setSortAsc(true) }
  }

  // Drag-and-drop columns
  const dragCol = useRef(null)
  const onDragStart = (e, key) => { dragCol.current = key; e.dataTransfer.effectAllowed = 'move' }
  const onDragOver = (e) => e.preventDefault()
  const onDrop = (e, targetKey) => {
    e.preventDefault()
    if (!dragCol.current || dragCol.current === targetKey) return
    setColOrder(prev => {
      const fromIdx = prev.indexOf(dragCol.current)
      const toIdx = prev.indexOf(targetKey)
      if (fromIdx < 0 || toIdx < 0) return prev
      const arr = [...prev]
      arr.splice(fromIdx, 1)
      arr.splice(toIdx, 0, dragCol.current)
      return arr
    })
    dragCol.current = null
  }

  const handleContextMenu = useCallback((e, sym, idx) => {
    e.preventDefault()
    setSelectedToken(sym.token)
    setCtxMenu({
      x: e.clientX, y: e.clientY,
      items: [
        { label: 'Buy Order', icon: '🟦', shortcut: 'F1', action: () => openWindow({ id: 'buy', title: 'Buy Order [F1]', x: 50, y: 20, w: 380, h: 580 }) },
        { label: 'Sell Order', icon: '🟥', shortcut: 'F2', action: () => openWindow({ id: 'sell', title: 'Sell Order [F2]', x: 440, y: 20, w: 380, h: 580 }) },
        '—',
        { label: 'Market Depth', icon: '📊', shortcut: 'F6', action: () => openWindow({ id: 'depth', title: 'Market Depth [F6]', x: 80, y: 40, w: 380, h: 350 }) },
        { label: 'Market Picture', icon: '📋', shortcut: 'F5', action: () => openWindow({ id: 'mp', title: 'Market Picture [F5]', x: 60, y: 30, w: 400, h: 450 }) },
        { label: 'Option Chain', icon: '📑', shortcut: 'F7', action: () => openWindow({ id: 'oc', title: 'Option Chain [F7]', x: 10, y: 10, w: 1000, h: 450 }) },
        { label: 'Intraday Chart', icon: '📈', shortcut: 'Ctrl+I', action: () => openWindow({ id: 'chart', title: 'Chart [F9]', x: 20, y: 20, w: 850, h: 480 }) },
        '—',
        { label: 'Delete Scrip', icon: '✕', danger: true, shortcut: 'Del', action: () => deleteScrip(sym.token) },
        { label: 'Move Up', icon: '▲', action: () => {} },
        { label: 'Move Down', icon: '▼', action: () => {} },
        { label: 'Insert Separator', icon: '─', shortcut: 'Shift+Enter', action: () => insertSeparator(idx) },
        '—',
        { label: 'Copy to Clipboard', icon: '📋', action: () => copyRow(sym) },
        { label: 'Export to CSV', icon: '💾', action: () => exportCSV() },
        { label: 'Security Info', icon: 'ℹ', shortcut: 'Shift+F7', action: () => alert(`ISIN: ${sym.isin || 'INE001A01036'}\nLot Size: ${sym.lotSize}\nTick Size: 0.05\nExchange: ${sym.exchange}`) },
        { label: 'Set Alert', icon: '🔔', action: () => alert('Alert dialog — coming soon') },
      ]
    })
  }, [openWindow, setSelectedToken, cols, filtered, portfolio])

  const upCount = filtered.filter(s => s.chg > 0).length
  const downCount = filtered.filter(s => s.chg < 0).length
  const unchCount = filtered.filter(s => s.chg === 0).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 6px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', fontSize: 10, flexWrap: 'wrap' }}>
        <span style={{ color: '#7a7a8c', fontSize: 9 }}>Portfolio:</span>
        <select value={portfolio} onChange={e => setPortfolio(e.target.value)}
          style={{ height: 20, background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: 9, maxWidth: 170 }}>
          {PORTFOLIO_NAMES.map(n => <option key={n}>{n}</option>)}
        </select>
        <ActionIcon type="add" tooltip="New Portfolio" onClick={() => { const name = prompt('New portfolio name:'); if (name && !PORTFOLIO_NAMES.includes(name)) { const next = { ...customPortfolios, [name]: [...storeSymbols.slice(0,5)] }; setCustomPortfolios(next); saveCustomPortfolios(next); setPortfolio(name) } }} />
        <ActionIcon type="edit" tooltip="Rename Portfolio" onClick={() => { if (BUILTIN_NAMES.includes(portfolio)) return alert('Cannot rename built-in portfolio'); const name = prompt('Rename to:', portfolio); if (name && name !== portfolio && !PORTFOLIO_NAMES.includes(name)) { const next = { ...customPortfolios }; next[name] = next[portfolio]; delete next[portfolio]; setCustomPortfolios(next); saveCustomPortfolios(next); setPortfolio(name) } }} />
        <ActionIcon type="remove" tooltip="Delete Portfolio" onClick={() => { if (BUILTIN_NAMES.includes(portfolio)) return alert('Cannot delete built-in portfolio'); if (!confirm(`Delete portfolio "${portfolio}"?`)) return; const next = { ...customPortfolios }; delete next[portfolio]; setCustomPortfolios(next); saveCustomPortfolios(next); setPortfolio('Default') }} />
        <ActionIcon type="search" tooltip="Add Scrip" shortcut="Ins" onClick={() => { setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 50) }} />
        <ActionIcon type="columns" tooltip="Column Picker" badge={`${visibleCols.length}/${ALL_COLUMNS.length}`} onClick={() => setShowColPicker(s => !s)} />
        <ActionIcon type="export" tooltip="Export CSV" onClick={exportCSV} />
        <ActionIcon type="import" tooltip="Import CSV" onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.csv'; inp.onchange = (e) => {
          const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => {
            const lines = ev.target.result.split('\n').filter(l => l.trim()).slice(1)
            alert(`Portfolio Import: ${lines.length} scrips parsed from ${f.name}`)
          }; r.readAsText(f) }; inp.click() }} />
        <ActionIcon type="cancelAll" tooltip="Cancel All Open Orders" shortcut="Ctrl+Shift+F8" onClick={() => {
          if (window.confirm('⚠️ CANCEL ALL OPEN ORDERS?\n\nAre you sure you want to cancel ALL pending orders across ALL segments?\n\nThis action cannot be undone.')) {
            alert('✓ All open orders cancelled successfully.')
          }
        }} />
        <ActionIcon type="killSwitch" tooltip="KILL SWITCH — Exit All Positions" shortcut="Ctrl+Shift+K" onClick={() => {
          if (window.confirm('🚨 PANIC KILL SWITCH 🚨\n\nAre you sure you want to:\n• Cancel ALL pending orders\n• Square off ALL open positions\n• Disable new order placement\n\n⚠️ This is an EMERGENCY action and cannot be reversed!')) {
            if (window.confirm('FINAL CONFIRMATION:\n\nThis will liquidate ALL positions at MARKET price.\n\nType OK to proceed.')) {
              alert('🔴 KILL SWITCH ACTIVATED\n\nAll orders cancelled.\nAll positions squared off at market.\nNew order placement disabled.')
            }
          }
        }} />
        <span style={{ marginLeft: 'auto', fontSize: 8, color: '#7a7a8c' }}>
          <span style={{ color: '#22c55e' }}>↑{upCount}</span> <span style={{ color: '#ef4444' }}>↓{downCount}</span> — {filtered.length} scrips
        </span>
        <GearBtn onClick={() => setShowSettings(s => !s)} />
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', background: 'rgba(0,188,212,0.03)', borderBottom: '1px solid var(--border)', fontSize: 9 }}>
        {EXCHANGE_FILTERS.map(f => (
          <button key={f} onClick={() => setExchFilter(f)} style={{
            padding: '1px 6px', fontSize: 8, border: '1px solid var(--border)', cursor: 'pointer',
            background: exchFilter === f ? 'var(--bg-row-selected)' : 'transparent',
            color: exchFilter === f ? 'var(--accent)' : '#7a7a8c',
          }}>{f}</button>
        ))}
        <span style={{ color: '#2a2a44' }}>│</span>
        {INSTRUMENT_FILTERS.map(f => (
          <button key={f} onClick={() => setInstFilter(f)} style={{
            padding: '1px 6px', fontSize: 8, border: '1px solid var(--border)', cursor: 'pointer',
            background: instFilter === f ? 'var(--bg-row-selected)' : 'transparent',
            color: instFilter === f ? '#eab308' : '#7a7a8c',
          }}>{f}</button>
        ))}
        <span style={{ color: '#2a2a44' }}>│</span>
        <input value={quickFilter} onChange={e => setQuickFilter(e.target.value)} placeholder="Filter..."
          style={{ height: 18, width: 90, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8', padding: '0 4px', fontSize: 9, outline: 'none' }} />
        {(exchFilter !== 'ALL' || instFilter !== 'ALL' || quickFilter) && (
          <ActionIcon type="clear" tooltip="Clear Filters" onClick={() => { setExchFilter('ALL'); setInstFilter('ALL'); setQuickFilter('') }} />
        )}
      </div>

      {/* Column Picker */}
      {showColPicker && (
        <div style={{ padding: '6px 8px', background: 'rgba(0,188,212,0.04)', borderBottom: '1px solid var(--border)', maxHeight: 240, overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, color: '#7a7a8c', fontWeight: 600 }}>COLUMNS — {visibleCols.length}/{ALL_COLUMNS.length}</span>
            <span style={{ color: 'var(--border)', fontSize: 8 }}>│</span>
            <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>Profiles:</span>
            {Object.keys({ ...COLUMN_PROFILES, ...loadSavedProfiles() }).map(name => (
              <button key={name} onClick={() => { const p = { ...COLUMN_PROFILES, ...loadSavedProfiles() }; setVisibleCols(p[name]) }}
                style={{ fontSize: 7, padding: '1px 5px', background: '#2a2a44', color: '#d0d0d8', border: '1px solid #3a3a5a', cursor: 'pointer' }}>{name}</button>
            ))}
            <ActionIcon type="save" tooltip="Save Profile" onClick={() => { const name = prompt('Save current columns as:'); if (name) { const sp = loadSavedProfiles(); sp[name] = [...visibleCols]; saveSavedProfiles(sp) } }} />
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              <ActionIcon type="selectAll" tooltip="Show All Columns" onClick={() => setVisibleCols(ALL_COLUMNS.map(c => c.key))} />
              <ActionIcon type="deselectAll" tooltip="Default Columns" onClick={() => setVisibleCols(DEFAULT_VISIBLE)} />
              <ActionIcon type="close" tooltip="Close Picker" onClick={() => setShowColPicker(false)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px 8px' }}>
            {orderedCols.map((c, i) => (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '1px 2px', fontSize: 9 }}>
                <button onClick={() => moveCol(c.key, -1)} style={{ fontSize: 7, padding: '0 2px', background: 'transparent', border: 'none', color: '#7a7a8c', cursor: 'pointer' }}>◄</button>
                <label style={{ display: 'flex', alignItems: 'center', gap: 2, color: visibleCols.includes(c.key) ? '#d0d0d8' : '#5a5a6a', cursor: c.locked ? 'not-allowed' : 'pointer', flex: 1 }}>
                  <input type="checkbox" checked={visibleCols.includes(c.key)} onChange={() => toggleCol(c.key)} disabled={c.locked} style={{ accentColor: '#00bcd4', width: 10, height: 10 }} />
                  {c.label}{c.locked && <span style={{ fontSize: 7, color: '#eab308' }}>🔒</span>}
                </label>
                <button onClick={() => moveCol(c.key, 1)} style={{ fontSize: 7, padding: '0 2px', background: 'transparent', border: 'none', color: '#7a7a8c', cursor: 'pointer' }}>►</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      <InlineSettings show={showSettings} onClose={() => setShowSettings(false)} title="Market Watch Settings">
        <SChk checked={mwSettings.flash} label="Flash on Tick" onChange={v => setMw('flash', v)} />
        <SChk checked={mwSettings.gridlines} label="Gridlines" onChange={v => setMw('gridlines', v)} />
        <SChk checked={mwSettings.freezeSymbol} label="Freeze Symbol" onChange={v => setMw('freezeSymbol', v)} />
      </InlineSettings>

      {/* Add Scrip Modal — ODIN Structured Workflow */}
      {showSearch && (
        <div style={{ padding: '6px 8px', background: 'rgba(0,188,212,0.06)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--accent)' }}>+ ADD SCRIP</span>
            {/* Step indicator */}
            <div style={{ display: 'flex', gap: 2, marginLeft: 8 }}>
              {['Exchange','Instrument','Symbol','Expiry','Strike','Type'].map((step, si) => {
                const isDerivative = addScrip.instrument.includes('FUT') || addScrip.instrument.includes('OPT')
                const isOption = addScrip.instrument.includes('OPT')
                const active = si <= 2 || (si === 3 && isDerivative) || (si >= 4 && isOption)
                const done = si === 0 ? !!addScrip.exchange : si === 1 ? !!addScrip.instrument : si === 2 ? addScrip.symbol.length >= 2 : si === 3 ? !!addScrip.expiry : si === 4 ? !!addScrip.strike : !!addScrip.optType
                if (!active) return null
                return <span key={si} style={{ fontSize: 7, padding: '1px 4px', background: done ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', color: done ? '#22c55e' : '#5a5a6a', border: `1px solid ${done ? '#22c55e40' : '#2a2a44'}` }}>{si+1}.{step} {done ? '✓' : ''}</span>
              })}
            </div>
            <span style={{ flex: 1 }} />
            <button onClick={() => { setShowSearch(false); setSearch(''); setAddScrip({ exchange: 'NSE', instrument: 'EQ', symbol: '', expiry: '', strike: '', optType: 'CE' }) }}
              style={{ height: 18, padding: '0 6px', background: '#C62828', color: '#fff', border: 'none', fontSize: 8, cursor: 'pointer' }}>✕ Close</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 7, color: '#5a5a6a', textTransform: 'uppercase' }}>1. Exchange</span>
              <select value={addScrip.exchange} onChange={e => setAddScrip(p => ({ ...p, exchange: e.target.value }))}
                style={addSelS}>{['NSE', 'BSE', 'MCX'].map(o => <option key={o}>{o}</option>)}</select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 7, color: '#5a5a6a', textTransform: 'uppercase' }}>2. Instrument</span>
              <select value={addScrip.instrument} onChange={e => setAddScrip(p => ({ ...p, instrument: e.target.value }))}
                style={addSelS}>{['EQ', 'FUTSTK', 'FUTIDX', 'OPTSTK', 'OPTIDX', 'FUTCUR', 'OPTCUR'].map(o => <option key={o}>{o}</option>)}</select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
              <span style={{ fontSize: 7, color: '#5a5a6a', textTransform: 'uppercase' }}>3. Symbol</span>
              <input ref={searchRef} value={addScrip.symbol} onChange={e => setAddScrip(p => ({ ...p, symbol: e.target.value }))}
                placeholder="Start typing..."
                onKeyDown={e => { if (e.key === 'Escape') { setShowSearch(false) } }}
                style={{ height: 22, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8', padding: '0 6px', fontSize: 11, fontFamily: 'var(--grid-font)', outline: 'none', width: '100%' }} />
            </div>
            {(addScrip.instrument.includes('FUT') || addScrip.instrument.includes('OPT')) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 7, color: '#5a5a6a', textTransform: 'uppercase' }}>4. Expiry</span>
                <select value={addScrip.expiry} onChange={e => setAddScrip(p => ({ ...p, expiry: e.target.value }))}
                  style={addSelS}>{['24-Apr-2026', '01-May-2026', '29-May-2026', '26-Jun-2026'].map(o => <option key={o}>{o}</option>)}</select>
              </div>
            )}
            {addScrip.instrument.includes('OPT') && (<>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 7, color: '#5a5a6a', textTransform: 'uppercase' }}>5. Strike</span>
                <select value={addScrip.strike} onChange={e => setAddScrip(p => ({ ...p, strike: e.target.value }))}
                  style={addSelS}>{['24000', '24100', '24200', '24300', '24400', '24500', '24600', '24700', '24800'].map(o => <option key={o}>{o}</option>)}</select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 7, color: '#5a5a6a', textTransform: 'uppercase' }}>6. Type</span>
                <select value={addScrip.optType} onChange={e => setAddScrip(p => ({ ...p, optType: e.target.value }))}
                  style={{ ...addSelS, color: addScrip.optType === 'CE' ? '#4dabf7' : '#ff6b6b' }}>{['CE', 'PE'].map(o => <option key={o}>{o}</option>)}</select>
              </div>
            </>)}
            <button onClick={() => {
              const sym = addScrip.symbol.toUpperCase() || 'NIFTY'
              alert(`Scrip added: ${addScrip.exchange} ${addScrip.instrument} ${sym}${addScrip.expiry ? ' ' + addScrip.expiry : ''}${addScrip.strike ? ' ' + addScrip.strike + addScrip.optType : ''}`)
            }} style={{ height: 22, padding: '0 10px', background: 'var(--accent)', color: '#000', border: 'none', fontSize: 9, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-end' }}>+ Add</button>
          </div>
          {addScrip.symbol.length >= 1 && (
            <div style={{ marginTop: 4, maxHeight: 80, overflow: 'auto', background: '#0a0a1a', border: '1px solid #2a2a44', fontSize: 9 }}>
              {storeSymbols.filter(s => s.symbol.toLowerCase().includes(addScrip.symbol.toLowerCase())).slice(0, 8).map(s => (
                <div key={s.token} onClick={() => setAddScrip(p => ({ ...p, symbol: s.symbol }))}
                  style={{ padding: '2px 8px', cursor: 'pointer', display: 'flex', gap: 8, borderBottom: '1px solid rgba(42,42,68,0.3)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-row-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ color: '#d0d0d8', fontWeight: 600, minWidth: 80 }}>{s.symbol}</span>
                  <span style={{ color: '#5a5a6a' }}>{s.exchange}</span>
                  <span style={{ color: '#5a5a6a' }}>{s.instrument || s.type}</span>
                  <span style={{ color: s.chg >= 0 ? '#22c55e' : '#ef4444', marginLeft: 'auto' }}>{s.ltp?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      <div ref={gridRef} tabIndex={0} style={{ flex: 1, overflow: 'auto', outline: 'none' }}
        onKeyDown={(e) => {
          const max = filtered.length - 1
          if (max < 0) return
          let next = selectedIdx
          if (e.key === 'ArrowDown') { e.preventDefault(); next = Math.min(max, selectedIdx + 1) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); next = Math.max(0, selectedIdx - 1) }
          else if (e.key === 'Home') { e.preventDefault(); next = 0 }
          else if (e.key === 'End') { e.preventDefault(); next = max }
          else if (e.key === 'PageDown') { e.preventDefault(); next = Math.min(max, selectedIdx + 20) }
          else if (e.key === 'PageUp') { e.preventDefault(); next = Math.max(0, selectedIdx - 20) }
          else if (e.key === 'Enter') { e.preventDefault(); if (filtered[selectedIdx]) { setSelectedToken(filtered[selectedIdx].token); openWindow({ id: 'buy', title: 'Buy Order [F1]', x: 50, y: 20, w: 380, h: 580 }) } }
          else return
          setSelectedIdx(next)
          if (filtered[next]) setSelectedToken(filtered[next].token)
          // Scroll into view
          const rows = gridRef.current?.querySelectorAll('tbody tr')
          if (rows?.[next]) rows[next].scrollIntoView({ block: 'nearest' })
        }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--grid-font)', fontSize: 10 }}>
          <thead>
            <tr>
              <th style={{ ...thS, width: 22, textAlign: 'center', position: 'sticky', left: 0, zIndex: 10 }}>#</th>
              {cols.map((c, ci) => {
                const w = colWidths[c.key] || c.w
                const isFreeze = mwSettings.freezeSymbol && ci === 0
                return (
                <th key={c.key} style={{ ...thS, width: w, minWidth: 30, textAlign: c.align || 'right', cursor: 'grab', position: 'sticky', top: 0, left: isFreeze ? 22 : undefined, zIndex: isFreeze ? 10 : 5 }}
                  draggable onDragStart={e => onDragStart(e, c.key)} onDragOver={onDragOver} onDrop={e => onDrop(e, c.key)}
                  onClick={() => handleSort(c.key)}
                  onContextMenu={(e) => { e.preventDefault(); setShowColPicker(s => !s) }}>
                  {c.label}
                  {sortCol === c.key && <span style={{ fontSize: 7, marginLeft: 2 }}>{sortAsc ? '▲' : '▼'}</span>}
                  <div style={{ position:'absolute', right:0, top:0, bottom:0, width:4, cursor:'col-resize', background:'transparent' }}
                    onDoubleClick={(e) => { e.stopPropagation(); setColWidths(p => { const next = { ...p }; delete next[c.key]; return next }) }}
                    onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); resizingCol.current = c.key; resizeStartX.current = e.clientX; resizeStartW.current = w;
                      const onMove = (ev) => { const diff = ev.clientX - resizeStartX.current; setColWidths(p => ({ ...p, [resizingCol.current]: Math.max(30, resizeStartW.current + diff) })) }
                      const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); resizingCol.current = null;
                        setColWidths(p => { saveColState(visibleCols, colOrder, p); return p }) }
                      document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
                    }} onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'} onMouseLeave={e => { if (!resizingCol.current) e.currentTarget.style.background = 'transparent' }} />
                </th>)
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map((sym, i) => {
              const flash = flashTokens[sym.token]
              const flashActive = flash && !flash.endsWith('-done')
              const tickDir = flash?.replace('-done', '')
              const atCircuit = sym.ltp >= sym.upperCkt && sym.upperCkt > 0 || sym.ltp <= sym.lowerCkt && sym.lowerCkt > 0
              return (
                <React.Fragment key={sym.token}>
                  <tr tabIndex={0} draggable
                    onDragStart={e => onRowDragStart(e, i)} onDragOver={e => e.preventDefault()} onDrop={e => onRowDrop(e, i)}
                    onClick={() => { setSelectedToken(sym.token); setSelectedIdx(i) }}
                    onDoubleClick={() => { setSelectedToken(sym.token); openWindow({ id: 'buy', title: 'Buy Order [F1]', x: 50, y: 20, w: 380, h: 580 }) }}
                    onContextMenu={(e) => handleContextMenu(e, sym, i)}
                    onKeyDown={e => { if (e.key === 'Delete') deleteScrip(sym.token); if (e.shiftKey && e.key === 'Enter') insertSeparator(i) }}
                    style={{
                      cursor: 'pointer', outline: 'none',
                      background: atCircuit ? 'rgba(234,179,8,0.08)' : selectedIdx === i ? 'var(--bg-row-selected)' : selectedToken === sym.token ? 'rgba(15,52,96,0.5)' : i % 2 === 0 ? 'var(--bg-row-even)' : 'var(--bg-row-odd)',
                      borderBottom: mwSettings.gridlines ? '1px solid rgba(42,42,68,0.3)' : 'none',
                      borderLeft: atCircuit ? '2px solid #eab308' : selectedIdx === i ? '2px solid var(--accent)' : '2px solid transparent',
                    }}>
                    <td style={{ textAlign: 'center', padding: '2px 4px', color: '#5a5a6a', fontSize: 9, position: 'sticky', left: 0, zIndex: 2, background: 'inherit' }}>{i + 1}</td>
                    {cols.map((c, ci) => (
                      <td key={c.key}
                        className={c.key === 'ltp' && flashActive ? (tickDir === 'up' ? 'ltp-flash-up' : 'ltp-flash-down') : ''}
                        style={{ textAlign: c.align || 'right', padding: '2px 6px', height: 22, position: (mwSettings.freezeSymbol && ci === 0) ? 'sticky' : undefined, left: (mwSettings.freezeSymbol && ci === 0) ? 22 : undefined, zIndex: (mwSettings.freezeSymbol && ci === 0) ? 2 : undefined, background: (mwSettings.freezeSymbol && ci === 0) ? 'inherit' : undefined }}>
                        {c.key === 'ltp' ? (
                          <span style={{ fontWeight: 700, color: sym.chg >= 0 ? '#22c55e' : '#ef4444' }}>
                            {sym.ltp?.toFixed(2)}
                            <span style={{ fontSize: 7, marginLeft: 2, opacity: 0.7 }}>{tickDir === 'up' ? '▲' : tickDir === 'down' ? '▼' : ''}</span>
                          </span>
                        ) : c.key === 'symbol' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 600, color: 'var(--text-bright)' }}>
                            {sym.symbol}
                            <span
                              onClick={(e) => { e.stopPropagation(); setSelectedToken(sym.token); openWindow({ id: 'chart', title: `Chart — ${sym.symbol}`, x: 20, y: 20, w: 850, h: 480 }) }}
                              title="Open Chart"
                              style={{ cursor: 'pointer', color: '#5a5a6a', display: 'inline-flex', transition: 'color 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.color = '#4dabf7'}
                              onMouseLeave={e => e.currentTarget.style.color = '#5a5a6a'}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-10"/>
                              </svg>
                            </span>
                            <span
                              onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); setContractPopup({ sym, x: rect.right + 4, y: rect.top }) }}
                              title="Contract Details"
                              style={{ cursor: 'pointer', color: '#5a5a6a', display: 'inline-flex', transition: 'color 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.color = '#eab308'}
                              onMouseLeave={e => e.currentTarget.style.color = '#5a5a6a'}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                              </svg>
                            </span>
                          </span>
                        ) : c.render ? c.render(sym[c.key], sym) : (sym[c.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                  {separators.includes(i) && (
                    <tr><td colSpan={cols.length + 1} style={{ height: 6, background: 'rgba(42,42,68,0.15)', borderBottom: '1px dashed rgba(42,42,68,0.4)' }} /></tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 8px', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid var(--border)', fontSize: 9, color: '#7a7a8c' }}>
        <span>MW{mwId} │ Total: <b style={{ color: '#d0d0d8' }}>{filtered.length}</b> scrips</span>
        <span>│ <span style={{ color: '#22c55e' }}>↑{upCount}</span> <span style={{ color: '#ef4444' }}>↓{downCount}</span> <span style={{ color: '#7a7a8c' }}>─{unchCount}</span></span>
        <span style={{ color: '#5a5a6a' }}>│ {portfolio}</span>
        <span style={{ color: '#5a5a6a' }}>│ Last: {lastUpdate.toLocaleTimeString('en-IN', { hour12: false })}</span>
        <ActionIcon type="csv" tooltip="Export CSV" compact onClick={exportCSV} />
        <span style={{ marginLeft: 'auto', fontSize: 8 }}>F1=Buy │ F2=Sell │ Del=Remove │ Shift+Enter=Separator</span>
      </div>

      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={() => setCtxMenu(null)} />}
      {contractPopup && <ContractDetailPopup sym={contractPopup.sym} x={contractPopup.x} y={contractPopup.y} onClose={() => setContractPopup(null)} />}
    </div>
  )
}

const thS = {
  textAlign: 'right', padding: '3px 6px', fontWeight: 500, fontSize: 9, color: '#7a7a8c',
  background: 'linear-gradient(180deg, #2a2a44, #1e1e38)', border: '1px solid var(--border)',
  position: 'sticky', top: 0, zIndex: 5, textTransform: 'uppercase', whiteSpace: 'nowrap'
}
const addSelS = { height: 22, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8', padding: '0 4px', fontSize: 10 }
