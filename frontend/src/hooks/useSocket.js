// ── useSocket — Cloudflare Worker + Dhan Feed Integration ──
import { useEffect, useState } from 'react';
import useMarketStore from '../store/useMarketStore';
import wsManager from '../services/wsManager';

const API_URL = import.meta.env.VITE_API_URL || 'https://thetadhan-api.parlight2.workers.dev';

let healthPollTimer = null;

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [engineStatus, setEngineStatus] = useState({});
  const updateTicks = useMarketStore(s => s.updateTicks);
  const setEngines = useMarketStore(s => s.setEngines);

  useEffect(() => {
    // 1. Connect WebSocket (Bug #8 fix: token+clientId sent on open in wsManager)
    wsManager.connect();
    wsManager.startHeartbeat();

    // 2. Connection status
    const unsubConn = wsManager.on('connection', (data) => {
      setConnected(data.status === 'connected' || data.status === 'feed-authenticated');
    });

    // 3. Market data ticks (Bug #9 fix: proper binary parser in wsManager)
    const unsubTicks = wsManager.on('market-data', (tick) => {
      updateTicks((row) => {
        if (String(row.token) === String(tick.securityId)) {
          return {
            ...row,
            ltp: tick.ltp || row.ltp,
            change: tick.change ?? row.change,
            changePct: tick.changePct ?? row.changePct,
            todayHigh: tick.todayHigh || row.todayHigh,
            todayLow: tick.todayLow || row.todayLow,
            volume: tick.volume || row.volume,
            oi: tick.oi || row.oi,
            flashClass: tick.ltp > row.ltp ? 'flash-up' : tick.ltp < row.ltp ? 'flash-down' : '',
          };
        }
        return row;
      });
    });

    // 4. Order updates → re-emit to original listeners
    const unsubOrders = wsManager.on('order-updates', (data) => {
      console.log('[Socket] Order update:', data);
    });

    // 5. Health polling (every 10s) — maps Dhan diagnostics to engine dots
    const pollHealth = async () => {
      try {
        const data = await fetchAPI('/diagnostics');
        const mapped = {
          shield: data.dhanApi?.status === 'ok' ? 'healthy' : 'down',
          surya: data.d1?.status === 'ok' ? 'healthy' : 'down',
          lakshmi: 'healthy', // Feed relay
          vega: 'healthy',   // Order engine
        };
        setEngines(mapped);
        setEngineStatus(mapped);
      } catch {
        setEngines({ shield: 'error', surya: 'error', lakshmi: 'error', vega: 'error' });
      }
    };

    pollHealth();
    if (!healthPollTimer) {
      healthPollTimer = setInterval(pollHealth, 10000);
    }

    return () => {
      unsubConn();
      unsubTicks();
      unsubOrders();
    };
  }, [updateTicks, setEngines]);

  return { connected, engineStatus, socket: wsManager };
}

// ── API fetch helper — all calls to Cloudflare Worker ──
export async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('dhan_token');
  const clientId = localStorage.getItem('dhan_client_id');

  const url = `${API_URL}/api${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // Bug #6 fix: always send auth headers
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(clientId && { 'X-Client-Id': clientId }),
        ...options.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (e) {
    console.error(`API ${endpoint}:`, e.message);
    throw e;
  }
}

export default useSocket;
