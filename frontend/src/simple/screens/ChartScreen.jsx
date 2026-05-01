import { useState, useEffect, useRef, useCallback } from 'react'
import InlineSettings, { SField, SSel, SChk, GearBtn } from '../components/InlineSettings'

// Generate mock candlestick data
const generateCandles = (count = 120) => {
  const candles = []
  let price = 24100
  const now = new Date()
  for (let i = count; i >= 0; i--) {
    const time = new Date(now - i * 60000)
    const open = price + (Math.random() - 0.48) * 15
    const close = open + (Math.random() - 0.48) * 20
    const high = Math.max(open, close) + Math.random() * 10
    const low = Math.min(open, close) - Math.random() * 10
    const vol = Math.floor(5000 + Math.random() * 15000)
    candles.push({ time, open, high, low, close, vol })
    price = close
  }
  return candles
}

// Calculate RSI
const calcRSI = (candles, period = 14) => {
  const rsi = new Array(candles.length).fill(50)
  for (let i = period; i < candles.length; i++) {
    let gains = 0, losses = 0
    for (let j = i - period + 1; j <= i; j++) {
      const diff = candles[j].close - candles[j - 1].close
      if (diff > 0) gains += diff; else losses -= diff
    }
    const avgGain = gains / period, avgLoss = losses / period
    rsi[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss))
  }
  return rsi
}

// Calculate MACD (12,26,9)
const calcMACD = (candles) => {
  const ema = (data, period) => {
    const result = [data[0]]
    const k = 2 / (period + 1)
    for (let i = 1; i < data.length; i++) result.push(data[i] * k + result[i - 1] * (1 - k))
    return result
  }
  const closes = candles.map(c => c.close)
  const ema12 = ema(closes, 12), ema26 = ema(closes, 26)
  const macdLine = ema12.map((v, i) => v - ema26[i])
  const signal = ema(macdLine, 9)
  const histogram = macdLine.map((v, i) => v - signal[i])
  return { macdLine, signal, histogram }
}

// Calculate Bollinger Bands
const calcBB = (candles, period = 20, mult = 2) => {
  return candles.map((_, i) => {
    if (i < period) return { upper: candles[i].high, middle: candles[i].close, lower: candles[i].low }
    const slice = candles.slice(i - period, i)
    const mean = slice.reduce((a, c) => a + c.close, 0) / period
    const std = Math.sqrt(slice.reduce((a, c) => a + (c.close - mean) ** 2, 0) / period)
    return { upper: mean + mult * std, middle: mean, lower: mean - mult * std }
  })
}

