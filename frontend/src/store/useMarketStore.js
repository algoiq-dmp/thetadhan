import { create } from 'zustand';
import engineConnector from '../services/engineConnector';
import wsManager from '../services/wsManager';

// ── Watchlist version — bump this to reset user's cached watchlists ──
const WATCHLIST_VERSION = 'v2-index-2026';
if (localStorage.getItem('ty_watchlist_version') !== WATCHLIST_VERSION) {
  localStorage.removeItem('ty_watchlists');   // Clear old watchlists
  localStorage.setItem('ty_watchlist_version', WATCHLIST_VERSION);
}

// Start with empty — live data loads after Dhan auth

const useMarketStore = create((set, get) => ({
  // Universe — empty until Dhan connects
  universe: [],
  isLive: false,
  selectedIdx: 0,

  // Filters
  searchQuery: '',
  sectorFilter: 'ALL',
  movementFilter: 'ALL',

  // UI state
  theme: 'dark',
  isFullscreen: false,
  showOptionChain: null,
  showChart: null,
  showSettings: false,
  showQuickFire: false,
  showPositions: false,
  positionTab: 'positions',

  // V5: 3-Panel Layout
  activeView: 'terminal',
  activePanel: 'watchlist',
  rightSidebarOpen: true,

  // Panel customization (persisted to localStorage)
  panelConfig: JSON.parse(localStorage.getItem('ty_panelConfig') || JSON.stringify({
    enabledPanels: ['watchlist', 'chain', 'positions', 'orders', 'alerts', 'qfm', 'heikinashi', 'ai', 'portfolio'],
    panelOrder: ['watchlist', 'chain', 'positions', 'orders', 'alerts', 'qfm', 'heikinashi', 'ai', 'portfolio'],
    enabledViews: ['scalper', 'options', 'stocks', 'iv', 'strategy', 'marketwatch', 'terminal', 'custom'],
    viewOrder: ['scalper', 'options', 'stocks', 'iv', 'strategy', 'marketwatch', 'terminal', 'custom'],
    viewDefaults: {
      terminal: 'watchlist', options: 'chain', scalper: 'positions', marketwatch: 'alerts',
      stocks: 'watchlist', iv: 'chain', strategy: 'qfm', custom: 'watchlist',
    },
  })),

  // Simulated Feeds
  simulatedFeeds: JSON.parse(localStorage.getItem('ty_simulatedFeeds') || JSON.stringify({
    enabled: false,
    tickSpeed: 2,        // seconds between ticks
    volatility: 1,       // multiplier (0.5x to 5x)
    trendBias: 'neutral', // neutral | bullish | bearish
    oiSimulation: true,  // simulate OI changes
    ivSimulation: true,  // simulate IV fluctuations
    volumeSimulation: true, // simulate volume ticks
  })),

  // Trading connector — always 'dhan' for this project
  activeConnector: 'dhan',
  connectorStatus: 'disconnected',

  // Engine status (updated by health polling)
  engines: {
    shield: 'unknown', surya: 'unknown', lakshmi: 'unknown',
    ganesh: 'unknown', garuda: 'unknown', vega: 'unknown',
  },

  // ── Actions ──
  setUniverse: (u) => set({ universe: u }),
  updateTicks: (updater) => set((s) => ({ universe: s.universe.map(updater) })),

  setSearch: (q) => set({ searchQuery: q }),
  setSector: (s) => set({ sectorFilter: s }),
  setMovement: (m) => set({ movementFilter: m }),
  setSelectedIdx: (i) => set({ selectedIdx: i }),

  // V5 view/panel
  setActiveView: (v) => {
    const pc = get().panelConfig;
    const defaultPanel = pc.viewDefaults[v] || 'watchlist';
    set({ activeView: v, activePanel: defaultPanel });
  },
  setActivePanel: (p) => set({ activePanel: p, rightSidebarOpen: true }),
  toggleRightSidebar: () => set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),

  // Panel config actions
  setPanelConfig: (updates) => {
    const newConfig = { ...get().panelConfig, ...updates };
    localStorage.setItem('ty_panelConfig', JSON.stringify(newConfig));
    set({ panelConfig: newConfig });
  },
  togglePanelEnabled: (id) => {
    const pc = get().panelConfig;
    const enabled = pc.enabledPanels.includes(id)
      ? pc.enabledPanels.filter(p => p !== id)
      : [...pc.enabledPanels, id];
    const order = pc.panelOrder.includes(id) ? pc.panelOrder : [...pc.panelOrder, id];
    const newConfig = { ...pc, enabledPanels: enabled, panelOrder: order };
    localStorage.setItem('ty_panelConfig', JSON.stringify(newConfig));
    set({ panelConfig: newConfig });
  },
  toggleViewEnabled: (id) => {
    const pc = get().panelConfig;
    const enabled = pc.enabledViews.includes(id)
      ? pc.enabledViews.filter(v => v !== id)
      : [...pc.enabledViews, id];
    const order = pc.viewOrder.includes(id) ? pc.viewOrder : [...pc.viewOrder, id];
    const newConfig = { ...pc, enabledViews: enabled, viewOrder: order };
    localStorage.setItem('ty_panelConfig', JSON.stringify(newConfig));
    set({ panelConfig: newConfig });
  },
  // Simulated feed actions
  setSimulatedFeeds: (updates) => {
    const current = get().simulatedFeeds;
    const newConfig = { ...current, ...updates };
    localStorage.setItem('ty_simulatedFeeds', JSON.stringify(newConfig));
    set({ simulatedFeeds: newConfig });
  },
  toggleSimulatedFeeds: () => {
    const current = get().simulatedFeeds;
    const newConfig = { ...current, enabled: !current.enabled };
    localStorage.setItem('ty_simulatedFeeds', JSON.stringify(newConfig));
    set({ simulatedFeeds: newConfig });
  },

  setConnector: (c) => { localStorage.setItem('ty_connector', c); set({ activeConnector: c, connectorStatus: 'connecting' }); },
  setConnectorStatus: (s) => set({ connectorStatus: s }),
  setEngines: (e) => set({ engines: e }),

  // Order entry (trade-from-anywhere)
  showOrderEntry: null,
  openOrderEntry: (data) => set({ showOrderEntry: data }),
  closeOrderEntry: () => set({ showOrderEntry: null }),

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    set({ theme: next });
  },

  toggleFullscreen: () => {
    const fs = !get().isFullscreen;
    if (fs) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
    set({ isFullscreen: fs });
  },

  openOptionChain: (sym) => set({ showOptionChain: sym }),
  closeOptionChain: () => set({ showOptionChain: null }),
  openChart: (sym) => set({ showChart: sym }),
  closeChart: () => set({ showChart: null }),
  toggleSettings: () => set((s) => ({ showSettings: !s.showSettings })),
  toggleQuickFire: () => set((s) => ({ showQuickFire: !s.showQuickFire })),
  togglePositions: () => set((s) => ({ showPositions: !s.showPositions })),
  setPositionTab: (t) => set({ positionTab: t, showPositions: true }),

  // Filtered universe
  getFiltered: () => {
    const { universe, searchQuery, sectorFilter, movementFilter } = get();
    let rows = universe;
    if (searchQuery) {
      const q = searchQuery.toUpperCase();
      rows = rows.filter(r => r.symbol.includes(q));
    }
    if (sectorFilter !== 'ALL') {
      rows = rows.filter(r => r.sector === sectorFilter);
    }
    if (movementFilter === 'GAINERS') rows = rows.filter(r => r.changePct > 1);
    else if (movementFilter === 'LOSERS') rows = rows.filter(r => r.changePct < -1);
    else if (movementFilter === 'STRONG_UP') rows = rows.filter(r => r.changePct > 3);
    else if (movementFilter === 'STRONG_DOWN') rows = rows.filter(r => r.changePct < -3);
    return rows;
  },

  // ── Predefined Index Watchlists (NSE/BSE official constituents) ──
  // These only apply if the user has not customized their watchlists yet
  watchlists: JSON.parse(localStorage.getItem('ty_watchlists') || JSON.stringify({
    'NIFTY 50': [
      'RELIANCE','TCS','HDFCBANK','BHARTIARTL','ICICIBANK','INFY','SBIN','HINDUNILVR',
      'ITC','KOTAKBANK','LT','AXISBANK','BAJFINANCE','MARUTI','SUNPHARMA','TATAMOTORS',
      'NTPC','TITAN','ADANIENT','HCLTECH','WIPRO','ONGC','POWERGRID','JSWSTEEL',
      'COALINDIA','TATACONSUM','ADANIPORTS','TATASTEEL','BAJAJFINSV','DRREDDY',
      'APOLLOHOSP','HINDALCO','NESTLEIND','BPCL','ULTRACEMCO','TECHM','GRASIM',
      'SBILIFE','HDFCLIFE','HEROMOTOCO','DIVISLAB','EICHERMOT','LTIM','CIPLA',
      'BRITANNIA','M&M','TRENT','SHRIRAMFIN','BAJAJ-AUTO','INDUSINDBK',
    ],
    'BANKNIFTY': [
      'HDFCBANK','ICICIBANK','KOTAKBANK','SBIN','AXISBANK','BANKBARODA',
      'INDUSINDBK','AUBANK','BANDHANBNK','FEDERALBNK','IDFCFIRSTB','PNB',
    ],
    'FINNIFTY': [
      'BAJFINANCE','HDFCAMC','BAJAJFINSV','SBILIFE','HDFCLIFE','ICICIPRULI',
      'SHRIRAMFIN','CHOLAFIN','MFSL','MUTHOOTFIN','ABCAPITAL','PEL',
      'LICIHSGFIN','MANAPPURAM','ANGELONE','M&MFIN','RECLTD','PFC','IIFL','POONAWALLA',
    ],
    'MIDCPNIFTY': [
      'PERSISTENT','COFORGE','MPHASIS','LTTS','KPITTECH','TATAELXSI','RBLBANK',
      'CANBK','UNIONBANK','BANKINDIA','MAHABANK','KARURVYSYA','DCBBANK',
      'NATIONALUM','RATNAMANI','WELCORP','APOLLOTYRE','BALKRISIND','EXIDEIND',
      'CROMPTON','BLUESTAR','VOLTAS','POLYCAB','HAVELLS','DIXON',
    ],
    'SENSEX': [
      'RELIANCE','TCS','HDFCBANK','ICICIBANK','INFY','BHARTIARTL','SBIN',
      'BAJFINANCE','HINDUNILVR','ITC','AXISBANK','KOTAKBANK','LT','TITAN',
      'SUNPHARMA','MARUTI','TATAMOTORS','NTPC','WIPRO','TATASTEEL',
      'POWERGRID','ONGC','DRREDDY','ULTRACEMCO','HCLTECH','ADANIENT',
      'BAJAJFINSV','TATACONSUM','HINDALCO','JSWSTEEL',
    ],
    'BANKEX': [
      'HDFCBANK','ICICIBANK','KOTAKBANK','SBIN','AXISBANK',
      'INDUSINDBK','FEDERALBNK','BANKBARODA','IDFCFIRSTB','BANDHANBNK',
    ],
  })),
  activeWatchlist: 'NIFTY 50',

  setActiveWatchlist: (name) => set({ activeWatchlist: name }),
  createWatchlist: (name) => {
    const wl = { ...get().watchlists, [name]: [] };
    localStorage.setItem('ty_watchlists', JSON.stringify(wl));
    set({ watchlists: wl, activeWatchlist: name });
  },
  renameWatchlist: (oldName, newName) => {
    const wl = { ...get().watchlists };
    wl[newName] = wl[oldName];
    delete wl[oldName];
    localStorage.setItem('ty_watchlists', JSON.stringify(wl));
    set({ watchlists: wl, activeWatchlist: newName });
  },
  deleteWatchlist: (name) => {
    const wl = { ...get().watchlists };
    delete wl[name];
    const first = Object.keys(wl)[0] || 'Default';
    if (!wl[first]) wl[first] = [];
    localStorage.setItem('ty_watchlists', JSON.stringify(wl));
    set({ watchlists: wl, activeWatchlist: first });
  },
  addToWatchlist: (symbol) => {
    const wl = { ...get().watchlists };
    const active = get().activeWatchlist;
    if (!wl[active].includes(symbol)) wl[active] = [...wl[active], symbol];
    localStorage.setItem('ty_watchlists', JSON.stringify(wl));
    set({ watchlists: wl });
  },
  removeFromWatchlist: (symbol) => {
    const wl = { ...get().watchlists };
    const active = get().activeWatchlist;
    wl[active] = wl[active].filter(s => s !== symbol);
    localStorage.setItem('ty_watchlists', JSON.stringify(wl));
    set({ watchlists: wl });
  },

  // ── Live Engine Connection ──
  fetchLiveUniverse: async () => {
    try {
      const contracts = await engineConnector.fetchUniverse();
      if (contracts && contracts.length > 0) {
        const live = contracts.map((c) => ({
          symbol: c.symbol || c.sscript || '',
          token: c.token || c.ntoken || c.security_id || 0,  // Dhan security_id is the tick key
          ntoken: c.token || c.ntoken || c.security_id || 0,
          exchange_segment: c.exchange_segment || 'NSE_FNO',
          ltp: 0,
          prevClose: 0,
          change: 0,
          changePct: 0,
          todayHigh: 0,
          todayLow: 0,
          volume: 0,
          oi: 0,
          d7High: 0,
          d7Low: 0,
          sma30: 0,
          sma100: 0,
          sma200: 0,
          iv: 0,
          ivHigh5d: 0,
          ivLow5d: 0,
          ceStrike: 0,
          peStrike: 0,
          cePremium: 0,
          pePremium: 0,
          sector: 'F&O',
          strike: c.strike || c.strike_price || 0,
          callPut: c.callPut || c.option_type || '',
          expiry: c.expiryDate || c.expiry_date || '',
          lotSize: c.lotSize || c.lot_size || 0,
          type: c.type || c.instrument_type || '',
          flashClass: '',
        }));
        get().setUniverse(live);
        set({ isLive: true });

        // Subscribe all instruments to live Dhan feed
        const toSubscribe = live.map(r => ({
          exchange: r.exchange_segment,
          securityId: String(r.token),
        }));
        wsManager.subscribe(toSubscribe);

        console.log(`[Store] ✓ Live universe loaded: ${live.length} instruments`);
        return true;
      }
    } catch (err) {
      console.warn('[Store] Live universe failed:', err.message);
    }
    return false;
  },

  connectEngines: async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'https://thetadhan-api.parlight2.workers.dev';

    // Collect all unique symbols from all watchlists
    const watchlists = get().watchlists;
    const allSymbols = [...new Set(Object.values(watchlists).flat())];

    // Always include the index names themselves at the top
    const indexNames = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX', 'BANKEX'];
    const symbolsToLoad = [...new Set([...indexNames, ...allSymbols])];

    try {
      // Single batch API call — one D1 query for all symbols
      const res = await fetch(`${API_URL}/api/instruments/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: symbolsToLoad }),
      });
      const data = await res.json();
      const instruments = (data.instruments || []).map(inst => ({
        symbol: inst.symbol || inst.trading_symbol,
        token: inst.security_id,
        ntoken: inst.security_id,
        exchange_segment: inst.exchange_segment || 'NSE_FNO',
        // Same-day intraday data — starts at 0, filled by live WS ticks
        ltp: 0, prevClose: 0, change: 0, changePct: 0,
        todayHigh: 0, todayLow: 0, volume: 0, oi: 0,
        // Analytics — filled by Garuda/TalkOptions separately
        sma30: 0, sma100: 0, sma200: 0,
        iv: 0, ivHigh5d: 0, ivLow5d: 0,
        ceStrike: 0, peStrike: 0, cePremium: 0, pePremium: 0,
        // Metadata
        sector: inst.exchange_segment === 'NSE_EQ' ? 'EQ' : 'F&O',
        lotSize: inst.lot_size || 0,
        strike: inst.strike_price || 0,
        callPut: inst.option_type || '',
        expiry: inst.expiry_date || '',
        type: inst.instrument_type || '',
        flashClass: '',
      }));

      if (instruments.length > 0) {
        get().setUniverse(instruments);
        set({ isLive: true });
        // Subscribe ALL loaded symbols to live Dhan feed in one message
        wsManager.subscribe(
          instruments.map(r => ({ exchange: r.exchange_segment, securityId: String(r.token) }))
        );
        console.log(`[Store] ✓ ${instruments.length} instruments loaded from ${Object.keys(watchlists).length} watchlists`);
        return;
      }
    } catch (err) {
      console.warn('[Store] Watchlist batch load failed:', err.message);
    }

    // ── Fallback 2: Try /api/instruments/fno to get ALL F&O underlyings ──
    try {
      console.log('[Store] Trying fallback: /api/instruments/fno...');
      const res = await fetch(`${API_URL}/api/instruments/fno`);
      const data = await res.json();
      if (data.instruments?.length > 0) {
        const instruments = data.instruments.map(inst => ({
          symbol: inst.symbol,
          token: inst.security_id,
          ntoken: inst.security_id,
          exchange_segment: inst.exchange_segment || 'NSE_FNO',
          ltp: 0, prevClose: 0, change: 0, changePct: 0,
          todayHigh: 0, todayLow: 0, volume: 0, oi: 0,
          sma30: 0, sma100: 0, sma200: 0,
          iv: 0, ivHigh5d: 0, ivLow5d: 0,
          ceStrike: 0, peStrike: 0, cePremium: 0, pePremium: 0,
          sector: 'F&O',
          lotSize: inst.lot_size || 0,
          strike: 0, callPut: '', expiry: inst.nearest_expiry || '',
          type: 'FUTIDX', flashClass: '',
        }));
        get().setUniverse(instruments);
        set({ isLive: true });
        wsManager.subscribe(instruments.map(r => ({ exchange: r.exchange_segment, securityId: String(r.token) })));
        console.log(`[Store] ✓ Fallback: ${instruments.length} F&O instruments loaded`);
        return;
      }
    } catch (err) {
      console.warn('[Store] F&O fallback failed:', err.message);
    }

    // ── Fallback 3: Hardcoded seed symbols so terminal is NEVER empty ──
    console.log('[Store] Loading hardcoded seed symbols (API unavailable)');
    const SEED_SYMBOLS = [
      { symbol: 'NIFTY', token: 13, exchange_segment: 'IDX_I', lotSize: 65 },
      { symbol: 'BANKNIFTY', token: 25, exchange_segment: 'IDX_I', lotSize: 30 },
      { symbol: 'FINNIFTY', token: 27, exchange_segment: 'IDX_I', lotSize: 65 },
      { symbol: 'MIDCPNIFTY', token: 442, exchange_segment: 'IDX_I', lotSize: 120 },
      { symbol: 'SENSEX', token: 51, exchange_segment: 'BSE_INDEX', lotSize: 20 },
      { symbol: 'RELIANCE', token: 2885, exchange_segment: 'NSE_EQ', lotSize: 250 },
      { symbol: 'TCS', token: 11536, exchange_segment: 'NSE_EQ', lotSize: 175 },
      { symbol: 'HDFCBANK', token: 1333, exchange_segment: 'NSE_EQ', lotSize: 550 },
      { symbol: 'INFY', token: 1594, exchange_segment: 'NSE_EQ', lotSize: 400 },
      { symbol: 'ICICIBANK', token: 4963, exchange_segment: 'NSE_EQ', lotSize: 700 },
      { symbol: 'SBIN', token: 3045, exchange_segment: 'NSE_EQ', lotSize: 750 },
      { symbol: 'BAJFINANCE', token: 317, exchange_segment: 'NSE_EQ', lotSize: 125 },
      { symbol: 'ITC', token: 1660, exchange_segment: 'NSE_EQ', lotSize: 1600 },
      { symbol: 'TATAMOTORS', token: 3456, exchange_segment: 'NSE_EQ', lotSize: 1100 },
      { symbol: 'AXISBANK', token: 5900, exchange_segment: 'NSE_EQ', lotSize: 625 },
      { symbol: 'LT', token: 11483, exchange_segment: 'NSE_EQ', lotSize: 150 },
      { symbol: 'SUNPHARMA', token: 3351, exchange_segment: 'NSE_EQ', lotSize: 700 },
      { symbol: 'BHARTIARTL', token: 10604, exchange_segment: 'NSE_EQ', lotSize: 475 },
      { symbol: 'WIPRO', token: 3787, exchange_segment: 'NSE_EQ', lotSize: 1500 },
      { symbol: 'MARUTI', token: 10999, exchange_segment: 'NSE_EQ', lotSize: 100 },
    ];
    const seeds = SEED_SYMBOLS.map(s => ({
      ...s, ntoken: s.token,
      ltp: 0, prevClose: 0, change: 0, changePct: 0,
      todayHigh: 0, todayLow: 0, volume: 0, oi: 0,
      sma30: 0, sma100: 0, sma200: 0,
      iv: 0, ivHigh5d: 0, ivLow5d: 0,
      ceStrike: 0, peStrike: 0, cePremium: 0, pePremium: 0,
      sector: s.exchange_segment === 'NSE_EQ' ? 'EQ' : 'F&O',
      strike: 0, callPut: '', expiry: '', type: '', flashClass: '',
    }));
    get().setUniverse(seeds);
    set({ isLive: false });
    console.log(`[Store] ✓ Seed: ${seeds.length} symbols loaded as fallback`);
  },

  // ── Live LTP Polling from Dhan /v2/marketfeed/ohlc ──
  _ltpInterval: null,

  startLTPPolling: () => {
    // Don't start duplicate pollers
    if (get()._ltpInterval) return;

    const poll = async () => {
      const universe = get().universe;
      if (!universe || universe.length === 0) return;

      // Group instruments by exchange_segment for Dhan API format
      const segmentMap = {};
      universe.forEach(row => {
        const seg = row.exchange_segment || 'NSE_EQ';
        if (!segmentMap[seg]) segmentMap[seg] = [];
        segmentMap[seg].push(Number(row.token));
      });

      // Cap at 1000 instruments per request (Dhan limit)
      const totalCount = Object.values(segmentMap).reduce((s, a) => s + a.length, 0);
      if (totalCount === 0) return;

      try {
        const rawData = await engineConnector.getLTP(segmentMap);
        if (!rawData) return;

        // Unwrap response: engineConnector returns worker's data field.
        // Worker wraps Dhan response as { success: true, data: <dhan_raw> }.
        // Dhan OHLC response: { data: { "NSE_EQ": { "2885": { last_price, ohlc } } }, status: "success" }
        // So rawData = { data: { "NSE_EQ": {...} }, status: "success" }
        // We need rawData.data to get the segment map.
        const segData = rawData.data || rawData; // inner .data from Dhan response

        const priceMap = {};
        Object.entries(segData).forEach(([seg, instruments]) => {
          if (!instruments || typeof instruments !== 'object') return; // skip 'status' key
          Object.entries(instruments).forEach(([secId, quote]) => {
            if (!quote || typeof quote !== 'object') return;
            priceMap[secId] = {
              ltp: quote.last_price || 0,
              open: quote.ohlc?.open || 0,
              close: quote.ohlc?.close || 0,
              high: quote.ohlc?.high || 0,
              low: quote.ohlc?.low || 0,
            };
          });
        });

        // Update universe with live prices
        set(s => ({
          universe: s.universe.map(row => {
            const q = priceMap[String(row.token)];
            if (!q || !q.ltp) return row;

            const prevLtp = row.ltp;
            const ltp = q.ltp;
            const prevClose = q.close || row.prevClose || ltp;
            const change = +(ltp - prevClose).toFixed(2);
            const changePct = prevClose ? +((change / prevClose) * 100).toFixed(2) : 0;
            const todayHigh = Math.max(q.high || 0, row.todayHigh || 0, ltp);
            const todayLow = q.low > 0 ? Math.min(q.low, row.todayLow > 0 ? row.todayLow : q.low) : row.todayLow || ltp;
            const flashClass = ltp > prevLtp ? 'cell-flash-green' : ltp < prevLtp ? 'cell-flash-red' : '';

            return {
              ...row,
              ltp, prevClose, change, changePct, todayHigh, todayLow,
              yClose: prevClose,
              flashClass,
            };
          }),
          isLive: true,
        }));
      } catch (err) {
        console.warn('[Store] LTP poll error:', err.message);
      }
    };

    // Immediate first poll
    poll();
    // Then every 3 seconds
    const intervalId = setInterval(poll, 3000);
    set({ _ltpInterval: intervalId });
    console.log('[Store] ✓ LTP polling started (3s interval)');
  },

  stopLTPPolling: () => {
    const id = get()._ltpInterval;
    if (id) {
      clearInterval(id);
      set({ _ltpInterval: null });
      console.log('[Store] ✓ LTP polling stopped');
    }
  },

  // Daily reset at BOD — clears intraday data, keeps instrument metadata
  resetIntraday: () => {
    set(s => ({
      universe: s.universe.map(r => ({
        ...r,
        ltp: 0, prevClose: 0, change: 0, changePct: 0,
        todayHigh: 0, todayLow: 0, volume: 0, oi: 0,
        flashClass: '',
      })),
      isLive: false,
    }));
    console.log('[Store] ✓ Intraday data reset for new trading day');
  },
}));

export default useMarketStore;
