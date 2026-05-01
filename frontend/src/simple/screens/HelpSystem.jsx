import { useState, useMemo } from 'react'
import { SCREEN_HELP, SETTINGS_HELP, FAQ } from '../data/helpData'

const CATEGORIES = {
  'Core': ['mw', 'buy', 'sell', 'ob', 'tb', 'np'],
  'Analysis': ['oc', 'chart', 'hist', 'depth', 'mp', 'snap', 'heatmap', 'pa'],
  'Orders': ['bo', 'co', 'spread', 'basket', 'gridOrd', 'ptst', 'excelOrd', 'posUp'],
  'Calculators': ['calc', 'margin', 'pivot', 'fib'],
  'Scanners': ['alerts', 'scanner', 'ticker'],
  'Workspace': ['multiMW', 'trail', 'expenses', 'bhav'],
  'Config': ['settings', 'broadcast', 'exchSet'],
}

export default function HelpSystem() {
  const [tab, setTab] = useState('screens')
  const [selectedScreen, setSelectedScreen] = useState(null)
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [search, setSearch] = useState('')

  // Search across all content
  const searchResults = useMemo(() => {
    if (!search || search.length < 2) return null
    const q = search.toLowerCase()
    const results = []
    Object.entries(SCREEN_HELP).forEach(([id, h]) => {
      if (h.title.toLowerCase().includes(q) || h.desc.toLowerCase().includes(q) ||
          h.features?.some(f => f.toLowerCase().includes(q))) {
        results.push({ type: 'screen', id, title: h.title, desc: h.desc })
      }
    })
    SETTINGS_HELP.forEach(s => {
      if (s.tab.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q))
        results.push({ type: 'setting', id: s.tab, title: `Settings → ${s.tab}`, desc: s.desc })
    })
    FAQ.forEach((f, i) => {
      if (f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
        results.push({ type: 'faq', id: i, title: f.q, desc: f.a })
    })
    return results
  }, [search])

  const tabs = [
    { id: 'screens', label: '📋 Screens', count: Object.keys(SCREEN_HELP).length },
    { id: 'settings', label: '⚙ Settings', count: SETTINGS_HELP.length },
    { id: 'faq', label: '❓ FAQ', count: FAQ.length },
    { id: 'search', label: '🔍 Search' },
  ]

  const sel = selectedScreen ? SCREEN_HELP[selectedScreen] : null

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)' }}>
      {/* Header */}
      <div style={{ padding: '6px 12px', background: 'var(--bg-surface)', borderBottom: '2px solid var(--accent)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>📖 Light Z Help Guide</span>
        <span style={{ fontSize: 9, color: '#7a7a8c' }}>{Object.keys(SCREEN_HELP).length} screens │ {SETTINGS_HELP.length} settings │ {FAQ.length} FAQs</span>
        <input value={search} onChange={e => { setSearch(e.target.value); if (e.target.value.length >= 2) setTab('search') }}
          placeholder="Search help..."
          style={{ marginLeft: 'auto', height: 22, width: 180, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8', padding: '0 8px', fontSize: 10, outline: 'none' }} />
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '5px 14px', fontSize: 10, border: 'none', cursor: 'pointer',
            background: tab === t.id ? 'var(--bg-panel)' : 'transparent',
            color: tab === t.id ? 'var(--accent)' : '#7a7a8c',
            borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            fontWeight: tab === t.id ? 600 : 400,
          }}>{t.label} {t.count != null && <span style={{ fontSize: 8, color: '#5a5a6a' }}>({t.count})</span>}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', display: 'flex' }}>
        {/* SCREENS TAB */}
        {tab === 'screens' && (<>
          {/* Left: category list */}
          <div style={{ width: 220, borderRight: '1px solid var(--border)', overflow: 'auto', flexShrink: 0 }}>
            {Object.entries(CATEGORIES).map(([cat, ids]) => (
              <div key={cat}>
                <div style={{ padding: '4px 10px', fontSize: 8, color: '#5a5a6a', textTransform: 'uppercase', background: 'rgba(0,0,0,0.1)', borderBottom: '1px solid var(--border)', fontWeight: 600, letterSpacing: 1 }}>{cat}</div>
                {ids.map(id => {
                  const h = SCREEN_HELP[id]
                  if (!h) return null
                  return (
                    <div key={id} onClick={() => setSelectedScreen(id)}
                      style={{ padding: '4px 10px', fontSize: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(42,42,68,0.2)', background: selectedScreen === id ? 'var(--bg-row-selected)' : 'transparent' }}
                      onMouseEnter={e => { if (selectedScreen !== id) e.currentTarget.style.background = 'var(--bg-row-hover)' }}
                      onMouseLeave={e => { if (selectedScreen !== id) e.currentTarget.style.background = 'transparent' }}>
                      <span style={{ color: selectedScreen === id ? 'var(--accent)' : '#d0d0d8', fontWeight: selectedScreen === id ? 600 : 400 }}>{h.title}</span>
                      {h.shortcut !== '—' && <span style={{ fontSize: 7, color: '#5a5a6a', background: '#1a1a2e', padding: '0 4px', borderRadius: 2 }}>{h.shortcut}</span>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          {/* Right: detail */}
          <div style={{ flex: 1, overflow: 'auto', padding: '10px 16px' }}>
            {sel ? (<>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <h2 style={{ fontSize: 16, color: 'var(--text-bright)', margin: 0, fontFamily: 'var(--ui-font)' }}>{sel.title}</h2>
                {sel.shortcut !== '—' && <span style={{ fontSize: 10, color: '#000', background: 'var(--accent)', padding: '1px 8px', fontWeight: 700 }}>{sel.shortcut}</span>}
              </div>
              <p style={{ fontSize: 11, color: '#9aa0b0', lineHeight: 1.5, margin: '0 0 12px' }}>{sel.desc}</p>

              <div style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Features</div>
              <ul style={{ margin: '0 0 12px', paddingLeft: 16, fontSize: 10, color: '#d0d0d8', lineHeight: 1.8 }}>
                {sel.features?.map((f, i) => <li key={i} style={{ marginBottom: 1 }}>{f}</li>)}
              </ul>

              {sel.tips?.length > 0 && (<>
                <div style={{ fontSize: 9, color: '#eab308', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>💡 Tips</div>
                <ul style={{ margin: '0 0 12px', paddingLeft: 16, fontSize: 10, color: '#eab308', lineHeight: 1.8, opacity: 0.9 }}>
                  {sel.tips.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </>)}

              {sel.related?.length > 0 && (<>
                <div style={{ fontSize: 9, color: '#7a7a8c', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Related Screens</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {sel.related.map(r => (
                    <button key={r} onClick={() => setSelectedScreen(r)} style={{
                      padding: '2px 8px', fontSize: 9, border: '1px solid #3a3a5a', background: '#2a2a44',
                      color: '#d0d0d8', cursor: 'pointer'
                    }}>{SCREEN_HELP[r]?.title || r}</button>
                  ))}
                </div>
              </>)}
            </>) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#5a5a6a' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📖</div>
                <div style={{ fontSize: 12 }}>Select a screen from the left panel to view help</div>
                <div style={{ fontSize: 10, marginTop: 4, color: '#3a3a5a' }}>{Object.keys(SCREEN_HELP).length} screens documented</div>
              </div>
            )}
          </div>
        </>)}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <div style={{ flex: 1, overflow: 'auto', padding: '10px 16px' }}>
            <h2 style={{ fontSize: 14, color: 'var(--text-bright)', margin: '0 0 8px', fontFamily: 'var(--ui-font)' }}>⚙ Settings Guide — 11 Tabs</h2>
            {SETTINGS_HELP.map((s, i) => (
              <div key={i} style={{ marginBottom: 8, padding: '8px 12px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{s.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-bright)' }}>{s.tab}</span>
                </div>
                <p style={{ fontSize: 10, color: '#9aa0b0', margin: '0 0 4px', lineHeight: 1.5 }}>{s.desc}</p>
                {s.tips?.length > 0 && (
                  <div style={{ fontSize: 9, color: '#eab308' }}>
                    💡 {s.tips.join(' │ ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* FAQ TAB */}
        {tab === 'faq' && (
          <div style={{ flex: 1, overflow: 'auto', padding: '10px 16px' }}>
            <h2 style={{ fontSize: 14, color: 'var(--text-bright)', margin: '0 0 8px', fontFamily: 'var(--ui-font)' }}>❓ Frequently Asked Questions ({FAQ.length})</h2>
            {FAQ.map((f, i) => (
              <div key={i} onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                style={{ marginBottom: 2, border: '1px solid var(--border)', cursor: 'pointer', background: expandedFaq === i ? 'rgba(0,188,212,0.04)' : 'transparent' }}>
                <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-bright)', fontWeight: expandedFaq === i ? 600 : 400 }}>
                  <span style={{ color: 'var(--accent)', fontSize: 8, width: 12 }}>{expandedFaq === i ? '▼' : '▶'}</span>
                  <span>Q{i + 1}. {f.q}</span>
                </div>
                {expandedFaq === i && (
                  <div style={{ padding: '4px 10px 8px 28px', fontSize: 10, color: '#9aa0b0', lineHeight: 1.6, borderTop: '1px solid var(--border)' }}>
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* SEARCH TAB */}
        {tab === 'search' && (
          <div style={{ flex: 1, overflow: 'auto', padding: '10px 16px' }}>
            <h2 style={{ fontSize: 14, color: 'var(--text-bright)', margin: '0 0 8px' }}>
              🔍 Search Results {searchResults ? `(${searchResults.length})` : ''}
            </h2>
            {!searchResults && <div style={{ color: '#5a5a6a', fontSize: 11, padding: 20 }}>Type at least 2 characters to search...</div>}
            {searchResults?.length === 0 && <div style={{ color: '#5a5a6a', fontSize: 11, padding: 20 }}>No results found for "{search}"</div>}
            {searchResults?.map((r, i) => (
              <div key={i} onClick={() => { if (r.type === 'screen') { setSelectedScreen(r.id); setTab('screens') } else if (r.type === 'faq') { setExpandedFaq(r.id); setTab('faq') } else setTab('settings') }}
                style={{ padding: '6px 10px', marginBottom: 2, border: '1px solid var(--border)', cursor: 'pointer', background: 'rgba(0,0,0,0.1)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-row-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 7, padding: '1px 4px', background: r.type === 'screen' ? '#1565C0' : r.type === 'faq' ? '#eab308' : '#22c55e', color: '#fff', fontWeight: 700, textTransform: 'uppercase' }}>{r.type}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-bright)', fontWeight: 600 }}>{r.title}</span>
                </div>
                <div style={{ fontSize: 9, color: '#7a7a8c', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Contextual help popup — used by MDIWindow ? button
export function HelpPopup({ screenId, onClose }) {
  const help = SCREEN_HELP[screenId]
  if (!help) return null

  return (
    <div style={{
      position: 'absolute', top: 28, right: 4, width: 320, maxHeight: 400, overflow: 'auto',
      background: '#1a1a2e', border: '1px solid var(--accent)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      zIndex: 9999, padding: '10px 12px', fontSize: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--accent)' }}>📖 {help.title}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>✕</button>
      </div>
      {help.shortcut !== '—' && <div style={{ fontSize: 9, color: '#000', background: 'var(--accent)', display: 'inline-block', padding: '1px 6px', marginBottom: 6, fontWeight: 700 }}>Shortcut: {help.shortcut}</div>}
      <p style={{ color: '#9aa0b0', lineHeight: 1.5, margin: '0 0 8px' }}>{help.desc}</p>
      <div style={{ fontSize: 8, color: 'var(--accent)', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase' }}>Features</div>
      <ul style={{ margin: '0 0 8px', paddingLeft: 14, color: '#d0d0d8', lineHeight: 1.7 }}>
        {help.features?.slice(0, 6).map((f, i) => <li key={i}>{f}</li>)}
        {(help.features?.length || 0) > 6 && <li style={{ color: '#5a5a6a' }}>+{help.features.length - 6} more...</li>}
      </ul>
      {help.tips?.length > 0 && (<>
        <div style={{ fontSize: 8, color: '#eab308', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase' }}>💡 Tips</div>
        <ul style={{ margin: 0, paddingLeft: 14, color: '#eab308', lineHeight: 1.7, opacity: 0.9 }}>
          {help.tips.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </>)}
    </div>
  )
}
