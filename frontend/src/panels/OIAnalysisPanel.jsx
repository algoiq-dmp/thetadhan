import { useState } from 'react';

const STRIKES = [24000,24050,24100,24150,24200,24250,24300,24350,24400,24450,24500,24550,24600,24650,24700];
const MAX_PAIN = 24300;
const OI_RESISTANCE = 24500;

// Mock OI data
const genOI = () => STRIKES.map(s => ({
  strike: s,
  callOI: Math.round(30 + Math.random() * 70),
  putOI: Math.round(20 + Math.random() * 80),
  callOIChg: Math.round(-20 + Math.random() * 40),
  putOIChg: Math.round(-15 + Math.random() * 50),
}));

const TIMEFRAMES = ['5 Min', '10 Min', '15 Min', '30 Min', '1 Hour', '2 Hours', '3 Hours', 'Full Day'];

export default function OIAnalysisPanel() {
  const [showChange, setShowChange] = useState(false);
  const [timeframe, setTimeframe] = useState('Full Day');
  const data = genOI();

  const totalCallOI = data.reduce((s, d) => s + d.callOI, 0);
  const totalPutOI = data.reduce((s, d) => s + d.putOI, 0);
  const pcr = (totalPutOI / totalCallOI).toFixed(2);

  const maxOI = Math.max(...data.map(d => Math.max(d.callOI, d.putOI)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>Open Interest</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer' }}>
          Show change in OI
          <div className="toggle" style={{ width: 28, height: 14 }}>
            <input type="checkbox" checked={showChange} onChange={() => setShowChange(!showChange)} />
            <div className="toggle-track" style={{ borderRadius: 7 }} />
            <div className="toggle-thumb" style={{ width: 10, height: 10, top: 2, left: 2 }} />
          </div>
        </label>
      </div>

      <div style={{ fontSize: 10, color: 'var(--text-muted)', padding: '4px 12px', textAlign: 'right' }}>Expiry: 21 Apr</div>

      {/* OI Bar Chart */}
      <div style={{ padding: '0 12px 12px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 4 }}>NIFTY50 24353.55</div>
          {data.map(d => {
            const cWidth = (d.callOI / maxOI) * 100;
            const pWidth = (d.putOI / maxOI) * 100;
            const isMaxPain = d.strike === MAX_PAIN;
            const isResistance = d.strike === OI_RESISTANCE;
            return (
              <div key={d.strike} style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2, height: 14 }}>
                {/* Call OI bar (right-aligned) */}
                <div style={{ width: '40%', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: `${cWidth}%`, height: 10, background: 'rgba(239,68,68,0.6)', borderRadius: '2px 0 0 2px', minWidth: 2 }} />
                </div>
                {/* Strike */}
                <div style={{ width: '20%', textAlign: 'center', fontSize: 9, fontWeight: 600, fontFamily: 'var(--font-mono)', color: isMaxPain ? 'var(--green)' : isResistance ? 'var(--red)' : 'var(--text-muted)' }}>
                  {d.strike}
                  {isMaxPain && <div style={{ fontSize: 7, color: 'var(--green)', background: 'var(--green-soft)', borderRadius: 2, padding: '0 3px', marginTop: 1 }}>Max Pain</div>}
                  {isResistance && <div style={{ fontSize: 7, color: 'var(--red)', background: 'var(--red-soft)', borderRadius: 2, padding: '0 3px', marginTop: 1 }}>OI Resistance</div>}
                </div>
                {/* Put OI bar (left-aligned) */}
                <div style={{ width: '40%' }}>
                  <div style={{ width: `${pWidth}%`, height: 10, background: 'rgba(6,182,212,0.6)', borderRadius: '0 2px 2px 0', minWidth: 2 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(239,68,68,0.6)' }} /> Call OI
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(6,182,212,0.6)' }} /> Put OI
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11 }}>
          <div>Total Call OI <strong style={{ color: 'var(--text-heading)' }}>{totalCallOI.toFixed(0)}L</strong></div>
          <div>PCR <strong style={{ color: 'var(--text-heading)' }}>{pcr}</strong></div>
        </div>
        <div style={{ fontSize: 11 }}>Total Put OI <strong style={{ color: 'var(--text-heading)' }}>{totalPutOI.toFixed(0)}L</strong></div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>Aggregate values for 11 strikes around ATM</div>
      </div>

      {/* OI Change Section */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>OI Change</div>

        {/* Mini bar chart for OI Change */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60, marginBottom: 8 }}>
          {data.slice(3, 12).map(d => (
            <div key={d.strike} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <div style={{ width: '80%', height: Math.abs(d.callOIChg) * 1.5, background: d.callOIChg >= 0 ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.3)', borderRadius: '2px 2px 0 0' }} />
              <div style={{ width: '80%', height: Math.abs(d.putOIChg) * 1, background: d.putOIChg >= 0 ? 'rgba(6,182,212,0.5)' : 'rgba(6,182,212,0.3)', borderRadius: '0 0 2px 2px' }} />
            </div>
          ))}
        </div>

        {/* Timeframe Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {TIMEFRAMES.map(tf => (
            <button key={tf}
              className={`sector-pill${timeframe === tf ? ' active' : ''}`}
              onClick={() => setTimeframe(tf)}
              style={{ fontSize: 9, padding: '3px 8px' }}
            >{tf}</button>
          ))}
        </div>

        <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div>Call OI Change <strong style={{ color: 'var(--red)' }}>-55.44L</strong></div>
          <div>Put OI Change <strong style={{ color: 'var(--green)' }}>+121.77L</strong></div>
          <div>NIFTY50 Change <strong style={{ color: 'var(--green)' }}>+156.80</strong></div>
        </div>
      </div>
    </div>
  );
}
