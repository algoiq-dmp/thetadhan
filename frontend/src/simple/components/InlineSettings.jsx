import { useState } from 'react'

// Reusable inline settings panel for per-screen configuration
export default function InlineSettings({ show, onClose, title, children }) {
  if (!show) return null
  return (
    <div style={{
      padding: '6px 10px', background: 'linear-gradient(180deg, rgba(0,188,212,0.06), rgba(0,0,0,0.1))',
      borderBottom: '1px solid rgba(0,188,212,0.2)', fontSize: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, letterSpacing: 0.5 }}>⚙ {title}</span>
        <button onClick={onClose} style={{
          marginLeft: 'auto', width: 18, height: 16, background: '#2a2a44', color: '#d0d0d8',
          border: '1px solid #3a3a5a', fontSize: 9, cursor: 'pointer', lineHeight: 1
        }}>✕</button>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {children}
      </div>
    </div>
  )
}

// Reusable field components for inline settings
export const SField = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <span style={{ fontSize: 9, color: '#7a7a8c', whiteSpace: 'nowrap' }}>{label}:</span>
    {children}
  </div>
)

export const SSel = ({ value, options, onChange }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{
    height: 18, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8',
    padding: '0 4px', fontSize: 9, fontFamily: 'var(--grid-font)'
  }}>
    {options.map(o => <option key={o}>{o}</option>)}
  </select>
)

export const SChk = ({ checked, label, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#d0d0d8', cursor: 'pointer' }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: '#00bcd4', width: 11, height: 11 }} />{label}
  </label>
)

export const GearBtn = ({ onClick }) => (
  <button onClick={onClick} title="Screen Settings" style={{
    width: 20, height: 18, background: 'transparent', border: '1px solid #3a3a5a', color: '#7a7a8c',
    fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>⚙</button>
)
