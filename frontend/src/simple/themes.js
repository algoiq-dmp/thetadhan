/* ═══════════════════════════════════════════════════════════
   LIGHT Z THEME ENGINE — 5 Preset Themes
   Applied via applyTheme() which sets CSS vars on :root
   ═══════════════════════════════════════════════════════════ */

export const THEMES = {
  'ODIN Classic': {
    '--bg-app': '#0d0d1a', '--bg-desktop': '#121225', '--bg-panel': '#1a1a2e',
    '--bg-surface': '#16213e', '--bg-input': '#0f0f22',
    '--bg-titlebar': 'linear-gradient(180deg, #3a3a5c 0%, #2a2a44 40%, #1a1a2e 100%)',
    '--bg-titlebar-inactive': 'linear-gradient(180deg, #2a2a3c 0%, #1e1e30 100%)',
    '--bg-menubar': '#1e1e32', '--bg-toolbar': '#16162a', '--bg-statusbar': '#0d0d1a',
    '--bg-row-hover': '#1e2a4a', '--bg-row-selected': '#0f3460', '--bg-row-alt': '#1a1a30',
    '--bg-row-even': '#1a1a2e', '--bg-row-odd': '#161628',
    '--text-primary': '#d0d0d8', '--text-secondary': '#7a7a8c', '--text-muted': '#4a4a5c', '--text-bright': '#ffffff',
    '--buy': '#1565C0', '--buy-bg': '#0d3875', '--sell': '#C62828', '--sell-bg': '#6e1515',
    '--profit': '#00c853', '--loss': '#ff1744', '--unchanged': '#888',
    '--accent': '#00bcd4', '--accent2': '#7c4dff',
    '--border': '#2a2a44', '--border-light': '#3a3a5a', '--border-focus': '#00bcd4',
    '--shadow': '0 2px 8px rgba(0,0,0,0.5)', '--shadow-window': '0 4px 16px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.05)',
  },

  'Dark Pro': {
    '--bg-app': '#08080c', '--bg-desktop': '#0c0c12', '--bg-panel': '#111118',
    '--bg-surface': '#16161e', '--bg-input': '#0a0a10',
    '--bg-titlebar': 'linear-gradient(180deg, #28283a 0%, #1a1a28 40%, #111118 100%)',
    '--bg-titlebar-inactive': 'linear-gradient(180deg, #1e1e2a 0%, #141420 100%)',
    '--bg-menubar': '#141420', '--bg-toolbar': '#0e0e18', '--bg-statusbar': '#08080c',
    '--bg-row-hover': '#1a2040', '--bg-row-selected': '#0d2850', '--bg-row-alt': '#131320',
    '--bg-row-even': '#111118', '--bg-row-odd': '#0e0e16',
    '--text-primary': '#e0e0e8', '--text-secondary': '#6a6a80', '--text-muted': '#3a3a50', '--text-bright': '#ffffff',
    '--buy': '#2196F3', '--buy-bg': '#0d3060', '--sell': '#f44336', '--sell-bg': '#701515',
    '--profit': '#00e676', '--loss': '#ff5252', '--unchanged': '#666',
    '--accent': '#00e5ff', '--accent2': '#b388ff',
    '--border': '#22223a', '--border-light': '#32324a', '--border-focus': '#00e5ff',
    '--shadow': '0 2px 12px rgba(0,0,0,0.7)', '--shadow-window': '0 6px 24px rgba(0,0,0,0.8), 0 0 1px rgba(0,229,255,0.1)',
  },

  'Light': {
    '--bg-app': '#f0f2f5', '--bg-desktop': '#e8eaed', '--bg-panel': '#ffffff',
    '--bg-surface': '#f5f7fa', '--bg-input': '#ffffff',
    '--bg-titlebar': 'linear-gradient(180deg, #4a6fa5 0%, #3d5a8c 40%, #2c4a7a 100%)',
    '--bg-titlebar-inactive': 'linear-gradient(180deg, #8898b0 0%, #7a8aa0 100%)',
    '--bg-menubar': '#e2e6ea', '--bg-toolbar': '#edf0f4', '--bg-statusbar': '#dde1e6',
    '--bg-row-hover': '#e3edf8', '--bg-row-selected': '#cce0f5', '--bg-row-alt': '#f7f8fa',
    '--bg-row-even': '#ffffff', '--bg-row-odd': '#f7f8fa',
    '--text-primary': '#1a1a2e', '--text-secondary': '#5a6070', '--text-muted': '#9aa0b0', '--text-bright': '#000000',
    '--buy': '#1976D2', '--buy-bg': '#e3f2fd', '--sell': '#d32f2f', '--sell-bg': '#fce4ec',
    '--profit': '#2e7d32', '--loss': '#c62828', '--unchanged': '#757575',
    '--accent': '#0288d1', '--accent2': '#7b1fa2',
    '--border': '#d0d5dd', '--border-light': '#e0e4ea', '--border-focus': '#0288d1',
    '--shadow': '0 1px 4px rgba(0,0,0,0.08)', '--shadow-window': '0 4px 20px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.1)',
  },

  'Comfort': {
    '--bg-app': '#1e1e2e', '--bg-desktop': '#232336', '--bg-panel': '#2a2a40',
    '--bg-surface': '#252540', '--bg-input': '#1a1a30',
    '--bg-titlebar': 'linear-gradient(180deg, #3a3a58 0%, #2e2e4a 40%, #2a2a40 100%)',
    '--bg-titlebar-inactive': 'linear-gradient(180deg, #303048 0%, #28283e 100%)',
    '--bg-menubar': '#262640', '--bg-toolbar': '#222238', '--bg-statusbar': '#1e1e2e',
    '--bg-row-hover': '#2e3558', '--bg-row-selected': '#2a3a60', '--bg-row-alt': '#262640',
    '--bg-row-even': '#2a2a40', '--bg-row-odd': '#262640',
    '--text-primary': '#cdd6f4', '--text-secondary': '#8890a8', '--text-muted': '#585870', '--text-bright': '#e8ecf4',
    '--buy': '#74c7ec', '--buy-bg': '#1a3a58', '--sell': '#f38ba8', '--sell-bg': '#5a2030',
    '--profit': '#a6e3a1', '--loss': '#f38ba8', '--unchanged': '#7f849c',
    '--accent': '#89b4fa', '--accent2': '#cba6f7',
    '--border': '#3a3a58', '--border-light': '#45455e', '--border-focus': '#89b4fa',
    '--shadow': '0 2px 8px rgba(0,0,0,0.3)', '--shadow-window': '0 4px 16px rgba(0,0,0,0.4), 0 0 1px rgba(137,180,250,0.1)',
  },

  'GETS Classic': {
    '--bg-app': '#0a0a18', '--bg-desktop': '#101020', '--bg-panel': '#14142a',
    '--bg-surface': '#18183a', '--bg-input': '#0c0c1a',
    '--bg-titlebar': 'linear-gradient(180deg, #2a2a50 0%, #1e1e3e 40%, #14142a 100%)',
    '--bg-titlebar-inactive': 'linear-gradient(180deg, #222240 0%, #1a1a30 100%)',
    '--bg-menubar': '#18182e', '--bg-toolbar': '#12122a', '--bg-statusbar': '#0a0a18',
    '--bg-row-hover': '#1e2848', '--bg-row-selected': '#1a3050', '--bg-row-alt': '#161630',
    '--bg-row-even': '#14142a', '--bg-row-odd': '#121225',
    '--text-primary': '#c8c8d8', '--text-secondary': '#7878a0', '--text-muted': '#4a4a68', '--text-bright': '#e8e8f0',
    '--buy': '#4CAF50', '--buy-bg': '#1a3a1e', '--sell': '#f44336', '--sell-bg': '#5a1515',
    '--profit': '#66bb6a', '--loss': '#ef5350', '--unchanged': '#808080',
    '--accent': '#ffd700', '--accent2': '#ff9800',
    '--border': '#28284a', '--border-light': '#38385a', '--border-focus': '#ffd700',
    '--shadow': '0 2px 8px rgba(0,0,0,0.5)', '--shadow-window': '0 4px 16px rgba(0,0,0,0.6), 0 0 1px rgba(255,215,0,0.1)',
  },
}

