/**
 * Frontend REST client to communicate with the Cloudflare Worker API.
 */
import { API_URL } from '../config.js';
import { useAuthStore } from '../store/useAuthStore.js';

export const dhanApi = {
  async _request(endpoint, options = {}) {
    const { token, clientId } = useAuthStore.getState();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (clientId) headers['X-Client-Id'] = clientId;

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // If token expired, we could handle auto-refresh here
      throw new Error(data.error || `API Error: ${res.status}`);
    }
    return data;
  },

  // ─── Auth ───
  login: (credentials) => dhanApi._request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getProfile: () => dhanApi._request('/api/auth/profile'),
  getFunds: () => dhanApi._request('/api/portfolio/funds'),

  // ─── Market ───
  searchInstruments: (query) => dhanApi._request(`/api/instruments/search?q=${query}`),
  getFnoInstruments: () => dhanApi._request('/api/instruments/fno'),
  getOptionChain: (symbol, expiry) => dhanApi._request(`/api/instruments/chain/${symbol}${expiry ? `?expiry=${expiry}` : ''}`),
  getMarketQuote: (instruments) => dhanApi._request('/api/market/quote', { method: 'POST', body: JSON.stringify(instruments) }),

  // ─── Diagnostics ───
  getDiagnostics: () => dhanApi._request('/api/diagnostics'),
};
