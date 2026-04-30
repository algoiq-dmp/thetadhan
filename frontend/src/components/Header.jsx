import { useState, useEffect } from 'react';
import useMarketStore from '../store/useMarketStore';
import useAuthStore from '../store/useAuthStore';
import useSocket from '../hooks/useSocket';

export default function Header({ searchRef, onOpenEngineSettings, onOpenHelp }) {
  const { theme, engines } = useMarketStore();
  const toggleTheme = useMarketStore(s => s.toggleTheme);
  const toggleFullscreen = useMarketStore(s => s.toggleFullscreen);
  const toggleQuickFire = useMarketStore(s => s.toggleQuickFire);
  const toggleSettings = useMarketStore(s => s.toggleSettings);
  const setActivePanel = useMarketStore(s => s.setActivePanel);
  const activePanel = useMarketStore(s => s.activePanel);
  const showQuickFire = useMarketStore(s => s.showQuickFire);
  const user = useAuthStore(s => s.user);
  const dhanConnected = useAuthStore(s => s.dhanConnected);
  const dhanClientName = useAuthStore(s => s.dhanClientName);
  const logout = useAuthStore(s => s.logout);
  const { connected: backendConnected } = useSocket();

  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const isMarketOpen = () => {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes();
    return (h > 9 || (h === 9 && m >= 15)) && (h < 15 || (h === 15 && m <= 30));
  };

  const engineList = Object.entries(engines);

  return (
    <header className="app-header">
      <div className="logo">
        <span className="logo-icon">⚡</span>
        <span className="logo-text">ThetaDhan</span>
        <div className={`market-badge ${isMarketOpen() ? 'live' : 'closed'}`}>
          <span className="pulse" />
          {isMarketOpen() ? 'LIVE' : 'CLOSED'}
        </div>
      </div>

      <div className="header-center">
        <div className="engine-dots" title="Engine Status">
          <span className={`engine-dot ${dhanConnected ? 'connected' : 'error'}`} title={`Dhan: ${dhanConnected ? `Connected — ${dhanClientName}` : 'Not Connected'}`} style={{ boxShadow: dhanConnected ? '0 0 6px #10b981' : '0 0 6px #ef4444' }} />
          <span className={`engine-dot ${backendConnected ? 'connected' : 'error'}`} title={`Feed Relay: ${backendConnected ? 'Connected' : 'Offline'}`} style={{ boxShadow: backendConnected ? '0 0 6px #06b6d4' : '0 0 6px #ef4444' }} />
          {engineList.map(([name, status]) => (
            <span key={name} className={`engine-dot ${status}`} title={`${name}: ${status}`} />
          ))}
        </div>
      </div>

      <div className="header-right">
        <button className={`icon-btn${activePanel === 'scanners' ? ' active' : ''}`} onClick={() => setActivePanel('scanners')} title="Scanner (F9)">🔍</button>
        <button className={`icon-btn${activePanel === 'positions' ? ' active' : ''}`} onClick={() => setActivePanel('positions')} title="Positions (F7)">📊</button>
        <button className={`icon-btn${showQuickFire ? ' active' : ''}`} onClick={toggleQuickFire} title="Quick Fire (⚡)">⚡</button>
        <div className="separator" />
        <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme (D)">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="icon-btn" onClick={toggleFullscreen} title="Fullscreen (F11)">⛶</button>
        <button className="icon-btn" onClick={toggleSettings} title="Settings (F12)">⚙️</button>
        <button className="icon-btn" onClick={onOpenEngineSettings} title="Engine Credentials">🔑</button>
        <button className="icon-btn" onClick={onOpenHelp} title="Help (?)">❓</button>
        <div className="separator" />
        {dhanClientName && <span className="clock" style={{ color: '#10b981', marginRight: 8, fontSize: 10 }}>⚡ {dhanClientName}</span>}
        <span className="clock">{clock}</span>
        <button className="icon-btn" onClick={logout} title="Logout" style={{ color: '#ef4444', marginLeft: 4 }}>🔓</button>
      </div>
    </header>
  );
}
