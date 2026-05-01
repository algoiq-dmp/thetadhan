/**
 * ActionIcons — Standardized SVG Icon Buttons with Hover Tooltips
 * Used across all Light-Z terminal screens to replace text-based action buttons.
 * Matches the ToolbarButton pattern from App.jsx for visual consistency.
 */
import { useState } from 'react'

/* ── Base SVG wrapper ── */
const Ic = ({ children, size = 14, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {children}
  </svg>
)

/* ── Icon Library ── */
const ICON_SVG = {
  add:        <Ic><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></Ic>,
  remove:     <Ic><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></Ic>,
  edit:       <Ic><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z"/></Ic>,
  export:     <Ic><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></Ic>,
  import:     <Ic><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></Ic>,
  columns:    <Ic><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></Ic>,
  cancel:     <Ic><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></Ic>,
  modify:     <Ic><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></Ic>,
  squareOff:  <Ic><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9l6 6M15 9l-6 6"/></Ic>,
  convert:    <Ic><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></Ic>,
  refresh:    <Ic><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></Ic>,
  save:       <Ic><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></Ic>,
  filter:     <Ic><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></Ic>,
  close:      <Ic><path d="M18 6L6 18M6 6l12 12"/></Ic>,
  search:     <Ic><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></Ic>,
  reset:      <Ic><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1014.85-3.36L23 10"/><path d="M1 10l4.64-4.36"/></Ic>,
  submit:     <Ic><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></Ic>,
  addPos:     <Ic><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></Ic>,
  csv:        <Ic><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 15l2 2 4-4"/></Ic>,
  profile:    <Ic><path d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></Ic>,
  clear:      <Ic><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></Ic>,
  selectAll:  <Ic><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></Ic>,
  deselectAll:<Ic><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6"/></Ic>,
  cancelAll:  <Ic><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></Ic>,
  killSwitch: <Ic><path d="M18.36 6.64A9 9 0 0120.77 12M5.64 17.36A9 9 0 013.23 12"/><path d="M12 2v10"/><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></Ic>,
  chart:      <Ic><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-10"/></Ic>,
  contractInfo:<Ic><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></Ic>,
}

/* ── Color presets by action category ── */
const PRESETS = {
  add:        { bg: '#22c55e20', color: '#22c55e', border: '#22c55e40' },
  remove:     { bg: '#ef444420', color: '#ef4444', border: '#ef444440' },
  edit:       { bg: '#eab30820', color: '#eab308', border: '#eab30840' },
  export:     { bg: '#2a2a44', color: '#9aa0b0', border: '#3a3a5a' },
  import:     { bg: '#2a2a44', color: '#9aa0b0', border: '#3a3a5a' },
  columns:    { bg: '#2a2a44', color: '#d0d0d8', border: '#3a3a5a' },
  cancel:     { bg: '#C6282820', color: '#C62828', border: '#C6282840' },
  modify:     { bg: '#4dabf720', color: '#4dabf7', border: '#4dabf740' },
  squareOff:  { bg: '#C62828', color: '#fff', border: '#C62828' },
  convert:    { bg: '#4dabf7', color: '#000', border: '#4dabf7' },
  refresh:    { bg: '#2a2a44', color: '#d0d0d8', border: '#3a3a5a' },
  save:       { bg: '#22c55e', color: '#000', border: '#22c55e' },
  filter:     { bg: '#2a2a44', color: '#9aa0b0', border: '#3a3a5a' },
  close:      { bg: '#C62828', color: '#fff', border: '#C62828' },
  search:     { bg: '#2a2a44', color: '#d0d0d8', border: '#3a3a5a' },
  reset:      { bg: '#2a2a44', color: '#d0d0d8', border: '#3a3a5a' },
  submit:     { bg: '#22c55e', color: '#000', border: '#22c55e' },
  addPos:     { bg: '#1565C0', color: '#fff', border: '#1565C0' },
  csv:        { bg: 'var(--accent, #00bcd4)', color: '#000', border: 'var(--accent, #00bcd4)' },
  profile:    { bg: '#2a2a44', color: '#d0d0d8', border: '#3a3a5a' },
  clear:      { bg: '#C6282820', color: '#C62828', border: '#C6282840' },
  selectAll:  { bg: 'var(--accent, #00bcd4)', color: '#000', border: 'var(--accent, #00bcd4)' },
  deselectAll:{ bg: '#2a2a44', color: '#d0d0d8', border: '#3a3a5a' },
  cancelAll:  { bg: '#fbbf24', color: '#000', border: '#f59e0b' },
  killSwitch: { bg: '#dc2626', color: '#fff', border: '#b91c1c' },
  chart:      { bg: 'transparent', color: '#7a7a8c', border: 'transparent' },
  contractInfo:{ bg: 'transparent', color: '#7a7a8c', border: 'transparent' },
}

/**
 * ActionIcon — Standardized icon button with hover tooltip
 * @param {string} type — Icon key from ICON_SVG
 * @param {string} tooltip — Label shown on hover (e.g. "Export CSV")
 * @param {string} shortcut — Keyboard shortcut shown below label
 * @param {function} onClick — Click handler
 * @param {string} badge — Optional badge text (e.g. column count)
 * @param {boolean} compact — If true, use smaller sizing for inline/row actions
 * @param {object} style — Additional style overrides
 * @param {boolean} disabled — Disabled state
 * @param {boolean} solid — If true, use solid background (for primary actions)
 */
export default function ActionIcon({ type, tooltip, shortcut, onClick, badge, compact, style, disabled, solid }) {
  const [hover, setHover] = useState(false)
  const preset = PRESETS[type] || PRESETS.export
  const icon = ICON_SVG[type]

  const isSolid = solid || ['squareOff', 'convert', 'save', 'close', 'submit', 'addPos', 'csv', 'selectAll', 'cancelAll', 'killSwitch'].includes(type)

  const btnStyle = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 3,
    height: compact ? 18 : 20,
    minWidth: compact ? 18 : 22,
    padding: badge ? '0 6px 0 4px' : (compact ? '0 3px' : '0 4px'),
    background: isSolid ? preset.bg : preset.bg,
    color: preset.color,
    border: `1px solid ${preset.border}`,
    fontSize: 8, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : (hover ? 1 : 0.85),
    transition: 'all 0.15s ease',
    transform: hover && !disabled ? 'scale(1.08)' : 'scale(1)',
    position: 'relative',
    lineHeight: 1,
    ...style,
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        style={btnStyle}
        onClick={disabled ? undefined : onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        title={tooltip ? `${tooltip}${shortcut ? ` (${shortcut})` : ''}` : undefined}
      >
        {icon}
        {badge && <span style={{ fontSize: 8, fontWeight: 700, lineHeight: 1 }}>{badge}</span>}
      </button>
      {hover && tooltip && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          marginBottom: 4, padding: '4px 8px', background: '#1a1a2e', border: '1px solid #3a3a5a',
          borderRadius: 3, whiteSpace: 'nowrap', zIndex: 9999, pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontWeight: 600, fontSize: 10, color: '#fff' }}>{tooltip}</div>
          {shortcut && <div style={{ fontSize: 9, color: 'var(--accent, #00bcd4)', marginTop: 1 }}>{shortcut}</div>}
        </div>
      )}
    </div>
  )
}

/**
 * ActionIconRow — Compact inline icon for table row actions
 * Same as ActionIcon but with compact=true preset
 */
export function ActionIconRow(props) {
  return <ActionIcon compact {...props} />
}
