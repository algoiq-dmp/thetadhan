import { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import engineConnector, { ENGINE_REGISTRY } from '../services/engineConnector';
import talkOptionsService from '../services/talkOptionsService';

export default function EngineSettingsPanel({ onClose }) {
  const saveCredential = useAuthStore(s => s.saveCredential);
  const getCredential = useAuthStore(s => s.getCredential);
  const [activeTab, setActiveTab] = useState('engines');
  const [engineStates, setEngineStates] = useState([]);
  const [testing, setTesting] = useState(null);
  const [toStatus, setToStatus] = useState(null);

  // Dhan live connection from auth store
  const dhanConnected = useAuthStore(s => s.dhanConnected);
  const dhanClientId = useAuthStore(s => s.dhanClientId);
  const dhanClientName = useAuthStore(s => s.dhanClientName);

  // Credential forms
  const [shieldCreds, setShieldCreds] = useState(() => getCredential('shield') || { url: 'http://localhost:3000', userId: '', password: '' });
  const [toCreds, setToCreds] = useState(() => getCredential('talkOptions') || { url: 'https://webapi.talkoptions.in/api', userName: '9082460356', password: '', xBypass: '34f38c9f-a786-4fc4-81e1-b1f1c378d512' });
  const [tdCreds, setTdCreds] = useState(() => getCredential('talkDelta') || { url: 'http://localhost:3008', apiKey: '', apiSecret: '' });
  const [dhanDataCreds, setDhanDataCreds] = useState(() => getCredential('dhanData') || { token: '' });
  const [brokerCreds, setBrokerCreds] = useState(() => getCredential('broker') || { provider: 'XTS', apiKey: '', apiSecret: '', baseUrl: '' });

  useEffect(() => {
    setEngineStates(engineConnector.getEngineStates());
  }, []);

  const handleHealthCheck = async () => {
    setTesting('all');
    await engineConnector.checkAllHealth();
    setEngineStates(engineConnector.getEngineStates());
    setTesting(null);
  };

  const handleTestTO = async () => {
    setTesting('talkOptions');
    const ok = await talkOptionsService.login(toCreds.userName, toCreds.password);
    setToStatus(ok ? talkOptionsService.getStatus() : { error: 'Failed' });
    setTesting(null);
  };

  const tabs = [
    { id: 'engines', label: '⚙️ Engines', count: 8 },
    { id: 'shield', label: '🛡️ Shield Auth' },
    { id: 'talkoptions', label: '🧠 TalkOptions' },
    { id: 'talkdelta', label: '📡 TalkDelta' },
    { id: 'dhanData', label: '📊 Dhan Data API' },
    { id: 'broker', label: '💳 Broker API' },
  ];

  const statusColor = (s) => s === 'healthy' ? '#10b981' : s === 'degraded' ? '#f59e0b' : s === 'down' ? '#ef4444' : '#475569';
  const statusDot = (s) => s === 'healthy' ? '🟢' : s === 'degraded' ? '🟡' : s === 'down' ? '🔴' : '⚪';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ width: 720, maxHeight: '80vh', background: '#111827', border: '1px solid #1e2a3a', borderRadius: 12, overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #1e2a3a' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>🔐 Engine Credentials & Security</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e2a3a', overflow: 'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '8px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
              background: activeTab === t.id ? 'rgba(6,182,212,0.1)' : 'transparent',
              color: activeTab === t.id ? '#06b6d4' : '#64748b',
              borderBottom: activeTab === t.id ? '2px solid #06b6d4' : '2px solid transparent',
              fontFamily: 'Inter',
            }}>
              {t.label} {t.count && <span style={{ fontSize: 9, background: 'rgba(6,182,212,0.2)', padding: '1px 5px', borderRadius: 6, marginLeft: 4 }}>{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: 16, maxHeight: '60vh', overflow: 'auto' }}>
          {/* Engine Health */}
          {activeTab === 'engines' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>System Status: <strong style={{ color: statusColor(engineConnector.getOverallStatus()) }}>{engineConnector.getOverallStatus().toUpperCase()}</strong></div>
                <button onClick={handleHealthCheck} disabled={testing === 'all'} style={testBtn}>
                  {testing === 'all' ? '⏳ Checking...' : '🔍 Check All'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {engineStates.map(e => (
                  <div key={e.key} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2a3a', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{e.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#f8fafc' }}>{e.name}</div>
                      <div style={{ fontSize: 9, color: '#64748b' }}>{e.purpose} {e.port && `• :${e.port}`}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10 }}>{statusDot(e.status)}</div>
                      {e.latency && <div style={{ fontSize: 9, color: '#64748b' }}>{e.latency}ms</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shield Auth */}
          {activeTab === 'shield' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={alertInfo}>🛡️ Shield provides JWT authentication for all engine communication. Port 3000.</div>
              <FieldRow label="Shield URL" value={shieldCreds.url} onChange={v => setShieldCreds({...shieldCreds, url: v})} />
              <FieldRow label="User ID" value={shieldCreds.userId} onChange={v => setShieldCreds({...shieldCreds, userId: v})} />
              <FieldRow label="Password" value={shieldCreds.password} onChange={v => setShieldCreds({...shieldCreds, password: v})} type="password" />
              <button onClick={() => saveCredential('shield', shieldCreds)} style={saveBtn}>💾 Save Shield Credentials</button>
            </div>
          )}

          {/* TalkOptions */}
          {activeTab === 'talkoptions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={alertInfo}>🧠 Our product — same environment. Premium IV, Greeks, OI, MaxPain, 13 API endpoints.</div>
              <FieldRow label="API Base URL" value={toCreds.url} onChange={v => setToCreds({...toCreds, url: v})} />
              <FieldRow label="UserName" value={toCreds.userName} onChange={v => setToCreds({...toCreds, userName: v})} />
              <FieldRow label="Password" value={toCreds.password} onChange={v => setToCreds({...toCreds, password: v})} type="password" />
              <FieldRow label="x-bypass Header" value={toCreds.xBypass} onChange={v => setToCreds({...toCreds, xBypass: v})} mono />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => saveCredential('talkOptions', toCreds)} style={saveBtn}>💾 Save</button>
                <button onClick={handleTestTO} disabled={testing === 'talkOptions'} style={testBtn}>
                  {testing === 'talkOptions' ? '⏳ Testing...' : '🔗 Test Connection'}
                </button>
              </div>
              {toStatus && (
                <div style={{ ...alertInfo, background: toStatus.connected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderColor: toStatus.connected ? '#10b981' : '#ef4444' }}>
                  {toStatus.connected ? `✅ Connected! Session: ${toStatus.sessionId?.slice(0, 12)}... Token expires in ${toStatus.tokenExpiresIn}min` : `❌ ${toStatus.error}`}
                </div>
              )}
            </div>
          )}

          {/* TalkDelta */}
          {activeTab === 'talkdelta' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={alertInfo}>📡 Our product — live IBT/UDP market feed + post-trade portfolio analytics.</div>
              <FieldRow label="TalkDelta URL" value={tdCreds.url} onChange={v => setTdCreds({...tdCreds, url: v})} />
              <FieldRow label="API Key" value={tdCreds.apiKey} onChange={v => setTdCreds({...tdCreds, apiKey: v})} mono />
              <FieldRow label="API Secret" value={tdCreds.apiSecret} onChange={v => setTdCreds({...tdCreds, apiSecret: v})} type="password" />
              <button onClick={() => saveCredential('talkDelta', tdCreds)} style={saveBtn}>💾 Save TalkDelta Credentials</button>
            </div>
          )}

          {/* Dhan Data API */}
          {activeTab === 'dhanData' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={alertInfo}>📊 Paste your 24-hour Dhan Data API Access Token here. This will override the backend for historical charts.</div>
              <FieldRow label="Access Token" value={dhanDataCreds.token} onChange={v => {
                setDhanDataCreds({...dhanDataCreds, token: v});
                localStorage.setItem('dhan_data_token', v);
              }} type="password" />
              <button onClick={() => {
                saveCredential('dhanData', dhanDataCreds);
                localStorage.setItem('dhan_data_token', dhanDataCreds.token);
              }} style={saveBtn}>💾 Save Data Token</button>
            </div>
          )}

          {/* Broker */}
          {activeTab === 'broker' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={alertInfo}>💳 Broker API for order execution via Vega engine. This terminal is currently hardcoded to Dhan.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['XTS', 'Dhan', 'AngelOne'].map(p => (
                  <button key={p} onClick={() => setBrokerCreds({...brokerCreds, provider: p})} style={{
                    ...testBtn, background: brokerCreds.provider === p ? 'rgba(6,182,212,0.2)' : 'transparent',
                    color: brokerCreds.provider === p ? '#06b6d4' : '#64748b',
                  }}>{p}</button>
                ))}
              </div>
              
              {brokerCreds.provider === 'Dhan' ? (
                <div style={{ padding: 16, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: dhanConnected ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {dhanConnected ? '✓' : '✕'}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                        {dhanConnected ? 'Dhan Auto-Connected' : 'Dhan Not Connected'}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        Managed securely via Cloudflare Worker DO
                      </div>
                    </div>
                  </div>
                  
                  {dhanConnected && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>Account Name</div>
                        <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>{dhanClientName}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>Client ID</div>
                        <div style={{ fontSize: 13, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{dhanClientId}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <FieldRow label="API Key" value={brokerCreds.apiKey} onChange={v => setBrokerCreds({...brokerCreds, apiKey: v})} mono />
                  <FieldRow label="API Secret" value={brokerCreds.apiSecret} onChange={v => setBrokerCreds({...brokerCreds, apiSecret: v})} type="password" />
                  <FieldRow label="Base URL" value={brokerCreds.baseUrl} onChange={v => setBrokerCreds({...brokerCreds, baseUrl: v})} />
                  <button onClick={() => saveCredential('broker', brokerCreds)} style={saveBtn}>💾 Save Broker Credentials</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, value, onChange, type = 'text', mono = false }) {
  const [show, setShow] = useState(type !== 'password');
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#94a3b8', marginBottom: 3 }}>{label}</label>
      <div style={{ display: 'flex', gap: 4 }}>
        <input style={{
          flex: 1, height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid #1e2a3a',
          background: 'rgba(255,255,255,0.03)', color: '#f8fafc', fontSize: 12, outline: 'none',
          fontFamily: mono ? 'JetBrains Mono, monospace' : 'Inter',
        }} type={type === 'password' && !show ? 'password' : 'text'} value={value || ''} onChange={e => onChange(e.target.value)} />
        {type === 'password' && (
          <button onClick={() => setShow(!show)} style={{ ...testBtn, width: 34, padding: 0 }}>{show ? '👁️' : '🔒'}</button>
        )}
      </div>
    </div>
  );
}

const saveBtn = { height: 34, borderRadius: 6, border: 'none', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter', padding: '0 16px' };
const testBtn = { height: 34, borderRadius: 6, border: '1px solid #1e2a3a', background: 'rgba(255,255,255,0.03)', color: '#94a3b8', fontSize: 11, cursor: 'pointer', fontFamily: 'Inter', padding: '0 12px' };
const alertInfo = { fontSize: 11, color: '#94a3b8', background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 6, padding: '8px 12px' };
