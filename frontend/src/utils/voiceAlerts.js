/**
 * Voice Alert System — Web Speech API
 * Provides audio alerts for trading events
 */

let voiceEnabled = true;
let soundEnabled = true;
let voiceQueue = [];
let speaking = false;

// Audio context for sound effects
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

/**
 * Speak text using Web Speech API
 */
export function speak(text, priority = 'normal') {
  if (!voiceEnabled || !window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.15;
  utterance.pitch = 1.0;
  utterance.volume = 0.8;

  // Use a good voice if available
  const voices = speechSynthesis.getVoices();
  const preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
    || voices.find(v => v.lang.startsWith('en'));
  if (preferred) utterance.voice = preferred;

  if (priority === 'urgent') {
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  } else {
    speechSynthesis.speak(utterance);
  }
}

/**
 * Play tone for buy/sell fills
 */
export function playTone(type = 'buy') {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'buy') {
      // Ascending tone for buy
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'sell') {
      // Descending tone for sell
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'alert') {
      // Double beep for alerts
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.25);
    } else if (type === 'error') {
      // Low warning buzz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'profit') {
      // Musical scale for profit — C E G C
      [523, 659, 784, 1047].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(f, ctx.currentTime + i * 0.12);
        g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.15);
        o.start(ctx.currentTime + i * 0.12);
        o.stop(ctx.currentTime + i * 0.12 + 0.15);
      });
    }
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
}

/**
 * Alert presets
 */
export function alertBuyFill(symbol, price) {
  playTone('buy');
  speak(`Buy fill. ${symbol} at ${price}`);
}

export function alertSellFill(symbol, price) {
  playTone('sell');
  speak(`Sell fill. ${symbol} at ${price}`);
}

export function alertCircuit(symbol, direction) {
  playTone('alert');
  speak(`Warning! ${symbol} near ${direction} circuit limit`, 'urgent');
}

export function alertKillSwitch(loss) {
  playTone('error');
  speak(`Kill switch triggered. Day loss ${loss}. All orders blocked.`, 'urgent');
}

export function alertProfit(amount) {
  playTone('profit');
  speak(`Target reached. Profit ${amount} rupees`);
}

/**
 * Toggle voice/sound
 */
export function setVoiceEnabled(val) { voiceEnabled = val; }
export function setSoundEnabled(val) { soundEnabled = val; }
export function isVoiceEnabled() { return voiceEnabled; }
export function isSoundEnabled() { return soundEnabled; }
