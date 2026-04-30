import { create } from 'zustand';

export const useMarketStore = create((set, get) => ({
  universe: [],        // All loaded instruments
  marketData: {},      // Live tick data keyed by securityId: { "1333": { ltp: 2500, change: 10 } }
  watchlists: [],
  selectedSector: 'All',

  setUniverse: (instruments) => set({ universe: instruments }),
  
  // High performance update for binary ticks
  updateMarketData: (ticks) => {
    set((state) => {
      const updated = { ...state.marketData };
      let changed = false;
      
      for (const tick of ticks) {
        if (!tick || !tick.securityId) continue;
        const key = String(tick.securityId);
        
        updated[key] = {
          ...updated[key],
          ...tick,
          lastUpdated: Date.now()
        };
        changed = true;
      }
      
      return changed ? { marketData: updated } : state;
    });
  },

  setSector: (sector) => set({ selectedSector: sector }),
}));
