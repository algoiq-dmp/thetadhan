import { create } from 'zustand'
import { MOCK_SYMBOLS, MOCK_ORDERS, MOCK_POSITIONS, MOCK_TRADES, MOCK_MESSAGES } from '../mock/data'

// Load saved workspaces from localStorage
const loadSavedWorkspaces = () => {
  try { return JSON.parse(localStorage.getItem('lightz-workspaces') || '{}') } catch { return {} }
}
const loadLastWorkspaceName = () => localStorage.getItem('lightz-last-workspace') || 'Standard Trading'

const useAppStore = create((set, get) => ({
  // Auth
  loggedIn: false,
  user: null,
  login: (userId) => set({ loggedIn: true, user: { id: userId, name: userId.toUpperCase(), role: 'DEALER' } }),
  logout: () => set({ loggedIn: false, user: null }),

  // Market Data
  symbols: MOCK_SYMBOLS,
  orders: MOCK_ORDERS,
  positions: MOCK_POSITIONS,
  trades: MOCK_TRADES,
  messages: MOCK_MESSAGES,

  // Selected symbol
  selectedToken: null,
  setSelectedToken: (token) => set({ selectedToken: token }),
  getSelectedSymbol: () => get().symbols.find(s => s.token === get().selectedToken),

  // MDI Windows
  windows: [],
  nextZ: 100,
  focusedId: null,

  openWindow: (config) => {
    const { windows, nextZ } = get()
    const existing = windows.find(w => w.id === config.id)
    if (existing) {
      set({ focusedId: config.id })
      return
    }
    set({
      windows: [...windows, { ...config, z: nextZ, minimized: false, maximized: false }],
      nextZ: nextZ + 1,
      focusedId: config.id,
    })
  },

  closeWindow: (id) => set(s => ({ windows: s.windows.filter(w => w.id !== id) })),

  closeAllWindows: () => set({ windows: [], focusedId: null }),

  focusWindow: (id) => set(s => ({
    focusedId: id,
    nextZ: s.nextZ + 1,
    windows: s.windows.map(w => w.id === id ? { ...w, z: s.nextZ } : w),
  })),

  minimizeWindow: (id) => set(s => ({
    windows: s.windows.map(w => w.id === id ? { ...w, minimized: !w.minimized } : w),
  })),

  maximizeWindow: (id) => set(s => ({
    windows: s.windows.map(w => w.id === id ? { ...w, maximized: !w.maximized } : w),
  })),

  moveWindow: (id, x, y) => set(s => ({
    windows: s.windows.map(w => w.id === id ? { ...w, x, y } : w),
  })),

  resizeWindow: (id, w, h) => set(s => ({
    windows: s.windows.map(win => win.id === id ? { ...win, w: Math.max(280, w), h: Math.max(180, h) } : win),
  })),

  // === Workspace Management ===
  currentWorkspace: loadLastWorkspaceName(),
  savedWorkspaces: loadSavedWorkspaces(),

  // Tile windows into standard trading layout
  tileStandard: (registry) => {
    const dw = window.innerWidth - 2
    const dh = window.innerHeight - 110 // menu + toolbar + ticker + status
    const mwW = Math.floor(dw * 0.58)
    const rW = dw - mwW
    const topH = Math.floor(dh * 0.65)
    const botH = dh - topH
    const layout = [
      { id: 'mw', x: 0, y: 0, w: mwW, h: topH },
      { id: 'ob', x: mwW, y: 0, w: rW, h: Math.floor(topH * 0.50) },
      { id: 'tb', x: mwW, y: Math.floor(topH * 0.50), w: rW, h: Math.floor(topH * 0.50) },
      { id: 'np', x: 0, y: topH, w: Math.floor(dw * 0.55), h: botH },
      { id: 'msg', x: Math.floor(dw * 0.55), y: topH, w: dw - Math.floor(dw * 0.55), h: botH },
    ]
    const { openWindow } = get()
    layout.forEach(l => {
      const reg = registry[l.id]
      if (reg) openWindow({ id: l.id, ...reg, x: l.x, y: l.y, w: l.w, h: l.h })
    })
  },

  // Cascade all open windows
  cascadeWindows: () => set(s => ({
    windows: s.windows.map((w, i) => ({
      ...w, x: 20 + i * 30, y: 20 + i * 30, w: 700, h: 400, maximized: false
    }))
  })),

  // Tile horizontally
  tileHorizontal: () => set(s => {
    const count = s.windows.length
    if (count === 0) return {}
    const dw = window.innerWidth - 2
    const dh = window.innerHeight - 110
    const h = Math.floor(dh / count)
    return {
      windows: s.windows.map((w, i) => ({
        ...w, x: 0, y: i * h, w: dw, h, maximized: false
      }))
    }
  }),

  // Tile vertically
  tileVertical: () => set(s => {
    const count = s.windows.length
    if (count === 0) return {}
    const dw = window.innerWidth - 2
    const dh = window.innerHeight - 110
    const w = Math.floor(dw / count)
    return {
      windows: s.windows.map((win, i) => ({
        ...win, x: i * w, y: 0, w, h: dh, maximized: false
      }))
    }
  }),

  // Save current layout as named workspace
  saveWorkspaceAs: (name) => {
    const { windows, savedWorkspaces } = get()
    const ws = windows.map(w => ({ id: w.id, x: w.x, y: w.y, w: w.w, h: w.h }))
    const updated = { ...savedWorkspaces, [name]: ws }
    localStorage.setItem('lightz-workspaces', JSON.stringify(updated))
    localStorage.setItem('lightz-last-workspace', name)
    set({ savedWorkspaces: updated, currentWorkspace: name })
  },

  // Load named workspace
  loadWorkspaceByName: (name, registry) => {
    const { savedWorkspaces, openWindow } = get()
    const ws = savedWorkspaces[name]
    if (!ws) return
    set({ windows: [], focusedId: null })
    setTimeout(() => {
      ws.forEach(w => {
        const reg = registry[w.id]
        if (reg) openWindow({ id: w.id, ...reg, x: w.x, y: w.y, w: w.w, h: w.h })
      })
      localStorage.setItem('lightz-last-workspace', name)
      set({ currentWorkspace: name })
    }, 50)
  },

  // Delete workspace
  deleteWorkspace: (name) => {
    const { savedWorkspaces } = get()
    const updated = { ...savedWorkspaces }
    delete updated[name]
    localStorage.setItem('lightz-workspaces', JSON.stringify(updated))
    set({ savedWorkspaces: updated })
  },

  // Auto-save current layout (called on window move/resize/close)
  autoSaveLayout: () => {
    const { windows, currentWorkspace } = get()
    const ws = windows.map(w => ({ id: w.id, x: w.x, y: w.y, w: w.w, h: w.h }))
    localStorage.setItem('lightz-autosave', JSON.stringify(ws))
  },

  // Exchange status
  exchanges: [
    { name: 'NSE', connected: true },
    { name: 'BSE', connected: true },
    { name: 'MCX', connected: false },
  ],
}))

export default useAppStore
