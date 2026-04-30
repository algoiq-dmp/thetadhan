export default function ATMAnalysisPanel() {
  // Mock ATM IV data points
  const ivPoints = [15.8, 15.9, 16.0, 16.1, 15.8, 15.6, 15.9, 16.2, 16.4, 16.5, 16.3, 16.6, 16.8, 16.7, 17.0, 16.9, 16.8, 16.5, 16.3, 16.0, 15.8, 15.6, 15.5, 15.4];
  const pricePoints = [24100, 24120, 24150, 24140, 24130, 24120, 24160, 24180, 24200, 24220, 24250, 24240, 24260, 24280, 24300, 24290, 24310, 24320, 24340, 24350, 24360, 24370, 24366, 24367];
  const stradPoints = [330, 335, 340, 345, 348, 342, 338, 340, 345, 350, 355, 358, 360, 362, 365, 368, 370, 372, 374, 375, 376, 378, 377, 378];

  const drawLine = (points, min, max, color, h = 100) => {
    const w = 240;
    const range = max - min || 1;
    const pts = points.map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / range) * (h - 10)}`).join(' ');
    return <polyline points={pts} fill="none" stroke={color} strokeWidth="2" />;
  };

  const ivMin = Math.min(...ivPoints) - 0.5;
  const ivMax = Math.max(...ivPoints) + 0.5;
  const pMin = Math.min(...pricePoints) - 50;
  const pMax = Math.max(...pricePoints) + 50;
  const sMin = Math.min(...stradPoints) - 10;
  const sMax = Math.max(...stradPoints) + 10;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>ATM Analysis</span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Last refresh: 03:25 PM</span>
      </div>

      {/* ATM IV Chart */}
      <div style={{ padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-heading)' }}>ATM IV</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Expiry 21 Apr</span>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
            <span style={{ width: 8, height: 3, background: '#8b5cf6', borderRadius: 2 }} />
            <span style={{ color: 'var(--text-muted)' }}>Price</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
            <span style={{ width: 8, height: 3, background: '#06b6d4', borderRadius: 2 }} />
            <span style={{ color: 'var(--text-muted)' }}>ATM IV</span>
          </span>
        </div>

        <svg width="100%" height="110" viewBox="0 0 240 110" style={{ background: 'var(--bg-card)', borderRadius: 6 }}>
          {drawLine(pricePoints, pMin, pMax, '#8b5cf6', 100)}
          {drawLine(ivPoints, ivMin, ivMax, '#06b6d4', 100)}
          {/* Current IV value */}
          <text x="220" y="95" fill="#06b6d4" fontSize="9" fontWeight="600" fontFamily="JetBrains Mono">{ivPoints[ivPoints.length - 1].toFixed(1)}</text>
          {/* Y-axis labels */}
          <text x="220" y="15" fill="var(--text-muted)" fontSize="8" fontFamily="JetBrains Mono">{ivMax.toFixed(1)}</text>
          <text x="220" y="55" fill="var(--text-muted)" fontSize="8" fontFamily="JetBrains Mono">{((ivMax + ivMin) / 2).toFixed(1)}</text>
        </svg>

        {/* Time labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: 'var(--text-muted)', marginTop: 2 }}>
          <span>02:45 PM<br />16 Apr</span>
          <span>17 Apr</span>
          <span>03:25 PM</span>
        </div>
      </div>

      {/* ATM Straddle Chart */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-heading)' }}>ATM Straddle</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Expiry 21 Apr</span>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
            <span style={{ width: 8, height: 3, background: '#8b5cf6', borderRadius: 2 }} />
            <span style={{ color: 'var(--text-muted)' }}>Price</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
            <span style={{ width: 8, height: 3, background: '#f59e0b', borderRadius: 2 }} />
            <span style={{ color: 'var(--text-muted)' }}>ATM Straddle</span>
          </span>
        </div>

        <svg width="100%" height="110" viewBox="0 0 240 110" style={{ background: 'var(--bg-card)', borderRadius: 6 }}>
          {drawLine(pricePoints, pMin, pMax, '#8b5cf6', 100)}
          {drawLine(stradPoints, sMin, sMax, '#f59e0b', 100)}
          <text x="220" y="25" fill="#f59e0b" fontSize="9" fontWeight="600" fontFamily="JetBrains Mono">{stradPoints[stradPoints.length - 1].toFixed(1)}</text>
        </svg>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: 'var(--text-muted)', marginTop: 2 }}>
          <span>02:45 PM<br />16 Apr</span>
          <span>17 Apr</span>
          <span>03:25 PM</span>
        </div>
      </div>
    </div>
  );
}
