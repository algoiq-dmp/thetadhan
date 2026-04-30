export default function AIAnalysisPanel() {
  const trendScore = 78;
  const rsi = 65.3;
  const pcr = 1.18;
  const adRatio = '40 / 10';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      {/* Symbol Header */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>NIFTY50</span>
        <span style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>+0.65%</span>
      </div>

      {/* Mini Chart Area */}
      <div style={{ padding: '8px 12px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <svg width="100%" height="80" viewBox="0 0 240 80">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(16,185,129,0.3)" />
              <stop offset="100%" stopColor="rgba(16,185,129,0)" />
            </linearGradient>
          </defs>
          <path d="M0,60 L20,55 L40,58 L60,50 L80,45 L100,48 L120,42 L140,38 L160,35 L180,30 L200,25 L220,20 L240,15"
            fill="none" stroke="var(--green)" strokeWidth="2" />
          <path d="M0,60 L20,55 L40,58 L60,50 L80,45 L100,48 L120,42 L140,38 L160,35 L180,30 L200,25 L220,20 L240,15 L240,80 L0,80Z"
            fill="url(#chartGrad)" />
          <circle cx="240" cy="15" r="3" fill="var(--green)" />
          <text x="220" y="12" fill="var(--text-heading)" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">24,366.9</text>
        </svg>
      </div>

      {/* Trend Card */}
      <div style={{ margin: '8px 12px', padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>18 Apr trend</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Since 01:15 PM</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span style={{ fontSize: 16 }}>↗</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>Strong Uptrend</span>
        </div>
      </div>

      {/* AI Analysis Text */}
      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
          The market shows a <strong style={{ color: 'var(--text-heading)' }}>strong uptrend</strong> with a visible breakout above the opening range.
        </p>

        <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: 'var(--green)' }}>Advance-decline ratio</strong> is bullish with {adRatio} — strong breadth.
        </p>

        <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: 'var(--orange)' }}>RSI(7)</strong> is at <strong style={{ color: 'var(--text-heading)' }}>{rsi.toFixed(0)}</strong>, indicating moderate momentum with room to run.
        </p>

        <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: 'var(--cyan)' }}>OI PCR</strong> is at <strong style={{ color: 'var(--text-heading)' }}>{pcr.toFixed(2)}</strong> — moderately bullish, put writers are active.
        </p>

        <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
          Current price is near the <strong style={{ color: 'var(--red)' }}>OI Resistance</strong> of <strong style={{ color: 'var(--text-heading)' }}>24,500</strong>, indicating a potential resistance level.
        </p>

        <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
          The market has broken out of the <strong style={{ color: 'var(--text-heading)' }}>Sideways</strong> trend, confirming the bullish sentiment.
        </p>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '10px 12px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text-muted)' }}>
        <div>Last updated at 03:30 PM, 18 Apr, 2026</div>
        <div>Summarised by <strong style={{ color: 'var(--cyan)' }}>Theta AI</strong></div>
      </div>
    </div>
  );
}
