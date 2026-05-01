import { create } from 'zustand'
import engineConnector from '../../services/engineConnector'

// Load saved workspaces from localStorage
const loadSavedWorkspaces = () => {
  try { return JSON.parse(localStorage.getItem('lightz-workspaces') || '{}') } catch { return {} }
}
const loadLastWorkspaceName = () => localStorage.getItem('lightz-last-workspace') || 'Standard Trading'

const useAppStore = create((set, get) => ({
  // Auth
  loggedIn: false,
  user: null,
  login: (userId) => {
    set({ loggedIn: true, user: { id: userId, name: localStorage.getItem('dhan_client_name') || userId.toUpperCase(), role: 'DEALER' } })
    // Auto-connect to Dhan data after login
    get().connectDhan()
  },
  logout: () => {
    get().stopPolling()
    localStorage.removeItem('dhan_token')
    localStorage.removeItem('dhan_client_id')
    localStorage.removeItem('dhan_client_name')
    set({ loggedIn: false, user: null, symbols: [], orders: [], positions: [], trades: [], messages: [] })
  },

  // ── Market Data — LIVE from Dhan ──
  symbols: [],
  orders: [],
  positions: [],
  trades: [],
  messages: [],
  _pollTimer: null,
  _dataLoaded: false,

  // Connect and load initial data
  connectDhan: async () => {
    if (get()._dataLoaded) return
    try {
      // Load F&O universe symbols
      const universe = await engineConnector.fetchUniverse()
      const syms = universe.map((inst, i) => ({
        token: inst.token || i + 1,
        symbol: inst.symbol,
        exchange: 'NSE',
        instrument: inst.type || 'FUTIDX',
        ltp: 0, chg: 0, chgP: 0,
        open: 0, high: 0, low: 0, close: 0,
        bid: 0, bidQty: 0, ask: 0, askQty: 0,
        vol: 0, oi: 0, oiChg: 0,
        atp: 0, ltq: 0, totalBuyQty: 0, totalSellQty: 0,
        upperCkt: 0, lowerCkt: 0, w52High: 0, w52Low: 0,
        expiry: inst.expiryDate || '', strikePrice: inst.strike || '',
        optionType: inst.callPut || '', lotSize: inst.lotSize || 1,
        turnover: 0, type: inst.type || 'EQ',
        exchange_segment: inst.exchange_segment,
        securityId: inst.token,
      }))
      set({ symbols: syms, _dataLoaded: true })
      
      // Add system message
      get().addMessage('system', `✓ Loaded ${syms.length} instruments from Dhan`)

      // Start LTP polling
      get().startPolling()

      // Load orders, positions, trades
      get().loadPortfolio()
    } catch (err) {
      get().addMessage('system', `✗ Failed to load instruments: ${err.message}`)
    }
  },

  // Poll LTP every 3 seconds
  startPolling: () => {
    const existing = get()._pollTimer
    if (existing) clearInterval(existing)

    const poll = async () => {
      const { symbols } = get()
      if (symbols.length === 0) return

      try {
        // Build instrument map for Dhan API (batch LTP)
        // Dhan expects { NSE_FNO: [secId1, secId2, ...], IDX_I: [...] }
        const instMap = {}
        symbols.forEach(s => {
          const seg = s.exchange_segment || 'NSE_FNO'
          if (!instMap[seg]) instMap[seg] = []
          if (instMap[seg].length < 50) instMap[seg].push(String(s.securityId || s.token))
        })

        const ltpData = await engineConnector.getLTP(instMap)
        if (!ltpData) return

        // Merge LTP data into symbols
        set(state => ({
          symbols: state.symbols.map(s => {
            const seg = s.exchange_segment || 'NSE_FNO'
            const quote = ltpData?.[seg]?.[String(s.securityId || s.token)]
            if (!quote) return s
            const ltp = quote.last_price || quote.ltp || 0
            const prevClose = quote.close || s.close || ltp
            const chg = prevClose ? ltp - prevClose : 0
            const chgP = prevClose ? (chg / prevClose) * 100 : 0
            return {
              ...s,
              ltp,
              chg: chg,
              chgP: chgP,
              open: quote.open || s.open,
              high: quote.high || s.high,
              low: quote.low || s.low,
              close: prevClose,
              vol: quote.volume || s.vol,
              oi: quote.oi || s.oi,
            }
          })
        }))
      } catch { /* silently retry next cycle */ }
    }

    poll() // First poll immediately
    const timer = setInterval(poll, 3000)
    set({ _pollTimer: timer })
  },

  stopPolling: () => {
    const timer = get()._pollTimer
    if (timer) { clearInterval(timer); set({ _pollTimer: null }) }
  },

  // Load orders, positions, trades from Dhan
  loadPortfolio: async () => {
    try {
      const [rawOrders, rawTrades, rawPositions] = await Promise.all([
        engineConnector.getOrders(),
        engineConnector.getTrades(),
        engineConnector.getPositions()
      ])

      // Map Dhan orders → ODIN format
      const orders = (Array.isArray(rawOrders) ? rawOrders : []).map((o, i) => ({
        id: i + 1,
        time: o.updateTime || o.createTime || '',
        symbol: o.tradingSymbol || o.customSymbol || o.securityId,
        exchange: (o.exchangeSegment || '').replace('_FNO', '').replace('_EQ', '') || 'NSE',
        side: o.transactionType || '',
        qty: o.quantity || 0,
        price: o.price || 0,
        filled: o.filledQty || 0,
        pending: (o.quantity || 0) - (o.filledQty || 0),
        status: o.orderStatus || '',
        product: o.productType || '',
        orderType: o.orderType || '',
        triggerPrice: o.triggerPrice || '',
        avgPrice: o.averageTradedPrice || 0,
        orderNo: o.orderId || '',
        remarks: o.omsErrorDescription || '',
      }))

      // Map Dhan trades → ODIN format
      const trades = (Array.isArray(rawTrades) ? rawTrades : []).map((t, i) => ({
        id: i + 1,
        time: t.exchangeTime || t.updateTime || '',
        symbol: t.tradingSymbol || t.customSymbol || t.securityId,
        exchange: (t.exchangeSegment || '').replace('_FNO', '').replace('_EQ', '') || 'NSE',
        side: t.transactionType || '',
        qty: t.tradedQuantity || 0,
        price: t.tradedPrice || 0,
        orderId: t.orderId || '',
        tradeId: t.exchangeTradeId || '',
        product: t.productType || '',
      }))

      // Map Dhan positions → ODIN format
      const positions = (Array.isArray(rawPositions) ? rawPositions : []).map(p => ({
        symbol: p.tradingSymbol || p.customSymbol || p.securityId,
        exchange: (p.exchangeSegment || '').replace('_FNO', '').replace('_EQ', '') || 'NSE',
        product: p.productType || '',
        netQty: p.netQty || 0,
        buyQty: p.buyQty || p.dayBuyQty || 0,
        buyAvg: p.buyAvg || p.dayBuyPrice || 0,
        sellQty: p.sellQty || p.daySellQty || 0,
        sellAvg: p.sellAvg || p.daySellPrice || 0,
        ltp: p.lastTradedPrice || 0,
        pnl: p.unrealizedProfit || p.realizedProfit || 0,
        realizedPnl: p.realizedProfit || 0,
        buyVal: p.buyQty * (p.buyAvg || 0),
        sellVal: p.sellQty * (p.sellAvg || 0),
        securityId: p.securityId,
        exchangeSegment: p.exchangeSegment,
      }))

      set({ orders, trades, positions })
      
      if (orders.length > 0) get().addMessage('system', `✓ Loaded ${orders.length} orders, ${trades.length} trades, ${positions.length} positions`)
    } catch (err) {
      get().addMessage('system', `Portfolio load error: ${err.message}`)
    }
  },

  // Refresh portfolio data (orders/positions/trades)
  refreshPortfolio: () => get().loadPortfolio(),

  // Add live message
  addMessage: (type, text) => {
    const now = new Date().toLocaleTimeString('en-IN', { hour12: false })
    set(s => ({
      messages: [...s.messages.slice(-50), { time: now, type, msg: text, text }]
    }))
  },

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

  cascadeWindows: () => set(s => ({
    windows: s.windows.map((w, i) => ({
      ...w, x: 20 + i * 30, y: 20 + i * 30, w: 700, h: 400, maximized: false
    }))
  })),

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

  saveWorkspaceAs: (name) => {
    const { windows, savedWorkspaces } = get()
    const ws = windows.map(w => ({ id: w.id, x: w.x, y: w.y, w: w.w, h: w.h }))
    const updated = { ...savedWorkspaces, [name]: ws }
    localStorage.setItem('lightz-workspaces', JSON.stringify(updated))
    localStorage.setItem('lightz-last-workspace', name)
    set({ savedWorkspaces: updated, currentWorkspace: name })
  },

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

  deleteWorkspace: (name) => {
    const { savedWorkspaces } = get()
    const updated = { ...savedWorkspaces }
    delete updated[name]
    localStorage.setItem('lightz-workspaces', JSON.stringify(updated))
    set({ savedWorkspaces: updated })
  },

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
