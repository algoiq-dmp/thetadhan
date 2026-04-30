import { useState, useCallback } from 'react';
import useMarketStore from '../store/useMarketStore';

// ---- Default Macro Templates (15 Pre-built for Options) ----
const DEFAULT_MACROS = [
  {
    id: 'atm_straddle_short', name: 'ATM Straddle Short', hotkey: 'Ctrl+1', enabled: true, category: 'Straddle',
    symbols: ['NIFTY'], groupMode: false,
    legs: [
      { side: 'SELL', type: 'CE', strikeRef: 'ATM+0', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
      { side: 'SELL', type: 'PE', strikeRef: 'ATM+0', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
    ],
    bracket: { enabled: true, sl: 25, target: 50, trailing: true, trailPts: 10, breakeven: true, breakevenAfter: 15, partialExit: 50, partialAt: 20, timeExit: '15:15' },
  },
  {
    id: 'atm_straddle_long', name: 'ATM Straddle Long', hotkey: 'Ctrl+2', enabled: true, category: 'Straddle',
    symbols: ['NIFTY'], groupMode: false,
    legs: [
      { side: 'BUY', type: 'CE', strikeRef: 'ATM+0', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
      { side: 'BUY', type: 'PE', strikeRef: 'ATM+0', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
    ],
    bracket: { enabled: true, sl: 30, target: 60, trailing: false, trailPts: 0, breakeven: false, breakevenAfter: 0, partialExit: 0, partialAt: 0, timeExit: '' },
  },
  {
    id: 'strangle_02d', name: '0.2Δ Strangle Short', hotkey: 'Ctrl+3', enabled: true, category: 'Strangle',
    symbols: ['NIFTY'], groupMode: false,
    legs: [
      { side: 'SELL', type: 'CE', strikeRef: '0.2Δ', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
      { side: 'SELL', type: 'PE', strikeRef: '0.2Δ', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
    ],
    bracket: { enabled: true, sl: 30, target: 0, trailing: true, trailPts: 8, breakeven: true, breakevenAfter: 20, partialExit: 0, partialAt: 0, timeExit: '15:15' },
  },
  {
    id: 'strangle_03d', name: '0.3Δ Strangle Short', hotkey: '', enabled: true, category: 'Strangle',
    symbols: ['NIFTY'], groupMode: false,
    legs: [
      { side: 'SELL', type: 'CE', strikeRef: '0.3Δ', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
      { side: 'SELL', type: 'PE', strikeRef: '0.3Δ', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
    ],
    bracket: { enabled: true, sl: 25, target: 0, trailing: false, trailPts: 0, breakeven: false, breakevenAfter: 0, partialExit: 0, partialAt: 0, timeExit: '15:15' },
  },
  {
    id: 'group_strangle', name: 'Group 0.2Δ Strangle', hotkey: 'Ctrl+4', enabled: true, category: 'Group',
    symbols: ['NIFTY', 'BANKNIFTY', 'FINNIFTY'], groupMode: true,
    legs: [
      { side: 'SELL', type: 'CE', strikeRef: '0.2Δ', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
      { side: 'SELL', type: 'PE', strikeRef: '0.2Δ', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
    ],
    bracket: { enabled: true, sl: 25, target: 0, trailing: true, trailPts: 8, breakeven: true, breakevenAfter: 15, partialExit: 0, partialAt: 0, timeExit: '15:15' },
  },
  {
    id: 'iron_condor', name: 'Iron Condor', hotkey: 'Ctrl+5', enabled: true, category: 'Multi-Leg',
    symbols: ['NIFTY'], groupMode: false,
    legs: [
      { side: 'SELL', type: 'CE', strikeRef: 'ATM+3', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
      { side: 'BUY', type: 'CE', strikeRef: 'ATM+6', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
      { side: 'SELL', type: 'PE', strikeRef: 'ATM+3', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
      { side: 'BUY', type: 'PE', strikeRef: 'ATM+6', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
    ],
    bracket: { enabled: false, sl: 0, target: 0, trailing: false, trailPts: 0, breakeven: false, breakevenAfter: 0, partialExit: 0, partialAt: 0, timeExit: '' },
  },
  {
    id: 'iron_butterfly', name: 'Iron Butterfly', hotkey: 'Ctrl+6', enabled: true, category: 'Multi-Leg',
    symbols: ['NIFTY'], groupMode: false,
    legs: [
      { side: 'SELL', type: 'CE', strikeRef: 'ATM+0', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
      { side: 'SELL', type: 'PE', strikeRef: 'ATM+0', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
      { side: 'BUY', type: 'CE', strikeRef: 'ATM+5', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
      { side: 'BUY', type: 'PE', strikeRef: 'ATM+5', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
    ],
    bracket: { enabled: true, sl: 30, target: 0, trailing: false, trailPts: 0, breakeven: false, breakevenAfter: 0, partialExit: 0, partialAt: 0, timeExit: '15:10' },
  },
  {
    id: 'bull_call', name: 'Bull Call Spread', hotkey: 'Ctrl+7', enabled: true, category: 'Spread',
    symbols: ['NIFTY'], groupMode: false,
    legs: [
      { side: 'BUY', type: 'CE', strikeRef: 'ATM+0', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
      { side: 'SELL', type: 'CE', strikeRef: 'ATM+3', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
    ],
    bracket: { enabled: false, sl: 0, target: 0, trailing: false, trailPts: 0, breakeven: false, breakevenAfter: 0, partialExit: 0, partialAt: 0, timeExit: '' },
  },
  {
    id: 'bear_put', name: 'Bear Put Spread', hotkey: 'Ctrl+8', enabled: true, category: 'Spread',
    symbols: ['NIFTY'], groupMode: false,
    legs: [
      { side: 'BUY', type: 'PE', strikeRef: 'ATM+0', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
      { side: 'SELL', type: 'PE', strikeRef: 'ATM-3', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
    ],
    bracket: { enabled: false, sl: 0, target: 0, trailing: false, trailPts: 0, breakeven: false, breakevenAfter: 0, partialExit: 0, partialAt: 0, timeExit: '' },
  },
  {
    id: 'jade_lizard', name: 'Jade Lizard', hotkey: '', enabled: true, category: 'Multi-Leg',
    symbols: ['NIFTY'], groupMode: false,
    legs: [
      { side: 'SELL', type: 'PE', strikeRef: 'ATM+3', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
      { side: 'SELL', type: 'CE', strikeRef: 'ATM+3', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
      { side: 'BUY', type: 'CE', strikeRef: 'ATM+6', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
    ],
    bracket: { enabled: false, sl: 0, target: 0, trailing: false, trailPts: 0, breakeven: false, breakevenAfter: 0, partialExit: 0, partialAt: 0, timeExit: '' },
  },
  {
    id: 'ratio_spread', name: 'Ratio Spread 1:2', hotkey: '', enabled: true, category: 'Advanced',
    symbols: ['NIFTY'], groupMode: false,
    legs: [
      { side: 'BUY', type: 'CE', strikeRef: 'ATM+0', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
      { side: 'SELL', type: 'CE', strikeRef: 'ATM+3', qty: '2 Lots', orderType: 'MKT', product: 'MIS' },
    ],
    bracket: { enabled: true, sl: 40, target: 0, trailing: false, trailPts: 0, breakeven: false, breakevenAfter: 0, partialExit: 0, partialAt: 0, timeExit: '15:10' },
  },
  {
    id: 'calendar_spread', name: 'Calendar Spread', hotkey: '', enabled: true, category: 'Advanced',
    symbols: ['NIFTY'], groupMode: false,
    legs: [
      { side: 'SELL', type: 'CE', strikeRef: 'ATM+0', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
      { side: 'BUY', type: 'CE', strikeRef: 'ATM+0', qty: '1 Lot', orderType: 'MKT', product: 'NRML' },
    ],
    bracket: { enabled: false, sl: 0, target: 0, trailing: false, trailPts: 0, breakeven: false, breakevenAfter: 0, partialExit: 0, partialAt: 0, timeExit: '' },
  },
  {
    id: '0dte_scalp', name: '0-DTE Scalp', hotkey: 'Ctrl+9', enabled: true, category: 'Scalp',
    symbols: ['NIFTY'], groupMode: false,
    legs: [
      { side: 'BUY', type: 'CE', strikeRef: 'ATM+1', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
    ],
    bracket: { enabled: true, sl: 15, target: 25, trailing: true, trailPts: 5, breakeven: true, breakevenAfter: 10, partialExit: 50, partialAt: 15, timeExit: '15:20' },
  },
  {
    id: 'hedge_all', name: 'Hedge All Positions', hotkey: 'Ctrl+Shift+H', enabled: true, category: 'Risk',
    symbols: ['NIFTY', 'BANKNIFTY'], groupMode: true,
    legs: [
      { side: 'BUY', type: 'CE', strikeRef: '0.1Δ', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
      { side: 'BUY', type: 'PE', strikeRef: '0.1Δ', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
    ],
    bracket: { enabled: false, sl: 0, target: 0, trailing: false, trailPts: 0, breakeven: false, breakevenAfter: 0, partialExit: 0, partialAt: 0, timeExit: '' },
  },
  {
    id: 'exit_all', name: 'EXIT ALL PANIC', hotkey: 'Ctrl+Shift+X', enabled: true, category: 'Risk',
    symbols: ['NIFTY', 'BANKNIFTY', 'FINNIFTY'], groupMode: true,
    legs: [
      { side: 'SELL', type: 'CE', strikeRef: 'ATM+0', qty: '1 Lot', orderType: 'MKT', product: 'MIS' },
    ],
    bracket: { enabled: false, sl: 0, target: 0, trailing: false, trailPts: 0, breakeven: false, breakevenAfter: 0, partialExit: 0, partialAt: 0, timeExit: '' },
  },
];

const STRIKE_REFS = ['ATM+0','ATM+1','ATM+2','ATM+3','ATM+4','ATM+5','ATM+6','ATM+7','ATM+8','ATM+9','ATM+10','ATM-1','ATM-2','ATM-3','0.1Δ','0.2Δ','0.3Δ','0.4Δ','0.5Δ','MaxPain'];
const QTY_REFS = ['1 Lot','2 Lots','3 Lots','5 Lots','10 Lots','Custom'];
const ORDER_TYPES = ['MKT','LMT','SL','SL-M'];
const PRODUCTS = ['MIS','NRML'];
const ALL_SYMBOLS = ['NIFTY','BANKNIFTY','FINNIFTY','MIDCPNIFTY','RELIANCE','TCS','HDFCBANK','INFY','SBIN','ICICIBANK','KOTAKBANK','AXISBANK','TATAMOTORS','HDFC','ITC'];

export default function QuickFireMacroPanel() {
  const [macros, setMacros] = useState(DEFAULT_MACROS);
  const [editId, setEditId] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [fired, setFired] = useState(null);
  const universe = useMarketStore(s => s.universe);

  // Resolve strike for preview
  const resolveStrike = useCallback((symbol, legType, strikeRef) => {
    const row = universe.find(r => r.symbol === symbol) || { ltp: 24250 };
    const atm = Math.round(row.ltp / 50) * 50;
    const step = symbol === 'BANKNIFTY' ? 100 : symbol.includes('NIFTY') ? 50 : 50;
    if (strikeRef.startsWith('ATM')) {
      const offset = parseInt(strikeRef.replace('ATM', '')) || 0;
      if (legType === 'CE') return atm + offset * step;
      return atm - offset * step;
    }
    if (strikeRef.includes('Δ')) {
      const delta = parseFloat(strikeRef) || 0.2;
      const dist = Math.round((1 - delta) * 10);
      if (legType === 'CE') return atm + dist * step;
      return atm - dist * step;
    }
    return atm;
  }, [universe]);

  const getLotSize = (sym) => {
    const row = universe.find(r => r.symbol === sym);
    return row?.lotSize || (sym === 'NIFTY' ? 75 : sym === 'BANKNIFTY' ? 30 : 50);
  };

  const fireMacro = (macro) => {
    setFired(macro.id);
    setTimeout(() => setFired(null), 2000);
    // In production: iterate symbols × legs → build orders → send to Vega
    console.log('🔥 FIRING MACRO:', macro.name, macro);
  };

  const editMacro = editId ? macros.find(m => m.id === editId) : null;

  const updateMacro = (field, value) => {
    setMacros(prev => prev.map(m => m.id === editId ? { ...m, [field]: value } : m));
  };

  const updateLeg = (legIdx, field, value) => {
    setMacros(prev => prev.map(m => {
      if (m.id !== editId) return m;
      const legs = [...m.legs];
      legs[legIdx] = { ...legs[legIdx], [field]: value };
      return { ...m, legs };
    }));
  };

  const addLeg = () => {
    setMacros(prev => prev.map(m => {
      if (m.id !== editId) return m;
      return { ...m, legs: [...m.legs, { side: 'BUY', type: 'CE', strikeRef: 'ATM+0', qty: '1 Lot', orderType: 'MKT', product: 'MIS' }] };
    }));
  };

  const removeLeg = (idx) => {
    setMacros(prev => prev.map(m => {
      if (m.id !== editId || m.legs.length <= 1) return m;
      return { ...m, legs: m.legs.filter((_, i) => i !== idx) };
    }));
  };

  const addNewMacro = () => {
    const id = 'macro_' + Date.now();
    const newMacro = {
      id, name: 'New Macro', hotkey: '', enabled: true,
      symbols: ['NIFTY'], groupMode: false,
      legs: [{ side: 'BUY', type: 'CE', strikeRef: 'ATM+0', qty: '1 Lot', orderType: 'MKT', product: 'MIS' }],
      bracket: { enabled: false, sl: 0, target: 0, trailing: false, trailPts: 0 },
    };
    setMacros(prev => [...prev, newMacro]);
    setEditId(id);
  };

  const deleteMacro = (id) => {
    setMacros(prev => prev.filter(m => m.id !== id));
    if (editId === id) setEditId(null);
  };

  const sel = (v, opts, onChange) => (
    <select value={v} onChange={e => onChange(e.target.value)} style={selStyle}>{opts.map(o => <option key={o} value={o}>{o}</option>)}</select>
  );

  return (
    <div style={{ padding: 8, fontSize: 11, color: '#e2e8f0' }}>
      {/* Fire Mode — Quick Launch Buttons */}
      {!editId && (
        <>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', marginBottom: 6 }}>⚡ QUICK FIRE MACROS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
            {macros.filter(m => m.enabled).map(m => {
              const isFired = fired === m.id;
              return (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6,
                  background: isFired ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isFired ? 'rgba(16,185,129,0.3)' : '#1e2a3a'}`,
                  transition: 'all 0.3s',
                }}>
                  <button onClick={() => fireMacro(m)} style={{
                    width: 28, height: 28, borderRadius: 6, border: 'none', fontSize: 12, cursor: 'pointer',
                    background: m.legs.some(l => l.side === 'SELL') ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff', fontWeight: 800,
                  }}>🔥</button>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: isFired ? '#10b981' : '#f8fafc' }}>
                      {m.name} {isFired && '✓ FIRED'}
                    </div>
                    <div style={{ fontSize: 8, color: '#475569' }}>
                      {m.symbols.join(', ')} • {m.legs.length} leg{m.legs.length > 1 ? 's' : ''} •
                      {m.legs.map(l => `${l.side} ${l.type} ${l.strikeRef}`).join(' + ')}
                      {m.bracket.enabled && ` | SL:${m.bracket.sl} TGT:${m.bracket.target}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {m.hotkey && <kbd style={kbdStyle}>{m.hotkey}</kbd>}
                    <button onClick={() => setEditId(m.id)} style={{ ...iconBtnStyle, fontSize: 8 }}>✏️</button>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={addNewMacro} style={{
            width: '100%', height: 30, borderRadius: 6, border: '1px dashed #2d3a4a',
            background: 'transparent', color: '#475569', fontSize: 10, fontWeight: 600, cursor: 'pointer',
          }}>+ Create New Macro</button>

          {/* Preview Legend */}
          <div style={{ marginTop: 8, padding: '6px 8px', borderRadius: 4, background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)', fontSize: 8, color: '#8b5cf6' }}>
            💡 Strike Refs: ATM+0 = At-the-Money, ATM+5 = 5 OTM, 0.2Δ = 0.2 delta auto-pick
          </div>
        </>
      )}

      {/* Edit Mode — Macro Builder */}
      {editId && editMacro && (
        <div>
          <button onClick={() => setEditId(null)} style={{ ...iconBtnStyle, marginBottom: 6, fontSize: 9 }}>← Back to Macros</button>

          {/* Name & Hotkey */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            <input value={editMacro.name} onChange={e => updateMacro('name', e.target.value)}
              style={{ ...inputStyle, flex: 2 }} placeholder="Macro Name" />
            <input value={editMacro.hotkey} onChange={e => updateMacro('hotkey', e.target.value)}
              style={{ ...inputStyle, flex: 1 }} placeholder="Hotkey" />
          </div>

          {/* Symbols */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 8, fontWeight: 600, color: '#64748b', marginBottom: 3 }}>SYMBOLS (multi-select for group mode)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {ALL_SYMBOLS.map(s => {
                const active = editMacro.symbols.includes(s);
                return (
                  <button key={s} onClick={() => {
                    const syms = active ? editMacro.symbols.filter(x => x !== s) : [...editMacro.symbols, s];
                    updateMacro('symbols', syms.length ? syms : [s]);
                    updateMacro('groupMode', syms.length > 1);
                  }} style={{
                    padding: '2px 6px', borderRadius: 3, border: 'none', fontSize: 8, cursor: 'pointer',
                    background: active ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)',
                    color: active ? '#06b6d4' : '#475569', fontWeight: active ? 700 : 400,
                  }}>{s}</button>
                );
              })}
            </div>
            {editMacro.groupMode && (
              <div style={{ fontSize: 8, color: '#f59e0b', marginTop: 2 }}>⚡ Group mode: macro fires on all {editMacro.symbols.length} symbols simultaneously</div>
            )}
          </div>

          {/* Legs */}
          <div style={{ fontSize: 8, fontWeight: 600, color: '#64748b', marginBottom: 3 }}>LEGS</div>
          {editMacro.legs.map((leg, i) => (
            <div key={i} style={{
              padding: '6px 8px', borderRadius: 6, marginBottom: 4,
              background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2a3a',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 8, color: '#64748b', fontWeight: 600 }}>LEG {i + 1}</span>
                {editMacro.legs.length > 1 && (
                  <button onClick={() => removeLeg(i)} style={{ ...iconBtnStyle, fontSize: 8, color: '#ef4444' }}>✕</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
                {sel(leg.side, ['BUY', 'SELL'], v => updateLeg(i, 'side', v))}
                {sel(leg.type, ['CE', 'PE'], v => updateLeg(i, 'type', v))}
                {sel(leg.strikeRef, STRIKE_REFS, v => updateLeg(i, 'strikeRef', v))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, marginTop: 3 }}>
                {sel(leg.qty, QTY_REFS, v => updateLeg(i, 'qty', v))}
                {sel(leg.orderType, ORDER_TYPES, v => updateLeg(i, 'orderType', v))}
                {sel(leg.product, PRODUCTS, v => updateLeg(i, 'product', v))}
              </div>
              {/* Live preview */}
              <div style={{ fontSize: 8, color: '#475569', marginTop: 3 }}>
                Preview: {editMacro.symbols.map(s => {
                  const strike = resolveStrike(s, leg.type, leg.strikeRef);
                  const lots = parseInt(leg.qty) || 1;
                  return `${leg.side} ${s} ${strike} ${leg.type} × ${lots * getLotSize(s)}`;
                }).join(' | ')}
              </div>
            </div>
          ))}
          <button onClick={addLeg} style={{
            width: '100%', height: 24, borderRadius: 4, border: '1px dashed #2d3a4a',
            background: 'transparent', color: '#06b6d4', fontSize: 9, cursor: 'pointer', marginBottom: 6,
          }}>+ Add Leg</button>

          {/* Bracket (SL/Target) */}
          <div style={{
            padding: '8px', borderRadius: 6, marginBottom: 6,
            background: editMacro.bracket.enabled ? 'rgba(245,158,11,0.04)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${editMacro.bracket.enabled ? 'rgba(245,158,11,0.15)' : '#1e2a3a'}`,
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: editMacro.bracket.enabled ? 6 : 0 }}>
              <input type="checkbox" checked={editMacro.bracket.enabled}
                onChange={e => updateMacro('bracket', { ...editMacro.bracket, enabled: e.target.checked })} />
              <span style={{ fontSize: 9, fontWeight: 600, color: '#f59e0b' }}>📌 Bracket Order (SL + Target)</span>
            </label>
            {editMacro.bracket.enabled && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <div>
                  <div style={{ fontSize: 8, color: '#ef4444', fontWeight: 600, marginBottom: 2 }}>Stop Loss (pts)</div>
                  <input type="number" value={editMacro.bracket.sl}
                    onChange={e => updateMacro('bracket', { ...editMacro.bracket, sl: +e.target.value })}
                    style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: 8, color: '#10b981', fontWeight: 600, marginBottom: 2 }}>Target (pts)</div>
                  <input type="number" value={editMacro.bracket.target}
                    onChange={e => updateMacro('bracket', { ...editMacro.bracket, target: +e.target.value })}
                    style={inputStyle} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, gridColumn: '1/3' }}>
                  <input type="checkbox" checked={editMacro.bracket.trailing}
                    onChange={e => updateMacro('bracket', { ...editMacro.bracket, trailing: e.target.checked })} />
                  <span style={{ fontSize: 8, color: '#94a3b8' }}>Trailing SL</span>
                  {editMacro.bracket.trailing && (
                    <input type="number" value={editMacro.bracket.trailPts}
                      onChange={e => updateMacro('bracket', { ...editMacro.bracket, trailPts: +e.target.value })}
                      style={{ ...inputStyle, width: 50 }} placeholder="pts" />
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => fireMacro(editMacro)} style={{
              flex: 2, height: 32, borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 800,
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', cursor: 'pointer',
            }}>🔥 FIRE NOW</button>
            <button onClick={() => deleteMacro(editId)} style={{
              flex: 1, height: 32, borderRadius: 6, border: '1px solid #ef4444',
              background: 'transparent', color: '#ef4444', fontSize: 10, cursor: 'pointer',
            }}>🗑 Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

const selStyle = {
  background: '#0a0e17', border: '1px solid #1e2a3a', borderRadius: 4,
  color: '#e2e8f0', fontSize: 9, padding: '3px 4px', fontFamily: 'inherit', width: '100%',
};
const inputStyle = {
  background: '#0a0e17', border: '1px solid #1e2a3a', borderRadius: 4,
  color: '#e2e8f0', fontSize: 10, padding: '4px 6px', fontFamily: 'inherit', width: '100%',
};
const iconBtnStyle = {
  background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px 4px',
};
const kbdStyle = {
  padding: '1px 4px', borderRadius: 3, background: '#1e2a3a', color: '#f59e0b',
  fontSize: 7, fontFamily: 'JetBrains Mono', border: '1px solid #2d3a4a',
};
