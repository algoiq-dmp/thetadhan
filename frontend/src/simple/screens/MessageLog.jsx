import { useState, useRef, useEffect } from 'react'
import useAppStore from '../stores/useAppStore'

const TYPE_ICONS = { success: '✓', error: '✗', warning: '⚠', info: 'ⓘ' }
const TYPE_COLORS = { success: '#22c55e', error: '#ef4444', warning: '#eab308', info: '#4dabf7' }
const FILTERS = ['All', 'success', 'error', 'warning', 'info']

export default function MessageLog() {
  const messages = useAppStore(s => s.messages)
  const [filter, setFilter] = useState('All')
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef(null)

  const filtered = filter === 'All' ? messages : messages.filter(m => m.type === filter)
  const counts = { success: 0, error: 0, warning: 0, info: 0 }
  messages.forEach(m => { if (counts[m.type] !== undefined) counts[m.type]++ })

  useEffect(() => {
    if (autoScroll && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, autoScroll])

  const exportLog = (format) => {
    let content = ''
    if (format === 'csv') {
      content = 'Time,Type,Message\n' + filtered.map(m => `${m.time},${m.type},"${m.msg}"`).join('\n')
    } else {
      content = filtered.map(m => `[${m.time}] [${m.type.toUpperCase()}] ${m.msg}`).join('\n')
    }
    const blob = new Blob([content], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `message_log.${format === 'csv' ? 'csv' : 'txt'}`
    a.click()
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 6px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', fontSize: 9, flexWrap: 'wrap' }}>
        <span style={{ color: '#7a7a8c', fontWeight: 600 }}>Messages: {messages.length}</span>
        <span style={{ color: '#2a2a44' }}>│</span>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '1px 6px', fontSize: 8, border: '1px solid var(--border)', cursor: 'pointer',
            background: filter === f ? 'var(--bg-row-selected)' : 'transparent',
            color: filter === f ? (f === 'All' ? 'var(--accent)' : TYPE_COLORS[f]) : '#7a7a8c',
          }}>
            {f === 'All' ? `ALL (${messages.length})` : `${TYPE_ICONS[f]} ${f.toUpperCase()} (${counts[f]})`}
          </button>
        ))}
        <span style={{ marginLeft: 'auto' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8, color: '#7a7a8c', cursor: 'pointer' }}>
          <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} style={{ accentColor: '#00bcd4', width: 10, height: 10 }} />
          Auto-scroll
        </label>
        <select onChange={e => { if (e.target.value) exportLog(e.target.value); e.target.value = '' }}
          style={{ height: 18, background: '#2a2a44', color: '#d0d0d8', border: '1px solid #3a3a5a', fontSize: 8 }}>
          <option value="">Export ▼</option>
          <option value="txt">TXT</option>
          <option value="csv">CSV</option>
        </select>
        <button onClick={() => { /* Would clear messages */ }}
          style={{ height: 18, padding: '0 6px', background: '#C62828', color: '#fff', border: 'none', fontSize: 8, cursor: 'pointer' }}>CLEAR</button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '2px 0' }}>
        {filtered.map((m, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 6, padding: '3px 8px', fontSize: 10,
            borderBottom: '1px solid rgba(42,42,68,0.2)',
            background: i % 2 === 0 ? 'var(--bg-row-even)' : 'var(--bg-row-odd)',
          }}>
            <span style={{ fontFamily: 'var(--grid-font)', color: '#5a5a6a', minWidth: 55, fontSize: 9 }}>{m.time}</span>
            <span style={{
              fontWeight: 700, fontSize: 11, minWidth: 14, textAlign: 'center',
              color: TYPE_COLORS[m.type] || '#7a7a8c'
            }}>{TYPE_ICONS[m.type] || '•'}</span>
            <span style={{ color: '#d0d0d8', flex: 1 }}>{m.msg}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: '#5a5a6a', fontSize: 10 }}>No messages matching filter</div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 8px', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid var(--border)', fontSize: 9, color: '#7a7a8c' }}>
        <span style={{ color: '#22c55e' }}>✓ {counts.success}</span>
        <span style={{ color: '#ef4444' }}>✗ {counts.error}</span>
        <span style={{ color: '#eab308' }}>⚠ {counts.warning}</span>
        <span style={{ color: '#4dabf7' }}>ⓘ {counts.info}</span>
        <span style={{ marginLeft: 'auto' }}>Showing {filtered.length}/{messages.length}</span>
      </div>
    </div>
  )
}
