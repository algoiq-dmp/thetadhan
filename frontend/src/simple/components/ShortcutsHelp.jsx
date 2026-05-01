const SHORTCUTS = [
  { cat: 'Order Entry', items: [
    { key: 'F1', desc: 'Buy Order' }, { key: 'F2', desc: 'Sell Order' },
    { key: 'Shift+F1', desc: 'Cancel Order' }, { key: 'Shift+F2', desc: 'Modify Order' },
    { key: 'Shift+F3', desc: 'Cancel All Open Orders' },
    { key: 'Ctrl+F3', desc: 'Spread Order (2-leg)' },
    { key: 'Enter', desc: 'Submit Order (in order form)' }, { key: 'Esc', desc: 'Close Order Form' },
  ]},
  { cat: 'View Screens', items: [
    { key: 'F3', desc: 'Order Book' }, { key: 'F4', desc: 'Market Watch' },
    { key: 'F5', desc: 'Market Picture' }, { key: 'F6', desc: 'Market Depth / Best Five' },
    { key: 'F7', desc: 'Option Chain' }, { key: 'F8', desc: 'Trade Book' },
    { key: 'F9', desc: 'Charts' }, { key: 'F10', desc: 'Message Log' },
    { key: 'F11', desc: 'Historical Data' }, { key: 'F12', desc: 'Portfolio Analysis' },
    { key: 'Alt+F6', desc: 'Net Position' }, { key: 'Shift+F6', desc: 'Net Position' },
  ]},
  { cat: 'Info & Analysis', items: [
    { key: 'Shift+F7', desc: 'Security Info / Snap Quote' },
    { key: 'Shift+F8', desc: 'Contract Info / Snap Quote' },
    { key: 'Shift+F9', desc: 'Snap Quote' },
    { key: 'Shift+F10', desc: 'Most Active / Heat Map' },
    { key: 'Shift+F12', desc: 'Market Movement / Heat Map' },
    { key: 'Ctrl+I', desc: 'Intraday Chart' },
    { key: 'Ctrl+H', desc: 'Historical Data' },
  ]},
  { cat: 'Market Watch', items: [
    { key: 'Enter', desc: 'Buy selected scrip' }, { key: 'Shift+Enter', desc: 'Sell selected scrip' },
    { key: 'Del', desc: 'Remove scrip from MW' }, { key: 'Ins', desc: 'Add scrip to MW' },
    { key: 'Ctrl+Shift+Enter', desc: 'Add separator line' }, { key: '↑/↓', desc: 'Navigate rows' },
  ]},
  { cat: 'Position & System', items: [
    { key: 'Ctrl+Shift+X', desc: 'Square Off All Positions' },
    { key: 'Ctrl+Shift+C', desc: 'Convert MIS↔NRML' },
    { key: 'Ctrl+/', desc: 'Show Shortcuts (this panel)' },
    { key: 'Ctrl+S', desc: 'Save Workspace Layout' },
    { key: 'Ctrl+F4', desc: 'Close Active Window' },
    { key: 'Esc', desc: 'Close Focused Window / This Panel' },
  ]},
]

export default function ShortcutsHelp({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
    }} onClick={onClose}>
      <div style={{
        width: 620, maxHeight: '80vh', background: 'var(--bg-panel)',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-window)',
        overflow: 'auto'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '8px 14px',
          background: 'var(--bg-titlebar)', borderBottom: '1px solid var(--border)'
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>⌨ Keyboard Shortcuts</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#7a7a8c' }}>LIGHT Z v1.0.0</span>
          <button onClick={onClose} style={{
            marginLeft: 12, width: 20, height: 18, background: 'var(--sell)', color: 'white',
            border: 'none', cursor: 'pointer', fontSize: 10
          }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ padding: '8px 14px' }}>
          {SHORTCUTS.map((cat, ci) => (
            <div key={ci} style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 10, color: 'var(--accent)', fontWeight: 600,
                padding: '4px 0', borderBottom: '1px solid rgba(0,188,212,0.2)',
                marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1
              }}>{cat.cat}</div>
              {cat.items.map((s, si) => (
                <div key={si} style={{
                  display: 'flex', alignItems: 'center', padding: '3px 0',
                  borderBottom: '1px solid rgba(42,42,68,0.2)'
                }}>
                  <span style={{
                    display: 'inline-block', minWidth: 100, padding: '2px 8px',
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    fontSize: 10, fontFamily: 'var(--grid-font)', color: '#d0d0d8',
                    textAlign: 'center', fontWeight: 600
                  }}>{s.key}</span>
                  <span style={{ fontSize: 10, color: '#9aa0b0', marginLeft: 12 }}>{s.desc}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '6px 14px', textAlign: 'center', fontSize: 9, color: '#4a4a5c',
          borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)'
        }}>
          Press <b style={{ color: '#d0d0d8' }}>Esc</b> or click outside to close • All shortcuts match ODIN Classic keybindings
        </div>
      </div>
    </div>
  )
}
