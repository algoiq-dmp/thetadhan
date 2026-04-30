import { useState, useEffect } from 'react';
import engineConnector from '../services/engineConnector';
import talkOptionsService from '../services/talkOptionsService';

export default function ConnectionPanel() {
  const [engines, setEngines] = useState(engineConnector.getEngineStates());
  const [checking, setChecking] = useState(false);
  const [toStatus, setToStatus] = useState(talkOptionsService.getStatus());
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setUptime(u => u + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const runHealthCheck = async () => {
    setChecking(true);
    await engineConnector.checkAllHealth();
    setEngines(engineConnector.getEngineStates());
    setToStatus(talkOptionsService.getStatus());
    setChecking(false);
  };

  const overall = engineConnector.getOverallStatus();
  const healthy = engines.filter(e => e.status === 'healthy').length;
  const down = engines.filter(e => e.status === 'down').length;

  const statusColor = (s) => s === 'healthy' ? '#10b981' : s === 'degraded' ? '#f59e0b' : s === 'down' ? '#ef4444' : '#475569';
  const statusIcon = (s) => s === 'healthy' ? '🟢' : s === 'degraded' ? '🟡' : s === 'down' ? '🔴' : '⚪';

  const fmtTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div style={{ padding: 8, fontSize: 11, color: '#e2e8f0' }}>
      {/* System Overview */}
      <div style={{
        padding: '10px 12px', borderRadius: 8, marginBottom: 8,
        background: `rgba(${overall === 'healthy' ? '16,185,129' : overall === 'degraded' ? '245,158,11' : '239,68,68'},0.08)`,
        border: `1px solid rgba(${overall === 'healthy' ? '16,185,129' : overall === 'degraded' ? '245,158,11' : '239,68,68'},0.2)`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>SYSTEM STATUS</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: statusColor(overall) }}>
              {overall.toUpperCase()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#64748b' }}>Uptime</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>{fmtTime(uptime)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 9, color: '#94a3b8' }}>
          <span>🟢 {healthy} Healthy</span>
          <span>🔴 {down} Down</span>
          <span>⚪ {engines.length - healthy - down} Unknown</span>
        </div>
      </div>

      {/* Check Button */}
      <button onClick={runHealthCheck} disabled={checking} style={{
        width: '100%', height: 28, borderRadius: 6, border: 'none', marginBottom: 8,
        background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff',
        fontSize: 10, fontWeight: 700, cursor: 'pointer',
      }}>
        {checking ? '⏳ Checking All Engines...' : '🔍 Run Health Check'}
      </button>

      {/* Engine List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {engines.map(e => (
          <div key={e.key} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6,
            background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2a3a',
          }}>
            <span style={{ fontSize: 16 }}>{e.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#f8fafc' }}>{e.name}</div>
              <div style={{ fontSize: 8, color: '#64748b' }}>
                {e.purpose} {e.port ? `• :${e.port}` : '• External'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10 }}>{statusIcon(e.status)}</div>
              {e.latency != null && (
                <div style={{ fontSize: 8, color: e.latency > 200 ? '#f59e0b' : '#64748b', fontFamily: 'JetBrains Mono' }}>
                  {e.latency}ms
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* TalkOptions Status */}
      <div style={{
        marginTop: 8, padding: '8px 10px', borderRadius: 6,
        background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)',
      }}>
        <div style={{ fontSize: 9, color: '#8b5cf6', fontWeight: 700, marginBottom: 4 }}>🧠 TalkOptions Session</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#94a3b8' }}>
          <span>Status: {toStatus.connected ? '🟢 Connected' : '⚪ Not Connected'}</span>
          {toStatus.tokenExpiresIn > 0 && <span>Token: {toStatus.tokenExpiresIn}min left</span>}
        </div>
      </div>

      {/* Feed Status */}
      <div style={{
        marginTop: 6, padding: '8px 10px', borderRadius: 6,
        background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)',
      }}>
        <div style={{ fontSize: 9, color: '#06b6d4', fontWeight: 700, marginBottom: 4 }}>📡 TalkDelta Feed</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#94a3b8' }}>
          <span>Feed: ⚪ Disconnected</span>
          <span>Mode: IBT/WebSocket</span>
        </div>
      </div>
    </div>
  );
}
