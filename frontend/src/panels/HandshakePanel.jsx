import { useState, useEffect, useRef } from 'react';
import shieldAuth from '../services/shieldAuth';
import wsManager from '../services/wsManager';
import { ENGINE_REGISTRY } from '../services/engineConnector';

export default function HandshakePanel() {
  const [status, setStatus] = useState(shieldAuth.getStatus());
  const [wsStatus, setWsStatus] = useState(wsManager.getStatus());
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);
  const logEndRef = useRef(null);

  useEffect(() => {
    const iv = setInterval(() => {
      setStatus(shieldAuth.getStatus());
      setWsStatus(wsManager.getStatus());
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    // Listen for live events
    const unsub1 = wsManager.on('engine-status', (data) => {
      setLiveEvents(prev => [{ type: 'engine', data, ts: Date.now() }, ...prev].slice(0, 20));
    });
    const unsub2 = wsManager.on('order-updates', (data) => {
      setLiveEvents(prev => [{ type: 'order', data, ts: Date.now() }, ...prev].slice(0, 20));
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const runHandshake = async () => {
    setRunning(true);
    setLogs([]);
    setLiveEvents([]);

    const engines = Object.values(ENGINE_REGISTRY).filter(e => e.port);

    const result = await shieldAuth.executeHandshake(wsManager, engines);
    setLogs([...shieldAuth.handshakeLog]);
    
    if (result.success) {
      wsManager.connect();
    }

    setStatus(shieldAuth.getStatus());
    setWsStatus(wsManager.getStatus());
    setRunning(false);
  };

  const disconnect = () => {
    wsManager.disconnect();
    setWsStatus(wsManager.getStatus());
    setLiveEvents([]);
  };

  const stepLabels = ['', '🛡️ Shield Auth', '🏥 Health Check', '📡 WS Subscribe', '💓 Heartbeat', '🟢 LIVE'];
  const stepColors = { success: '#10b981', warn: '#f59e0b', error: '#ef4444', info: '#06b6d4' };

  return (
    <div style={{ padding: 8, fontSize: 11, color: '#e2e8f0' }}>
      {/* Handshake Status */}
      <div style={{
        padding: '10px 12px', borderRadius: 8, marginBottom: 8,
        background: status.handshakeStep === 5 ? 'rgba(16,185,129,0.08)' : 'rgba(6,182,212,0.05)',
        border: `1px solid ${status.handshakeStep === 5 ? 'rgba(16,185,129,0.2)' : 'rgba(6,182,212,0.15)'}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>HANDSHAKE PROTOCOL</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: status.handshakeStep === 5 ? '#10b981' : '#06b6d4' }}>
              {status.handshakeStep === 5 ? '🟢 LIVE' : status.handshakeStep > 0 ? `Step ${status.handshakeStep}/5` : '⚪ IDLE'}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 9, color: '#64748b' }}>
            {status.tokenValid && <div>JWT: {status.tokenExpiresIn}m left</div>}
          </div>
        </div>

        {/* Step Progress */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: s <= status.handshakeStep ? (s === 5 ? '#10b981' : '#06b6d4') : '#1e2a3a',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#475569' }}>
          {stepLabels.slice(1).map((l, i) => (
            <span key={i} style={{ color: i + 1 <= status.handshakeStep ? '#94a3b8' : '#2d3a4a' }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button onClick={runHandshake} disabled={running} style={{
          flex: 2, height: 30, borderRadius: 6, border: 'none',
          background: running ? '#1e2a3a' : 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff',
          fontSize: 10, fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer',
        }}>
          {running ? '⏳ Handshaking...' : '🤝 Execute 5-Step Handshake'}
        </button>
        {wsStatus.connected && (
          <button onClick={disconnect} style={{
            flex: 1, height: 30, borderRadius: 6, border: '1px solid #ef4444',
            background: 'transparent', color: '#ef4444', fontSize: 10, fontWeight: 600, cursor: 'pointer',
          }}>
            ⏹ Disconnect
          </button>
        )}
      </div>

      {/* WebSocket Stats */}
      {wsStatus.connected && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 8,
        }}>
          {[
            { label: 'Messages', value: wsStatus.stats.messagesReceived, icon: '📨' },
            { label: 'Channels', value: wsStatus.channels.length, icon: '📡' },
            { label: 'Uptime', value: `${wsStatus.uptime}s`, icon: '⏱️' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '6px', borderRadius: 4, background: 'rgba(255,255,255,0.02)',
              border: '1px solid #1e2a3a', textAlign: 'center',
            }}>
              <div style={{ fontSize: 8, color: '#475569' }}>{s.icon} {s.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Handshake Log */}
      {logs.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>📋 HANDSHAKE LOG</div>
          <div style={{
            maxHeight: 120, overflow: 'auto', borderRadius: 6,
            background: '#0a0e17', border: '1px solid #1e2a3a', padding: 6,
          }}>
            {[...logs].reverse().map((log, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, padding: '2px 0', fontSize: 9 }}>
                <span style={{ color: '#475569', fontFamily: 'JetBrains Mono', minWidth: 14 }}>S{log.step}</span>
                <span style={{ color: stepColors[log.status] || '#94a3b8' }}>
                  {log.status === 'success' ? '✓' : log.status === 'error' ? '✗' : log.status === 'warn' ? '⚠' : '→'} {log.msg}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* Live Events */}
      {liveEvents.length > 0 && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>⚡ LIVE EVENTS</div>
          <div style={{
            maxHeight: 140, overflow: 'auto', borderRadius: 6,
            background: '#0a0e17', border: '1px solid #1e2a3a', padding: 6,
          }}>
            {liveEvents.map((ev, i) => (
              <div key={i} style={{
                display: 'flex', gap: 6, padding: '3px 0', fontSize: 9,
                borderBottom: i < liveEvents.length - 1 ? '1px solid #111827' : 'none',
              }}>
                <span style={{ color: ev.type === 'engine' ? '#06b6d4' : '#f59e0b', minWidth: 14 }}>
                  {ev.type === 'engine' ? '⚙️' : '📦'}
                </span>
                <span style={{ color: '#94a3b8', flex: 1 }}>
                  {ev.type === 'engine' ? (
                    <>{ev.data.engine} <span style={{ color: '#10b981' }}>●</span> CPU: {ev.data.cpu}% | RAM: {ev.data.memory}MB | {ev.data.latency}ms</>
                  ) : (
                    <>{ev.data.symbol} → <span style={{ color: ev.data.status === 'FILLED' ? '#10b981' : '#f59e0b' }}>{ev.data.status}</span> (qty: {ev.data.qty})</>
                  )}
                </span>
                <span style={{ color: '#2d3a4a', fontSize: 8, fontFamily: 'JetBrains Mono' }}>
                  {new Date(ev.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connection Info */}
      <div style={{
        marginTop: 8, padding: '6px 10px', borderRadius: 4, fontSize: 8, color: '#475569',
        background: 'rgba(6,182,212,0.03)', border: '1px solid rgba(6,182,212,0.1)',
      }}>
        WS: {wsStatus.url} | Queue: {wsStatus.queueSize} | Reconnects: {wsStatus.reconnectAttempts}
      </div>
    </div>
  );
}
