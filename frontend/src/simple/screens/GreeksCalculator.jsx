import { useState } from 'react'

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
    <span style={{ width: 110, fontSize: 10, color: '#9aa0b0', textAlign: 'right', paddingRight: 10 }}>{label}</span>
    {children}
  </div>
)

const Input = ({ value, onChange, width = 100 }) => (
  <input style={{ height: 22, width, background: '#0a0a1a', border: '1px solid #2a2a44', color: '#d0d0d8', padding: '0 6px', fontSize: 11, fontFamily: 'var(--grid-font)', outline: 'none' }}
    value={value} onChange={e => onChange(e.target.value)} />
)

const Result = ({ label, value, color = '#d0d0d8' }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid rgba(42,42,68,0.3)' }}>
    <span style={{ fontSize: 10, color: '#7a7a8c' }}>{label}</span>
    <span style={{ fontSize: 11, fontWeight: 600, color, fontFamily: 'var(--grid-font)' }}>{value}</span>
  </div>
)

export default function GreeksCalculator() {
  const [tab, setTab] = useState('iv')
  const [ivInputs, setIv] = useState({ spot: '24250', strike: '24200', premium: '142', expiry: '7', rate: '7', type: 'CE' })
  const [pivotInputs, setPivot] = useState({ high: '24310', low: '24050', close: '24250' })

  // Black-Scholes approximation for display
  const S = parseFloat(ivInputs.spot) || 0
  const K = parseFloat(ivInputs.strike) || 0
  const P = parseFloat(ivInputs.premium) || 0
  const T = (parseFloat(ivInputs.expiry) || 1) / 365
  const iv = P > 0 ? ((P / S) * Math.sqrt(365 / (parseFloat(ivInputs.expiry) || 1)) * 100).toFixed(2) : '—'
  const delta = ivInputs.type === 'CE' ? '0.55' : '-0.45'
  const gamma = '0.0032'
  const theta = '-12.50'
  const vega = '8.25'

  // Pivot calculation
  const pH = parseFloat(pivotInputs.high) || 0
  const pL = parseFloat(pivotInputs.low) || 0
  const pC = parseFloat(pivotInputs.close) || 0
  const pivot = ((pH + pL + pC) / 3).toFixed(2)
  const r1 = (2 * pivot - pL).toFixed(2)
  const s1 = (2 * pivot - pH).toFixed(2)
  const r2 = (parseFloat(pivot) + (pH - pL)).toFixed(2)
  const s2 = (parseFloat(pivot) - (pH - pL)).toFixed(2)
  const r3 = (pH + 2 * (parseFloat(pivot) - pL)).toFixed(2)
  const s3 = (pL - 2 * (pH - parseFloat(pivot))).toFixed(2)

  const tabs = [
    { id: 'iv', label: 'IV Calculator' },
    { id: 'greeks', label: 'Greeks' },
    { id: 'pivot', label: 'Pivot Points' },
    { id: 'neutraliser', label: 'Greek Neutraliser' },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Tab Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '5px 14px', fontSize: 10, border: 'none', cursor: 'pointer',
            background: tab === t.id ? 'var(--bg-panel)' : 'transparent',
            color: tab === t.id ? 'var(--accent)' : '#7a7a8c',
            borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            fontFamily: 'var(--ui-font)', fontWeight: tab === t.id ? 600 : 400
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px' }}>
        {tab === 'iv' && (<>
          <div style={{ fontSize: 9, color: '#6a6a7a', padding: '2px 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>
            ── Implied Volatility Calculator ──
          </div>
          <Field label="Spot Price"><Input value={ivInputs.spot} onChange={v => setIv(p=>({...p,spot:v}))} /></Field>
          <Field label="Strike Price"><Input value={ivInputs.strike} onChange={v => setIv(p=>({...p,strike:v}))} /></Field>
          <Field label="Premium"><Input value={ivInputs.premium} onChange={v => setIv(p=>({...p,premium:v}))} /></Field>
          <Field label="Days to Expiry"><Input value={ivInputs.expiry} onChange={v => setIv(p=>({...p,expiry:v}))} width={60} /></Field>
          <Field label="Risk-Free Rate %"><Input value={ivInputs.rate} onChange={v => setIv(p=>({...p,rate:v}))} width={60} /></Field>
          <Field label="Option Type">
            <div style={{ display: 'flex', gap: 12 }}>
              {['CE','PE'].map(t => (
                <label key={t} style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, color:'#d0d0d8', cursor:'pointer' }}>
                  <input type="radio" name="ot" value={t} checked={ivInputs.type===t} onChange={() => setIv(p=>({...p,type:t}))} style={{ accentColor:'#00bcd4' }}/>{t}
                </label>
              ))}
            </div>
          </Field>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
          <Result label="Implied Volatility" value={`${iv}%`} color="#00bcd4" />
          <Result label="Bid IV" value="14.80%" />
          <Result label="Ask IV" value="15.60%" />
          <Result label="Last IV" value={`${iv}%`} color="#22c55e" />
          <Result label="High IV (Day)" value="18.20%" color="#ef4444" />
          <Result label="Low IV (Day)" value="13.50%" color="#22c55e" />
        </>)}

        {tab === 'greeks' && (<>
          <div style={{ fontSize: 9, color: '#6a6a7a', padding: '2px 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>
            ── Option Greeks ──
          </div>
          <div style={{ padding: '4px 8px', background: 'rgba(0,188,212,0.05)', marginBottom: 8, fontSize: 10, color: '#9aa0b0' }}>
            NIFTY 24200 CE | Spot: {ivInputs.spot} | Expiry: {ivInputs.expiry}d | IV: {iv}%
          </div>
          <Result label="Delta (Δ)" value={delta} color="#4dabf7" />
          <Result label="Gamma (Γ)" value={gamma} color="#a78bfa" />
          <Result label="Theta (Θ)" value={theta} color="#ef4444" />
          <Result label="Vega (ν)" value={vega} color="#22c55e" />
          <Result label="Rho (ρ)" value="0.42" color="#eab308" />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
          <Result label="Intrinsic Value" value={(Math.max(0, S - K)).toFixed(2)} />
          <Result label="Time Value" value={(P - Math.max(0, S - K)).toFixed(2)} />
          <Result label="Moneyness" value={S > K ? 'ITM' : S === K ? 'ATM' : 'OTM'} color={S > K ? '#22c55e' : '#eab308'} />
        </>)}

        {tab === 'pivot' && (<>
          <div style={{ fontSize: 9, color: '#6a6a7a', padding: '2px 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>
            ── Pivot Point Calculator (Classic) ──
          </div>
          <Field label="Yesterday High"><Input value={pivotInputs.high} onChange={v => setPivot(p=>({...p,high:v}))} /></Field>
          <Field label="Yesterday Low"><Input value={pivotInputs.low} onChange={v => setPivot(p=>({...p,low:v}))} /></Field>
          <Field label="Yesterday Close"><Input value={pivotInputs.close} onChange={v => setPivot(p=>({...p,close:v}))} /></Field>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
          <Result label="R3 (Resistance 3)" value={r3} color="#ef4444" />
          <Result label="R2 (Resistance 2)" value={r2} color="#ff6b6b" />
          <Result label="R1 (Resistance 1)" value={r1} color="#fca5a5" />
          <Result label="PIVOT" value={pivot} color="#00bcd4" />
          <Result label="S1 (Support 1)" value={s1} color="#86efac" />
          <Result label="S2 (Support 2)" value={s2} color="#22c55e" />
          <Result label="S3 (Support 3)" value={s3} color="#16a34a" />
        </>)}

        {tab === 'neutraliser' && (<>
          <div style={{ fontSize: 9, color: '#6a6a7a', padding: '2px 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>
            ── Delta / Gamma Neutral Calculator ──
          </div>
          <div style={{ padding: '6px 8px', background: 'rgba(0,188,212,0.04)', borderBottom: '1px solid var(--border)', fontSize: 9, color: '#9aa0b0', marginBottom: 8 }}>
            Enter your current positions to calculate net Greeks and get hedge recommendations
          </div>
          {[
            { leg: 'Leg 1', symbol: 'NIFTY 24200CE', qty: 50, delta: 0.55, gamma: 0.0032, theta: -12.5, vega: 8.25 },
            { leg: 'Leg 2', symbol: 'NIFTY 24200PE', qty: -50, delta: 0.45, gamma: 0.0032, theta: -9.8, vega: 8.25 },
            { leg: 'Leg 3', symbol: 'NIFTY 24300CE', qty: -25, delta: -0.42, gamma: -0.0028, theta: 11.2, vega: -7.1 },
          ].map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, padding: '3px 8px', borderBottom: '1px solid rgba(42,42,68,0.3)', fontSize: 9, alignItems: 'center' }}>
              <span style={{ color: '#5a5a6a', width: 35 }}>{l.leg}</span>
              <span style={{ color: '#d0d0d8', fontWeight: 600, width: 110 }}>{l.symbol}</span>
              <span style={{ color: l.qty > 0 ? '#22c55e' : '#ef4444', width: 40, textAlign: 'right' }}>{l.qty > 0 ? '+' : ''}{l.qty}</span>
              <span style={{ color: '#4dabf7', width: 50, textAlign: 'right' }}>Δ{(l.delta * l.qty).toFixed(2)}</span>
              <span style={{ color: '#a78bfa', width: 55, textAlign: 'right' }}>Γ{(l.gamma * Math.abs(l.qty)).toFixed(4)}</span>
            </div>
          ))}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
          <Result label="Net Delta" value="+5.00" color="#4dabf7" />
          <Result label="Net Gamma" value="+0.0920" color="#a78bfa" />
          <Result label="Net Theta" value="-550.00" color="#ef4444" />
          <Result label="Net Vega" value="+237.50" color="#22c55e" />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
          <div style={{ fontSize: 9, color: '#eab308', padding: '2px 0 4px', fontWeight: 600 }}>── HEDGE RECOMMENDATION ──</div>
          <Result label="To neutralize Delta" value="Sell 9 NIFTY FUT (Δ=1.0 each)" color="#eab308" />
          <Result label="To neutralize Gamma" value="Buy 29 NIFTY 24400CE (Γ=0.0032)" color="#eab308" />
          <Result label="Position Status" value="DELTA LONG — needs hedge" color="#ef4444" />
        </>)}
      </div>
    </div>
  )
}