export const THEME_NAMES = Object.keys(THEMES)

export const THEME_META = {
  'ODIN Classic': { desc: 'Navy dark theme matching ODIN Diet terminal', icon: '🔷', colors: ['#0d0d1a','#00bcd4','#1565C0','#C62828'] },
  'Dark Pro': { desc: 'Pure black Bloomberg-style professional', icon: '⬛', colors: ['#08080c','#00e5ff','#2196F3','#f44336'] },
  'Light': { desc: 'Clean white Zerodha-style bright workspace', icon: '⬜', colors: ['#f0f2f5','#0288d1','#1976D2','#d32f2f'] },
  'Comfort': { desc: 'Catppuccin soft pastel — easy on the eyes', icon: '🟣', colors: ['#1e1e2e','#89b4fa','#74c7ec','#f38ba8'] },
  'GETS Classic': { desc: 'GETS terminal — gold accent, green buy', icon: '🟡', colors: ['#0a0a18','#ffd700','#4CAF50','#f44336'] },
}

/** Apply theme by setting CSS variables on document root */
export function applyTheme(themeName) {
  const vars = THEMES[themeName]
  if (!vars) return
  const root = document.documentElement
  Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val))
  localStorage.setItem('lightz-theme', themeName)
}

/** Load saved theme on startup */
export function loadSavedTheme() {
  const saved = localStorage.getItem('lightz-theme')
  if (saved && THEMES[saved]) applyTheme(saved)
}
