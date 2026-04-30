import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { dhanApi } from '../../lib/dhanApi';
import { Loader2 } from 'lucide-react';

export function BrokerLoginPanel() {
  const { token, clientId: storeClientId, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('auto'); // auto or manual

  const [form, setForm] = useState({
    clientId: storeClientId || '1100074561',
    pin: '',
    totpSecret: '',
    accessToken: ''
  });

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = { broker: 'dhan', clientId: form.clientId };
      if (mode === 'auto') {
        payload.pin = form.pin;
        payload.totpSecret = form.totpSecret;
      } else {
        payload.accessToken = form.accessToken;
      }

      const res = await dhanApi.login(payload);
      if (res.success) {
        setAuth(res);
        // Clear sensitive inputs
        setForm(prev => ({ ...prev, pin: '', totpSecret: '', accessToken: '' }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <h3 className="text-white font-medium mb-6">Broker Authentication</h3>
      
      {token ? (
        <div className="bg-green-900/20 border border-green-700/50 rounded p-4 mb-6">
          <div className="text-green-400 font-medium flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            Connected to DhanHQ
          </div>
          <div className="text-green-400/80 text-sm">
            Client ID: {storeClientId}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-4 mb-6 text-sm text-yellow-500/90">
          Not connected. Live market data and trading are disabled.
        </div>
      )}

      <div className="flex gap-2 mb-6 p-1 bg-[#0a0b0d] rounded border border-[#2a2e39]">
        <button 
          onClick={() => setMode('auto')}
          className={`flex-1 py-1.5 text-sm rounded ${mode === 'auto' ? 'bg-[#1e222d] text-white' : 'text-gray-400'}`}
        >
          Auto TOTP
        </button>
        <button 
          onClick={() => setMode('manual')}
          className={`flex-1 py-1.5 text-sm rounded ${mode === 'manual' ? 'bg-[#1e222d] text-white' : 'text-gray-400'}`}
        >
          Manual Token
        </button>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Client ID</label>
          <input 
            type="text" 
            value={form.clientId}
            onChange={(e) => setForm(p => ({ ...p, clientId: e.target.value }))}
            className="w-full bg-[#0a0b0d] border border-[#2a2e39] rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            placeholder="e.g. 1100074561"
            required
          />
        </div>

        {mode === 'auto' ? (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1">PIN</label>
              <input 
                type="password" 
                value={form.pin}
                onChange={(e) => setForm(p => ({ ...p, pin: e.target.value }))}
                className="w-full bg-[#0a0b0d] border border-[#2a2e39] rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                placeholder="Leave blank to use Worker env var"
                maxLength={6}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">TOTP Secret (Base32)</label>
              <input 
                type="password" 
                value={form.totpSecret}
                onChange={(e) => setForm(p => ({ ...p, totpSecret: e.target.value }))}
                className="w-full bg-[#0a0b0d] border border-[#2a2e39] rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none font-mono"
                placeholder="Leave blank to use Worker env var"
              />
              <p className="text-xs text-gray-500 mt-1">
                If left blank, the API will use the secret stored in Cloudflare environment variables.
              </p>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs text-gray-400 mb-1">JWT Access Token</label>
            <textarea 
              value={form.accessToken}
              onChange={(e) => setForm(p => ({ ...p, accessToken: e.target.value }))}
              className="w-full bg-[#0a0b0d] border border-[#2a2e39] rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none font-mono min-h-[100px]"
              placeholder="Paste Dhan access token here..."
              required
            />
          </div>
        )}

        {error && <div className="text-red-400 text-sm py-2">{error}</div>}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Connect & Authenticate'}
        </button>
      </form>
    </div>
  );
}
