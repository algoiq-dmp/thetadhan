/* ═══════════════════════════════════════════════════════════
   LIGHT Z — Sound Engine (Web Audio API)
   Trade confirmation beeps, rejection tones, alert sounds
   ═══════════════════════════════════════════════════════════ */

let audioCtx = null

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

function playTone(freq, duration, type = 'sine', volume = 0.3) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch (e) { /* audio not supported */ }
}

/** Trade executed — ascending double beep (success) */
export function playTradeBeep() {
  const vol = getVolume()
  playTone(880, 0.1, 'sine', vol)
  setTimeout(() => playTone(1100, 0.15, 'sine', vol), 120)
}

/** Order rejected — descending tone (error) */
export function playRejectBeep() {
  const vol = getVolume()
  playTone(440, 0.15, 'square', vol * 0.5)
  setTimeout(() => playTone(330, 0.2, 'square', vol * 0.5), 180)
}

/** Alert triggered — triple pulse (attention) */
export function playAlertBeep() {
  const vol = getVolume()
  playTone(660, 0.08, 'sine', vol)
  setTimeout(() => playTone(660, 0.08, 'sine', vol), 150)
  setTimeout(() => playTone(880, 0.12, 'sine', vol), 300)
}

/** Order placed — single soft click */
export function playOrderBeep() {
  playTone(600, 0.06, 'sine', getVolume() * 0.4)
}

/** Get volume from settings (0-1 range) */
function getVolume() {
  try {
    const settings = JSON.parse(localStorage.getItem('lightz-settings'))
    if (settings?.soundVolume != null) return settings.soundVolume / 100
  } catch {}
  return 0.3
}

/** Check if sounds are enabled */
export function isSoundEnabled(type = 'trade') {
  try {
    const settings = JSON.parse(localStorage.getItem('lightz-settings'))
    if (type === 'trade') return settings?.tradeSound !== false
    if (type === 'rejection') return settings?.rejectionSound !== false
    if (type === 'alert') return settings?.alertSound !== false
  } catch {}
  return true
}
