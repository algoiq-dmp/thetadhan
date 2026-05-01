import { useEffect, useRef } from 'react'

export default function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [onClose])

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      if (rect.right > window.innerWidth) ref.current.style.left = (window.innerWidth - rect.width - 4) + 'px'
      if (rect.bottom > window.innerHeight) ref.current.style.top = (window.innerHeight - rect.height - 4) + 'px'
    }
  }, [x, y])

  return (
    <div ref={ref} className="context-menu" style={{ left: x, top: y }}>
      {items.map((item, i) => {
        if (item === '—') return <div key={i} className="context-menu-sep" />
        return (
          <button key={i}
            className={`context-menu-item ${item.danger ? 'danger' : ''}`}
            onClick={() => { item.action?.(); onClose() }}>
            {item.icon && <span style={{ fontSize: 12, width: 16, textAlign: 'center' }}>{item.icon}</span>}
            {item.label}
            {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
          </button>
        )
      })}
    </div>
  )
}

// Confirm Dialog component
export function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className="confirm-title">{title}</div>
        <div className="confirm-body">{message}</div>
        <div className="confirm-actions">
          <button className="btn btn-default" onClick={onCancel} style={{ height: 24, padding: '0 14px', fontSize: 10 }}>Cancel</button>
          <button className={`btn ${danger ? 'btn-sell' : 'btn-primary'}`} onClick={onConfirm}
            style={{ height: 24, padding: '0 14px', fontSize: 10 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

// Modify Order Dialog
export function ModifyOrderDialog({ order, onConfirm, onCancel }) {
  return (
    <div className="modify-overlay" onClick={onCancel}>
      <div className="modify-dialog" onClick={e => e.stopPropagation()}>
        <div className="modify-title">Modify Order — {order?.symbol} ({order?.side})</div>
        <div className="modify-body">
          <div className="modify-row">
            <span className="modify-label">Symbol</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-bright)' }}>{order?.symbol}</span>
          </div>
          <div className="modify-row">
            <span className="modify-label">Side</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: order?.side === 'BUY' ? 'var(--buy)' : 'var(--sell)' }}>{order?.side}</span>
          </div>
          <div className="modify-row">
            <span className="modify-label">Qty</span>
            <input className="modify-input" type="number" defaultValue={order?.qty} />
          </div>
          <div className="modify-row">
            <span className="modify-label">Price</span>
            <input className="modify-input" type="number" step="0.05" defaultValue={order?.price || ''} />
          </div>
          <div className="modify-row">
            <span className="modify-label">Trigger Price</span>
            <input className="modify-input" type="number" step="0.05" defaultValue={order?.triggerPrice || ''} />
          </div>
          <div className="modify-row">
            <span className="modify-label">Order Type</span>
            <select className="modify-input" defaultValue={order?.orderType || 'LMT'}
              style={{ cursor: 'pointer' }}>
              <option>MKT</option><option>LMT</option><option>SL</option><option>SL-M</option>
            </select>
          </div>
        </div>
        <div className="modify-actions">
          <button className="btn btn-default" onClick={onCancel} style={{ height: 24, padding: '0 14px', fontSize: 10 }}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm} style={{ height: 24, padding: '0 14px', fontSize: 10 }}>Modify Order</button>
        </div>
      </div>
    </div>
  )
}
