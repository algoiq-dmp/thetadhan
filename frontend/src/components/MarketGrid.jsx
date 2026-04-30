import React, { useEffect, useState } from 'react';
import { useMarketStore } from '../store/useMarketStore';
import { useDhanFeed } from '../hooks/useDhanFeed';
import { Search, Filter, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { dhanApi } from '../lib/dhanApi';

export function MarketGrid() {
  const { universe, marketData, selectedSector, setUniverse, setSector } = useMarketStore();
  const { subscribe, status } = useDhanFeed();
  const [loading, setLoading] = useState(true);

  // Load universe on mount
  useEffect(() => {
    async function fetchFno() {
      try {
        setLoading(true);
        const res = await dhanApi.getFnoInstruments();
        if (res.success) {
          setUniverse(res.instruments);
          
          // Subscribe to live feed for all
          const subscribeList = res.instruments.map(inst => ({
            exchange: inst.exchange_segment,
            securityId: inst.security_id
          }));
          
          if (subscribeList.length > 0) {
            subscribe(subscribeList);
          }
        }
      } catch (err) {
        console.error("Failed to load universe", err);
      } finally {
        setLoading(false);
      }
    }
    
    // Only fetch if empty
    if (universe.length === 0) {
      fetchFno();
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter universe
  const filteredUniverse = universe.filter(inst => {
    if (selectedSector === 'All') return true;
    // In a real app we'd map symbols to sectors. For now, simple matching.
    return true; 
  });

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Loading F&O Universe...</div>;
  }

  if (universe.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
        <DatabaseWarning />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0a0b0d]">
      
      {/* ─── Toolbar ─── */}
      <div className="h-12 border-b border-[#2a2e39] flex items-center px-4 gap-4 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search symbol..."
            className="bg-[#1e222d] border border-[#2a2e39] rounded pl-8 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 w-64"
          />
        </div>

        <div className="h-5 w-px bg-[#2a2e39]"></div>

        <div className="flex gap-2">
          {['All', 'NIFTY50', 'BANKNIFTY', 'IT'].map(sector => (
            <button 
              key={sector}
              onClick={() => setSector(sector)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedSector === sector ? 'bg-blue-600/20 text-blue-400 font-medium border border-blue-500/30' : 'bg-[#1e222d] text-gray-400 border border-transparent hover:text-white'
              }`}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Grid Header ─── */}
      <div className="flex text-xs font-medium text-gray-400 uppercase bg-[#131722] border-b border-[#2a2e39] sticky top-0 z-10 px-4 py-2">
        <div className="w-10">#</div>
        <div className="w-40 flex-1">Symbol</div>
        <div className="w-24 text-right">LTP</div>
        <div className="w-24 text-right">Change</div>
        <div className="w-24 text-right">Chg %</div>
        <div className="w-24 text-right">Volume</div>
        <div className="w-24 text-right">OI</div>
        <div className="w-24 text-center">Actions</div>
      </div>

      {/* ─── Grid Body ─── */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {filteredUniverse.map((inst, idx) => {
          const key = String(inst.security_id);
          const tick = marketData[key] || {};
          const isUp = tick.change > 0;
          const isDown = tick.change < 0;

          return (
            <div key={key} className="flex items-center text-sm py-1.5 px-2 border-b border-[#2a2e39]/50 hover:bg-[#1e222d] transition-colors group">
              <div className="w-10 text-gray-500 text-xs">{idx + 1}</div>
              <div className="w-40 flex-1 font-medium text-gray-200">
                {inst.symbol}
                <span className="text-[10px] text-gray-500 ml-2 border border-[#2a2e39] px-1 rounded">{inst.lot_size}</span>
              </div>
              
              <div className={`w-24 text-right font-mono font-medium ${isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-gray-300'}`}>
                {tick.ltp ? tick.ltp.toFixed(2) : '-'}
              </div>
              
              <div className={`w-24 text-right font-mono ${isUp ? 'text-green-400/80' : isDown ? 'text-red-400/80' : 'text-gray-500'}`}>
                {tick.change ? (isUp ? '+' : '') + tick.change.toFixed(2) : '-'}
              </div>
              
              <div className="w-24 text-right flex justify-end">
                {tick.changePct ? (
                  <span className={`px-1.5 py-0.5 rounded text-xs flex items-center gap-1 ${
                    isUp ? 'bg-green-500/10 text-green-400' : isDown ? 'bg-red-500/10 text-red-400' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {isUp ? <TrendingUp size={12}/> : isDown ? <TrendingDown size={12}/> : null}
                    {Math.abs(tick.changePct).toFixed(2)}%
                  </span>
                ) : '-'}
              </div>

              <div className="w-24 text-right text-gray-400 font-mono text-xs">
                {tick.volume ? (tick.volume / 1000).toFixed(1) + 'k' : '-'}
              </div>
              
              <div className="w-24 text-right text-gray-400 font-mono text-xs">
                {tick.oi ? (tick.oi / 1000).toFixed(1) + 'k' : '-'}
              </div>

              <div className="w-24 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                <button className="p-1 hover:bg-[#2a2e39] rounded text-blue-400" title="Option Chain">
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DatabaseWarning() {
  return (
    <div className="text-center max-w-md bg-yellow-900/20 border border-yellow-700/50 p-6 rounded-lg">
      <h3 className="text-yellow-500 font-medium text-lg mb-2">No Instruments Found</h3>
      <p className="text-yellow-500/80 text-sm mb-4">
        The Cloudflare D1 database has not been synced with the Dhan Scrip Master. 
        You need to run the initial sync to populate F&O symbols.
      </p>
      <div className="bg-black/40 rounded p-3 text-left">
        <code className="text-xs text-gray-300 block"># Run this command in terminal:</code>
        <code className="text-xs text-blue-400 font-mono">curl -X GET https://your-worker/api/instruments/sync</code>
        <div className="text-[10px] text-gray-500 mt-2">
          (Note: Sync route must be triggered to download the 20MB CSV)
        </div>
      </div>
    </div>
  );
}