export default function ChartScreen() {
  const canvasRef = useRef(null)
  const [interval, setInterval_] = useState('1m')
  const [symbol] = useState('NIFTY 24200CE')
  const [candles] = useState(() => generateCandles(120))
  const [showSettings, setShowSettings] = useState(false)
  const [activeIndicators, setActiveIndicators] = useState({ SMA: true, BB: false, RSI: false, MACD: false, VWAP: false, EMA: false })
  const [activeTool, setActiveTool] = useState(null) // 'trendline','hline','fib','rect','text'
  const [drawings, setDrawings] = useState([])
  const [drawStart, setDrawStart] = useState(null)
  const [chartSettings, setChartSettings] = useState({
    chartType: 'Candlestick', colorScheme: 'ODIN Classic', showVolume: true, crosshair: true, autoScale: true, showGrid: true
  })
  const setCs = (k, v) => setChartSettings(p => ({ ...p, [k]: v }))
  const toggleInd = (key) => setActiveIndicators(p => ({ ...p, [key]: !p[key] }))

  // Calculate indicator data
  const rsiData = calcRSI(candles)
  const macdData = calcMACD(candles)
  const bbData = calcBB(candles)
  const smaData = candles.map((_, i) => {
    if (i < 20) return candles[i].close
    return candles.slice(i - 20, i).reduce((a, c) => a + c.close, 0) / 20
  })

  // Sub-panel height
  const hasRSI = activeIndicators.RSI
  const hasMACD = activeIndicators.MACD
  const subPanels = (hasRSI ? 1 : 0) + (hasMACD ? 1 : 0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.parentElement.clientWidth
    const H = canvas.height = canvas.parentElement.clientHeight
    ctx.fillStyle = '#0d0d1a'
    ctx.fillRect(0, 0, W, H)

    const subH = subPanels > 0 ? 80 * subPanels : 0
    const chartH = H - 50 - subH
    const chartW = W - 60
    const startX = 50, startY = 10
    const allPrices = candles.flatMap(c => [c.high, c.low])
    if (activeIndicators.BB) { allPrices.push(...bbData.map(b => b.upper), ...bbData.map(b => b.lower)) }
    const minP = Math.min(...allPrices) - 5
    const maxP = Math.max(...allPrices) + 5
    const range = maxP - minP
    const toY = (p) => startY + chartH - ((p - minP) / range) * chartH
    const candleW = Math.max(3, (chartW / candles.length) - 1)
    const toX = (i) => startX + i * (candleW + 1)

    // Grid
    if (chartSettings.showGrid) {
      ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 0.5
      for (let i = 0; i <= 8; i++) {
        const y = startY + (chartH / 8) * i
        ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(startX + chartW, y); ctx.stroke()
        ctx.fillStyle = '#4a4a6a'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'right'
        ctx.fillText((maxP - (range / 8) * i).toFixed(2), startX - 4, y + 3)
      }
    }

    // Time labels
    for (let i = 0; i < candles.length; i += 15) {
      ctx.fillStyle = '#3a3a5a'; ctx.font = '8px JetBrains Mono'; ctx.textAlign = 'center'
      ctx.fillText(candles[i].time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), toX(i), startY + chartH + 14)
    }

    // Bollinger Bands
    if (activeIndicators.BB) {
      ctx.globalAlpha = 0.15; ctx.fillStyle = '#7c4dff'
      ctx.beginPath(); ctx.moveTo(toX(0), toY(bbData[0].upper))
      bbData.forEach((b, i) => ctx.lineTo(toX(i), toY(b.upper)))
      for (let i = bbData.length - 1; i >= 0; i--) ctx.lineTo(toX(i), toY(bbData[i].lower))
      ctx.fill(); ctx.globalAlpha = 1
      // Upper/Lower lines
      ctx.strokeStyle = '#7c4dff'; ctx.lineWidth = 0.7; ctx.setLineDash([2, 2])
      ctx.beginPath(); bbData.forEach((b, i) => { i === 0 ? ctx.moveTo(toX(i), toY(b.upper)) : ctx.lineTo(toX(i), toY(b.upper)) }); ctx.stroke()
      ctx.beginPath(); bbData.forEach((b, i) => { i === 0 ? ctx.moveTo(toX(i), toY(b.lower)) : ctx.lineTo(toX(i), toY(b.lower)) }); ctx.stroke()
      ctx.setLineDash([])
    }

    // SMA overlay
    if (activeIndicators.SMA) {
      ctx.strokeStyle = '#eab308'; ctx.lineWidth = 1.2; ctx.beginPath()
      smaData.forEach((v, i) => { i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)) })
      ctx.stroke()
    }

    // Candlesticks
    candles.forEach((c, i) => {
      const x = toX(i)
      const isGreen = c.close >= c.open
      const color = isGreen ? '#22c55e' : '#ef4444'
      ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath()
      ctx.moveTo(x + candleW / 2, toY(c.high)); ctx.lineTo(x + candleW / 2, toY(c.low)); ctx.stroke()
      ctx.fillStyle = color
      const bodyTop = toY(Math.max(c.open, c.close))
      const bodyBot = toY(Math.min(c.open, c.close))
      ctx.fillRect(x, bodyTop, candleW, Math.max(1, bodyBot - bodyTop))
    })

    // Volume bars
    if (chartSettings.showVolume) {
      const maxVol = Math.max(...candles.map(c => c.vol))
      candles.forEach((c, i) => {
        const x = toX(i)
        const h = (c.vol / maxVol) * 40
        ctx.fillStyle = c.close >= c.open ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'
        ctx.fillRect(x, startY + chartH - h, candleW, h)
      })
    }

    // Last price line
    const lastPrice = candles[candles.length - 1].close
    ctx.strokeStyle = '#00bcd4'; ctx.lineWidth = 1; ctx.setLineDash([4, 3])
    ctx.beginPath(); ctx.moveTo(startX, toY(lastPrice)); ctx.lineTo(startX + chartW, toY(lastPrice)); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#00bcd4'; ctx.fillRect(startX + chartW + 2, toY(lastPrice) - 8, 48, 16)
    ctx.fillStyle = '#000'; ctx.font = 'bold 9px JetBrains Mono'; ctx.textAlign = 'left'
    ctx.fillText(lastPrice.toFixed(2), startX + chartW + 5, toY(lastPrice) + 4)

    // Draw saved drawings
    drawings.forEach(d => {
      if (d.type === 'hline') {
        ctx.strokeStyle = '#eab308'; ctx.lineWidth = 1; ctx.setLineDash([6, 3])
        ctx.beginPath(); ctx.moveTo(startX, d.y); ctx.lineTo(startX + chartW, d.y); ctx.stroke(); ctx.setLineDash([])
      } else if (d.type === 'trendline') {
        ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(d.x1, d.y1); ctx.lineTo(d.x2, d.y2); ctx.stroke()
      }
    })

    // ── RSI Sub-panel ──
    if (hasRSI) {
      const rsiTop = startY + chartH + 22
      const rsiH = 70
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(startX, rsiTop, chartW, rsiH)
      ctx.strokeStyle = '#2a2a44'; ctx.lineWidth = 0.5
      // Overbought/Oversold
      ;[30, 50, 70].forEach(lv => {
        const y = rsiTop + rsiH - (lv / 100) * rsiH
        ctx.beginPath(); ctx.setLineDash([2, 2]); ctx.moveTo(startX, y); ctx.lineTo(startX + chartW, y); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = lv === 70 ? '#ef4444' : lv === 30 ? '#22c55e' : '#5a5a6a'; ctx.font = '7px JetBrains Mono'; ctx.textAlign = 'right'
        ctx.fillText(lv.toString(), startX - 4, y + 3)
      })
      // RSI line
      ctx.strokeStyle = '#7c4dff'; ctx.lineWidth = 1.5; ctx.beginPath()
      rsiData.forEach((v, i) => { const x = toX(i); const y = rsiTop + rsiH - (v / 100) * rsiH; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) })
      ctx.stroke()
      ctx.fillStyle = '#7c4dff'; ctx.font = '8px JetBrains Mono'; ctx.textAlign = 'left'
      ctx.fillText(`RSI(14): ${rsiData[rsiData.length - 1].toFixed(1)}`, startX + 4, rsiTop + 10)
      // Zone fill
      const lastRSI = rsiData[rsiData.length - 1]
      ctx.fillStyle = lastRSI > 70 ? 'rgba(239,68,68,0.08)' : lastRSI < 30 ? 'rgba(34,197,94,0.08)' : 'transparent'
      ctx.fillRect(startX, rsiTop, chartW, rsiH)
    }

    // ── MACD Sub-panel ──
    if (hasMACD) {
      const macdTop = startY + chartH + 22 + (hasRSI ? 80 : 0)
      const macdH = 70
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(startX, macdTop, chartW, macdH)
      const maxMacd = Math.max(...macdData.histogram.map(Math.abs), ...macdData.macdLine.map(Math.abs)) * 1.2
      const toMY = (v) => macdTop + macdH / 2 - (v / maxMacd) * (macdH / 2)
      // Zero line
      ctx.strokeStyle = '#3a3a5a'; ctx.lineWidth = 0.5; ctx.beginPath()
      ctx.moveTo(startX, macdTop + macdH / 2); ctx.lineTo(startX + chartW, macdTop + macdH / 2); ctx.stroke()
      // Histogram bars
      macdData.histogram.forEach((v, i) => {
        const x = toX(i)
        ctx.fillStyle = v >= 0 ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'
        const barH = Math.abs((v / maxMacd) * (macdH / 2))
        ctx.fillRect(x, v >= 0 ? macdTop + macdH / 2 - barH : macdTop + macdH / 2, candleW, barH)
      })
      // MACD line
      ctx.strokeStyle = '#4dabf7'; ctx.lineWidth = 1.2; ctx.beginPath()
      macdData.macdLine.forEach((v, i) => { i === 0 ? ctx.moveTo(toX(i), toMY(v)) : ctx.lineTo(toX(i), toMY(v)) }); ctx.stroke()
      // Signal line
      ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 1; ctx.beginPath()
      macdData.signal.forEach((v, i) => { i === 0 ? ctx.moveTo(toX(i), toMY(v)) : ctx.lineTo(toX(i), toMY(v)) }); ctx.stroke()
      ctx.fillStyle = '#4dabf7'; ctx.font = '8px JetBrains Mono'; ctx.textAlign = 'left'
      ctx.fillText(`MACD: ${macdData.macdLine.slice(-1)[0].toFixed(2)}  Signal: ${macdData.signal.slice(-1)[0].toFixed(2)}`, startX + 4, macdTop + 10)
    }
  }, [candles, activeIndicators, chartSettings, drawings, subPanels])

  // Drawing tool mouse handlers
  const handleCanvasClick = useCallback((e) => {
    if (!activeTool) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    if (activeTool === 'hline') {
      setDrawings(prev => [...prev, { type: 'hline', y }]); setActiveTool(null)
    } else if (activeTool === 'trendline') {
      if (!drawStart) { setDrawStart({ x, y }) } else {
        setDrawings(prev => [...prev, { type: 'trendline', x1: drawStart.x, y1: drawStart.y, x2: x, y2: y }])
        setDrawStart(null); setActiveTool(null)
      }
    }
  }, [activeTool, drawStart])

  const intervals = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W']
  const indicatorList = ['SMA', 'EMA', 'BB', 'RSI', 'MACD', 'VWAP', 'ADX', 'CCI', 'Stoch', 'ATR', 'OBV', 'PSAR']
  const drawingTools = [
    { key: 'trendline', icon: '╱', label: 'Trendline' },
    { key: 'hline', icon: '─', label: 'Horizontal Line' },
    { key: 'fib', icon: '⌇', label: 'Fibonacci' },
    { key: 'rect', icon: '□', label: 'Rectangle' },
    { key: 'channel', icon: '╫', label: 'Channel' },
    { key: 'sr', icon: '⇔', label: 'Support/Resistance' },
    { key: 'text', icon: 'T', label: 'Text' },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0d0d1a' }}>
      {/* Chart Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '3px 6px',
        background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', fontSize: 10
      }}>
        <span style={{ fontWeight: 700, color: 'var(--text-bright)', fontSize: 11 }}>{symbol}</span>
        <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>|</span>
        {intervals.map(iv => (
          <button key={iv} onClick={() => setInterval_(iv)} style={{
            padding: '1px 6px', fontSize: 9, border: '1px solid var(--border)', cursor: 'pointer',
            background: interval === iv ? 'var(--bg-row-selected)' : 'transparent',
            color: interval === iv ? 'var(--accent)' : 'var(--text-secondary)',
            fontFamily: 'var(--grid-font)'
          }}>{iv}</button>
        ))}
        <span style={{ margin: '0 4px', color: 'var(--border)' }}>|</span>
        {indicatorList.map(ind => (
          <button key={ind} onClick={() => toggleInd(ind)} style={{
            padding: '1px 5px', fontSize: 8, border: '1px solid var(--border)', cursor: 'pointer',
            background: activeIndicators[ind] ? 'rgba(0,188,212,0.15)' : 'transparent',
            color: activeIndicators[ind] ? 'var(--accent)' : '#6a6a7a',
            fontFamily: 'var(--ui-font)', fontWeight: activeIndicators[ind] ? 700 : 400
          }}>{ind}</button>
        ))}
        <span style={{ margin: '0 4px', color: 'var(--border)' }}>|</span>
        {drawingTools.map(dt => (
          <button key={dt.key} onClick={() => setActiveTool(activeTool === dt.key ? null : dt.key)} title={dt.label} style={{
            padding: '1px 5px', fontSize: 10, border: '1px solid var(--border)', cursor: 'pointer',
            background: activeTool === dt.key ? 'rgba(234,179,8,0.2)' : 'transparent',
            color: activeTool === dt.key ? '#eab308' : '#6a6a7a',
          }}>{dt.icon}</button>
        ))}
        {drawings.length > 0 && (
          <button onClick={() => setDrawings([])} title="Clear all drawings" style={{
            padding: '1px 5px', fontSize: 8, border: '1px solid var(--border)', cursor: 'pointer',
            background: 'rgba(239,68,68,0.1)', color: '#ef4444'
          }}>🗑</button>
        )}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--grid-font)', fontSize: 10 }}>
          <span style={{ color: '#7a7a8c' }}>O:</span><span style={{ color: '#d0d0d8' }}>{candles[candles.length-1]?.open.toFixed(2)}</span>
          <span style={{ color: '#7a7a8c', marginLeft: 6 }}>H:</span><span style={{ color: '#22c55e' }}>{candles[candles.length-1]?.high.toFixed(2)}</span>
          <span style={{ color: '#7a7a8c', marginLeft: 6 }}>L:</span><span style={{ color: '#ef4444' }}>{candles[candles.length-1]?.low.toFixed(2)}</span>
          <span style={{ color: '#7a7a8c', marginLeft: 6 }}>C:</span><span style={{ color: '#00bcd4' }}>{candles[candles.length-1]?.close.toFixed(2)}</span>
        </span>
        <GearBtn onClick={() => setShowSettings(s => !s)} />
      </div>

      {/* Active tool indicator */}
      {activeTool && (
        <div style={{ padding: '2px 8px', background: 'rgba(234,179,8,0.08)', borderBottom: '1px solid var(--border)', fontSize: 9, color: '#eab308' }}>
          🖊 Drawing: <b>{activeTool}</b> — {activeTool === 'trendline' ? (drawStart ? 'Click end point' : 'Click start point') : 'Click on chart'} │ <span style={{ cursor: 'pointer' }} onClick={() => { setActiveTool(null); setDrawStart(null) }}>✕ Cancel</span>
        </div>
      )}

      {/* Chart Settings */}
      <InlineSettings show={showSettings} onClose={() => setShowSettings(false)} title="Chart Settings">
        <SField label="Type"><SSel value={chartSettings.chartType} options={['Candlestick','Line','Area','Bar','Heikin-Ashi']} onChange={v => setCs('chartType', v)} /></SField>
        <SField label="Color"><SSel value={chartSettings.colorScheme} options={['ODIN Classic','Bloomberg','Light']} onChange={v => setCs('colorScheme', v)} /></SField>
        <SChk checked={chartSettings.showVolume} label="Volume" onChange={v => setCs('showVolume', v)} />
        <SChk checked={chartSettings.crosshair} label="Crosshair" onChange={v => setCs('crosshair', v)} />
        <SChk checked={chartSettings.autoScale} label="Auto-Scale" onChange={v => setCs('autoScale', v)} />
        <SChk checked={chartSettings.showGrid} label="Grid" onChange={v => setCs('showGrid', v)} />
      </InlineSettings>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <canvas ref={canvasRef} onClick={handleCanvasClick}
          style={{ width: '100%', height: '100%', display: 'block', cursor: activeTool ? 'crosshair' : 'default' }} />
      </div>

      {/* Indicator Legend Footer */}
      {subPanels > 0 && (
        <div style={{ padding: '2px 8px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border)', fontSize: 8, color: '#5a5a6a', display: 'flex', gap: 12 }}>
          {hasRSI && <span>RSI(14): <b style={{ color: rsiData[rsiData.length-1] > 70 ? '#ef4444' : rsiData[rsiData.length-1] < 30 ? '#22c55e' : '#7c4dff' }}>{rsiData[rsiData.length-1].toFixed(1)}</b></span>}
          {hasMACD && <span>MACD: <b style={{ color: '#4dabf7' }}>{macdData.macdLine.slice(-1)[0].toFixed(2)}</b> Signal: <b style={{ color: '#ff6b6b' }}>{macdData.signal.slice(-1)[0].toFixed(2)}</b></span>}
          {activeIndicators.SMA && <span>SMA(20): <b style={{ color: '#eab308' }}>{smaData.slice(-1)[0].toFixed(2)}</b></span>}
        </div>
      )}
    </div>
  )
}
