import React, { useState } from 'react'
import { MOCK_ORDERS } from '../mock/data'
import InlineSettings, { SField, SSel, SChk, GearBtn } from '../components/InlineSettings'
import ContextMenu from '../components/ContextMenu'
import { ConfirmDialog, ModifyOrderDialog } from '../components/ContextMenu'
import { exportGridCSV, sortGridData, filterGridData, SortTh } from '../utils/gridUtils'
import ActionIcon, { ActionIconRow } from '../components/ActionIcons'

const FILTERS = ['ALL', 'OPEN', 'EXEC', 'REJ', 'CANCELLED']

export default function OrderBook() {
  const [filter, setFilter] = useState('ALL')
  const baseFiltered = filter === 'ALL' ? MOCK_ORDERS : MOCK_ORDERS.filter(o => o.status === filter)
  const [sortKey, setSortKey] = useState(null)
  const [sortAsc, setSortAsc] = useState(true)
  const [qFilter, setQFilter] = useState('')
  const onSort = (k) => { if (sortKey === k) setSortAsc(!sortAsc); else { setSortKey(k); setSortAsc(true) } }
  let filtered = filterGridData(baseFiltered, qFilter, ['symbol','exchange','side','product','status','orderNo'])
  filtered = sortGridData(filtered, sortKey, sortAsc)
  const [showSettings, setShowSettings] = useState(false)
  const [ctxMenu, setCtxMenu] = useState(null)
  const [modifyOrder, setModifyOrder] = useState(null)
  const [confirmCancel, setConfirmCancel] = useState(null) // null | 'all' | order
  const [expandedOrder, setExpandedOrder] = useState(null) // order number
  const [obSettings, setObSettings] = useState({
    autoRefresh: true, refreshInterval: '3s', defaultFilter: 'ALL', confirmCancel: true, showHistory: false, highlightNew: true
  })
  const setOb = (k, v) => setObSettings(p => ({ ...p, [k]: v }))

  const counts = {
    ALL: MOCK_ORDERS.length,
    OPEN: MOCK_ORDERS.filter(o => o.status === 'OPEN').length,
    EXEC: MOCK_ORDERS.filter(o => o.status === 'EXEC').length,
    REJ: MOCK_ORDERS.filter(o => o.status === 'REJ').length,
    CANCELLED: MOCK_ORDERS.filter(o => o.status === 'CANCELLED').length,
  }

  const handleContextMenu = (e, order) => {
    e.preventDefault()
    const items = []
    if (order.status === 'OPEN') {
      items.push({ label: 'Modify Order', icon: '✏️', shortcut: 'Shift+F2', action: () => setModifyOrder(order) })
      items.push({ label: 'Cancel Order', icon: '✕', shortcut: 'Shift+F1', danger: true, action: () => setConfirmCancel(order) })
      items.push('—')
    }
    items.push({ label: 'View Order History', icon: '📋', action: () => setExpandedOrder(expandedOrder === order.orderNo ? null : order.orderNo) })
    items.push({ label: 'Copy Order Details', icon: '📄', action: () => navigator.clipboard.writeText(`${order.side} ${order.symbol} ${order.qty}@${order.price} [${order.status}] #${order.orderNo}`) })
    setCtxMenu({ x: e.clientX, y: e.clientY, items })
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Filter Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '3px 6px',
        background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', fontSize: 10
      }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '2px 8px', fontSize: 9, border: '1px solid var(--border)', cursor: 'pointer',
            background: filter === f ? 'var(--bg-row-selected)' : 'transparent',
            color: filter === f ? 'var(--accent)' : 'var(--text-secondary)',
          }}>{f} ({counts[f]})</button>
        ))}
        <ActionIcon type="cancel" tooltip="Cancel All Open" shortcut="Shift+F3" onClick={() => setConfirmCancel('all')} />
        <input value={qFilter} onChange={e => setQFilter(e.target.value)} placeholder="Filter..." style={{ height: 18, width: 100, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8', padding: '0 6px', fontSize: 9, outline: 'none' }} />
        <ActionIcon type="csv" tooltip="Export CSV" onClick={() => exportGridCSV(filtered, [{key:'time',label:'Time'},{key:'symbol',label:'Symbol'},{key:'exchange',label:'Exch'},{key:'side',label:'B/S'},{key:'product',label:'Product'},{key:'orderType',label:'Type'},{key:'qty',label:'Qty'},{key:'filled',label:'Filled'},{key:'price',label:'Price'},{key:'status',label:'Status'},{key:'orderNo',label:'OrderNo'}], 'OrderBook')} />
        <GearBtn onClick={() => setShowSettings(s => !s)} />
      </div>

      {/* OB Settings */}
      <InlineSettings show={showSettings} onClose={() => setShowSettings(false)} title="Order Book Settings">
        <SChk checked={obSettings.autoRefresh} label="Auto-refresh" onChange={v => setOb('autoRefresh', v)} />
        <SField label="Refresh"><SSel value={obSettings.refreshInterval} options={['1s','3s','5s','10s']} onChange={v => setOb('refreshInterval', v)} /></SField>
        <SField label="Default Filter"><SSel value={obSettings.defaultFilter} options={['ALL','OPEN','EXEC']} onChange={v => setOb('defaultFilter', v)} /></SField>
        <SChk checked={obSettings.confirmCancel} label="Confirm Cancel" onChange={v => setOb('confirmCancel', v)} />
        <SChk checked={obSettings.showHistory} label="Show History" onChange={v => setOb('showHistory', v)} />
        <SChk checked={obSettings.highlightNew} label="Highlight New" onChange={v => setOb('highlightNew', v)} />
      </InlineSettings>

      {/* Grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--grid-font)', fontSize: 10 }}>
          <thead>
            <tr>
              {[{k:'time',l:'Time'},{k:'symbol',l:'Symbol',a:'left'},{k:'exchange',l:'Exch'},{k:'side',l:'B/S'},{k:'product',l:'Product'},{k:'orderType',l:'Ord Type'},{k:'qty',l:'Qty'},{k:'filled',l:'Filled'},{k:'pending',l:'Pending'},{k:'price',l:'Price'},{k:'triggerPrice',l:'Trigger'},{k:'avgPrice',l:'Avg Price'},{k:'status',l:'Status'},{k:'orderNo',l:'Order No'},{k:'remarks',l:'Remarks',a:'left'},{k:'actions',l:'Actions'}].map(c => (
                <SortTh key={c.k} colKey={c.k} label={c.l} sortKey={sortKey} sortAsc={sortAsc} onSort={onSort} align={c.a} />
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, i) => {
              const statusColor = o.status === 'EXEC' ? '#22c55e' : o.status === 'OPEN' ? '#4dabf7' : o.status === 'REJ' ? '#ef4444' : '#eab308'
              return (<React.Fragment key={i}>
                <tr style={{ borderBottom: '1px solid rgba(42,42,68,0.3)' }}
                  onContextMenu={(e) => handleContextMenu(e, o)}>
                  <td style={tdR}>{o.time}</td>
                  <td style={{ ...tdR, textAlign: 'left', fontWeight: 600, color: 'var(--text-bright)' }}>{o.symbol}</td>
                  <td style={tdR}>{o.exchange}</td>
                  <td style={{ ...tdR, fontWeight: 700, color: o.side === 'BUY' ? '#4dabf7' : '#ff6b6b' }}>{o.side}</td>
                  <td style={tdR}>{o.product}</td>
                  <td style={tdR}>{o.orderType}</td>
                  <td style={{ ...tdR, fontWeight: 600 }}>{o.qty}</td>
                  <td style={{ ...tdR, color: o.filled > 0 ? '#22c55e' : '#5a5a6a' }}>{o.filled}</td>
                  <td style={{ ...tdR, color: o.pending > 0 ? '#eab308' : '#5a5a6a' }}>{o.pending}</td>
                  <td style={tdR}>{o.price === 'MKT' ? 'MKT' : typeof o.price === 'number' ? o.price.toFixed(2) : o.price}</td>
                  <td style={{ ...tdR, color: '#5a5a6a' }}>{o.triggerPrice || '—'}</td>
                  <td style={tdR}>{o.avgPrice > 0 ? o.avgPrice.toFixed(2) : '—'}</td>
                  <td style={{ ...tdR, fontWeight: 600, color: statusColor }}>{o.status}</td>
                  <td style={{ ...tdR, fontSize: 9, color: '#7a7a8c' }}>{o.orderNo}</td>
                  <td style={{ ...tdR, textAlign: 'left', fontSize: 9, color: '#ef4444' }}>{o.remarks}</td>
                  <td style={{ textAlign: 'center', padding: '2px 4px' }}>
                    {o.status === 'OPEN' && (
                      <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                        <ActionIconRow type="modify" tooltip="Modify" shortcut="Shift+F2" onClick={() => setModifyOrder(o)} />
                        <ActionIconRow type="cancel" tooltip="Cancel" shortcut="Shift+F1" onClick={() => setConfirmCancel(o)} />
                      </div>
                    )}
                  </td>
                </tr>
                {expandedOrder === o.orderNo && (
                  <tr><td colSpan={16} style={{ padding: '4px 20px', background: 'rgba(0,188,212,0.04)', borderBottom: '2px solid var(--accent)' }}>
                    <div style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 600, marginBottom: 3 }}>⏳ Order Audit Trail — #{o.orderNo}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 9, color: '#9aa0b0', flexWrap: 'wrap' }}>
                      {[
                        { time: o.time, event: 'Order Placed', detail: `${o.side} ${o.symbol} ${o.qty}@${o.price === 'MKT' ? 'MARKET' : o.price}` },
                        o.status === 'OPEN' && { time: o.time, event: 'Validation OK', detail: 'Pre-trade risk check passed' },
                        o.status === 'EXEC' && { time: o.time, event: 'Partially Filled', detail: `${o.filled} qty @ ${o.avgPrice}` },
                        o.status === 'EXEC' && { time: o.time, event: 'Fully Executed', detail: `Avg Price: ${o.avgPrice}` },
                        o.status === 'REJ' && { time: o.time, event: 'Rejected', detail: o.remarks || 'Insufficient margin' },
                        o.status === 'CANCELLED' && { time: o.time, event: 'Cancelled', detail: 'User initiated cancellation' },
                      ].filter(Boolean).map((h, hi) => (
                        <div key={hi} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: hi === 0 ? '#4dabf7' : hi === 1 ? '#22c55e' : '#eab308', flexShrink: 0 }} />
                          <span style={{ color: '#5a5a6a' }}>{h.time}</span>
                          <span style={{ fontWeight: 600, color: '#d0d0d8' }}>{h.event}</span>
                          <span style={{ color: '#7a7a8c' }}>— {h.detail}</span>
                        </div>
                      ))}
                    </div>
                  </td></tr>
                )}
              </React.Fragment>)
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px',
        background: 'rgba(0,0,0,0.15)', borderTop: '1px solid var(--border)', fontSize: 9
      }}>
        <span style={{ color: '#7a7a8c' }}>Total: <b style={{ color: '#d0d0d8' }}>{MOCK_ORDERS.length}</b></span>
        <span style={{ color: '#7a7a8c' }}>Executed: <b style={{ color: '#22c55e' }}>{counts.EXEC}</b></span>
        <span style={{ color: '#7a7a8c' }}>Open: <b style={{ color: '#4dabf7' }}>{counts.OPEN}</b></span>
        <span style={{ color: '#7a7a8c' }}>Rejected: <b style={{ color: '#ef4444' }}>{counts.REJ}</b></span>
        <span style={{ color: '#7a7a8c' }}>Cancelled: <b style={{ color: '#eab308' }}>{counts.CANCELLED}</b></span>
        <span style={{ marginLeft: 'auto', color: '#5a5a6a' }}>✕ Shift+F1=Cancel │ ✏ Shift+F2=Modify │ ✕ Shift+F3=Cancel All</span>
      </div>

      {/* Context Menu */}
      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={() => setCtxMenu(null)} />}

      {/* Modify Order Dialog */}
      {modifyOrder && (
        <ModifyOrderDialog
          order={modifyOrder}
          onConfirm={() => setModifyOrder(null)}
          onCancel={() => setModifyOrder(null)}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      {confirmCancel && (
        <ConfirmDialog
          title={confirmCancel === 'all' ? 'Cancel All Open Orders' : `Cancel Order — ${confirmCancel.symbol}`}
          message={confirmCancel === 'all'
            ? `Are you sure you want to cancel ALL ${counts.OPEN} open orders? This action cannot be undone.`
            : `Cancel order: ${confirmCancel.side} ${confirmCancel.symbol} ${confirmCancel.qty}@${confirmCancel.price}?\nOrder No: ${confirmCancel.orderNo}`}
          confirmLabel={confirmCancel === 'all' ? 'Cancel All' : 'Cancel Order'}
          danger={true}
          onConfirm={() => setConfirmCancel(null)}
          onCancel={() => setConfirmCancel(null)}
        />
      )}
    </div>
  )
}

const tdR = { textAlign: 'right', padding: '2px 6px', height: 22, color: '#d0d0d8' }
const btnS = (bg) => ({ padding: '1px 5px', fontSize: 8, background: bg, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 })
