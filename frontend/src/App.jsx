import React, { useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useDhanFeed } from './hooks/useDhanFeed';
import { Settings, LogOut, Zap } from 'lucide-react';
import { MarketGrid } from './components/MarketGrid';
import { SettingsPanel } from './components/settings/SettingsPanel';

export default function App() {
  const { token, clientName, logout } = useAuthStore();
  const { status } = useDhanFeed();
  const [showSettings, setShowSettings] = useState(!token);

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white flex flex-col font-sans">
      {/* ─── Header ─── */}
      <header className="h-12 bg-[#131722] border-b border-[#2a2e39] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Zap size={18} className="text-yellow-500" />
          <span className="font-bold tracking-wide">ThetaDhan</span>
          <div className="h-4 w-px bg-[#2a2e39] mx-2"></div>
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-gray-400 capitalize">{status}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {token ? (
            <>
              <div className="text-sm text-gray-300">
                Welcome, <span className="text-white font-medium">{clientName || 'Trader'}</span>
              </div>
              <button 
                onClick={() => setShowSettings(true)}
                className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-[#2a2e39] transition-colors"
              >
                <Settings size={18} />
              </button>
              <button 
                onClick={logout}
                className="p-1.5 text-gray-400 hover:text-red-400 rounded hover:bg-[#2a2e39] transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setShowSettings(true)}
              className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors"
            >
              Login required
            </button>
          )}
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex overflow-hidden relative">
        {token ? (
          <MarketGrid />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Please log in via Settings to view market data.
          </div>
        )}
      </main>

      {/* ─── Modals ─── */}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
