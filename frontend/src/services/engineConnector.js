/**
 * Engine Connector — Unified Dhan/Cloudflare Worker Connection Manager
 * 
 * Replaces the original AlgoEngines local connection with the Dhan Cloudflare Worker API.
 * Maps original Theta Yantra data requests to Dhan-specific endpoints.
 */

export const ENGINE_REGISTRY = {
  shield:      { name: 'Auth',         port: null, icon: '🛡️', critical: true,  purpose: 'Dhan Session' },
  surya:       { name: 'D1 DB',        port: null, icon: '☀️',  critical: true,  purpose: 'Instrument Master' },
  lakshmi:     { name: 'FeedRelay',    port: null, icon: '💰', critical: true,  purpose: 'Live Dhan Ticks' },
  vega:        { name: 'OrderEngine',  port: null, icon: '⚡', critical: true,  purpose: 'Dhan Order Execution' },
};

// Use environment URL or fallback to the live worker
const API_URL = import.meta.env.VITE_API_URL || 'https://thetadhan-api.parlight2.workers.dev';

class EngineConnector {
  constructor() {
    this.engines = {};
    this.apiUrl = API_URL;
    
    Object.keys(ENGINE_REGISTRY).forEach(key => {
      this.engines[key] = {
        ...ENGINE_REGISTRY[key],
        status: 'unknown',
        lastCheck: null,
      };
    });
  }

  /** Check health via Diagnostics endpoint */
  async checkAllHealth() {
    try {
      const res = await fetch(`${this.apiUrl}/api/diagnostics`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return {};
      const data = await res.json();
      
      // Map diagnostics to engine status
      const engines = {
        shield: { status: data.dhanApi?.status === 'ok' ? 'online' : 'offline' },
        surya: { status: data.d1?.status === 'ok' ? 'online' : 'offline' },
        lakshmi: { status: data.limits?.requests?.remaining > 0 ? 'online' : 'degraded' },
        vega: { status: data.dhanApi?.status === 'ok' ? 'online' : 'offline' },
      };

      Object.entries(engines).forEach(([key, eng]) => {
        if (this.engines[key]) {
          this.engines[key].status = eng.status === 'online' ? 'healthy' : 'down';
          this.engines[key].lastCheck = Date.now();
        }
      });

      return engines;
    } catch {
      return {};
    }
  }

  /** Fetch live universe (F&O symbols) */
  async fetchUniverse() {
    try {
      const res = await fetch(`${this.apiUrl}/api/instruments/fno`, { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      
      // Transform Dhan records to original Theta Yantra format
      return (data.instruments || []).map(inst => ({
        symbol: inst.symbol,
        token: inst.security_id,
        ntoken: inst.security_id,
        sscript: inst.symbol,
        exchange_segment: inst.exchange_segment,
        ltp: 0,
        change: 0,
        changePct: 0,
        lotSize: inst.lot_size,
        expiryDate: inst.expiry_date,
        strike: inst.strike_price,
        callPut: inst.option_type,
        type: inst.instrument_type
      }));
    } catch { return []; }
  }

  /** Search Dhan instruments */
  async searchContracts(q) {
    try {
      const res = await fetch(`${this.apiUrl}/api/instruments/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      return (data.instruments || []).map(inst => ({
        symbol: inst.symbol,
        token: inst.security_id,
        lotSize: inst.lot_size,
        exchange: inst.exchange_segment
      }));
    } catch { return []; }
  }

  /** Get Option Chain */
  async getOptionChain(symbol, expiry) {
    try {
      const url = `${this.apiUrl}/api/instruments/chain/${encodeURIComponent(symbol)}${expiry ? '?expiry=' + expiry : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.chain || [];
    } catch { return []; }
  }

  /** Place Order to Dhan */
  async placeOrder(order) {
    try {
      const res = await fetch(`${this.apiUrl}/api/orders/place`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dhan_token')}`,
          'X-Client-Id': localStorage.getItem('dhan_client_id')
        },
        body: JSON.stringify(order),
      });
      return res.json();
    } catch (err) { return { success: false, error: err.message }; }
  }

  /** Cancel Order */
  async cancelOrder(orderId) {
    try {
      const res = await fetch(`${this.apiUrl}/api/orders/cancel/${orderId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('dhan_token')}`,
          'X-Client-Id': localStorage.getItem('dhan_client_id')
        },
      });
      return res.json();
    } catch (err) { return { success: false, error: err.message }; }
  }

  /** Modify Order */
  async modifyOrder(orderId, updates) {
    try {
      const res = await fetch(`${this.apiUrl}/api/orders/modify/${orderId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dhan_token')}`,
          'X-Client-Id': localStorage.getItem('dhan_client_id')
        },
        body: JSON.stringify(updates),
      });
      return res.json();
    } catch (err) { return { success: false, error: err.message }; }
  }

  /** Get Dhan Positions */
  async getPositions() {
    try {
      const res = await fetch(`${this.apiUrl}/api/portfolio/positions`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('dhan_token')}`, 'X-Client-Id': localStorage.getItem('dhan_client_id') }
      });
      const data = await res.json();
      return data.positions || [];
    } catch { return []; }
  }

  async getHoldings() {
    try {
      const res = await fetch(`${this.apiUrl}/api/portfolio/holdings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('dhan_token')}`, 'X-Client-Id': localStorage.getItem('dhan_client_id') }
      });
      const data = await res.json();
      return data.holdings || [];
    } catch { return []; }
  }

  async getOrders() {
    try {
      const res = await fetch(`${this.apiUrl}/api/orders`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('dhan_token')}`, 'X-Client-Id': localStorage.getItem('dhan_client_id') }
      });
      const data = await res.json();
      return data.orders || [];
    } catch { return []; }
  }

  async getTrades() {
    try {
      const res = await fetch(`${this.apiUrl}/api/orders/trades`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('dhan_token')}`, 'X-Client-Id': localStorage.getItem('dhan_client_id') }
      });
      const data = await res.json();
      return data.trades || [];
    } catch { return []; }
  }

  async getOptionChain(securityId, exchangeSegment, expiry) {
    try {
      const res = await fetch(`${this.apiUrl}/api/market/chain`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dhan_token')}`, 
          'X-Client-Id': localStorage.getItem('dhan_client_id') 
        },
        body: JSON.stringify({
          UnderlyingScrip: parseInt(securityId),
          UnderlyingSeg: exchangeSegment,
          Expiry: expiry
        })
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch { return null; }
  }

  async getExpiryList(securityId, exchangeSegment) {
    try {
      const res = await fetch(`${this.apiUrl}/api/market/expirylist`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dhan_token')}`, 
          'X-Client-Id': localStorage.getItem('dhan_client_id') 
        },
        body: JSON.stringify({
          UnderlyingScrip: parseInt(securityId),
          UnderlyingSeg: exchangeSegment
        })
      });
      const data = await res.json();
      // Dhan returns { data: ["2026-05-01", ...], status: "success" }
      // Worker wraps as { success: true, data: { data: [...], status: "success" } }
      const raw = data.success ? data.data : data;
      return raw?.data || raw || [];
    } catch { return []; }
  }

  /** Fetch Historical Daily OHLC from Dhan */
  async getHistoricalOHLC({ securityId, exchangeSegment, instrument, symbol, fromDate, toDate, expiryCode = 0 }) {
    try {
      const res = await fetch(`${this.apiUrl}/api/market/historical`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dhan_token')}`,
          'X-Client-Id': localStorage.getItem('dhan_client_id')
        },
        body: JSON.stringify({ securityId: String(securityId), exchangeSegment, instrument, symbol, fromDate, toDate, expiryCode, isIntraday: false })
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch { return null; }
  }

  /** Fetch Intraday 1-min OHLC from Dhan */
  async getIntradayOHLC({ securityId, exchangeSegment, instrument }) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const fromD = new Date(); fromD.setDate(fromD.getDate() - 5);
      const fromDate = fromD.toISOString().split('T')[0];
      const res = await fetch(`${this.apiUrl}/api/market/intraday`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dhan_token')}`,
          'X-Client-Id': localStorage.getItem('dhan_client_id')
        },
        body: JSON.stringify({
          securityId: String(securityId), exchangeSegment, instrument,
          interval: '1', oi: false,
          fromDate: fromDate + ' 09:15:00',
          toDate: today + ' 15:30:00'
        })
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch { return null; }
  }

  /** Fetch Daily OHLC for technical analysis (last 250 trading days ~1 year) */
  async getDailyOHLC({ securityId, exchangeSegment, instrument }) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const fromD = new Date(); fromD.setFullYear(fromD.getFullYear() - 1);
      const fromDate = fromD.toISOString().split('T')[0];
      const res = await fetch(`${this.apiUrl}/api/market/historical`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dhan_token')}`,
          'X-Client-Id': localStorage.getItem('dhan_client_id')
        },
        body: JSON.stringify({
          securityId: String(securityId), exchangeSegment, instrument,
          interval: '1', oi: false, isIntraday: false,
          fromDate, toDate: today
        })
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch { return null; }
  }

  /** Fetch Intraday OHLC (1-min candles, last trading day) */
  async getIntradayOHLC({ securityId, exchangeSegment, instrument }) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${this.apiUrl}/api/market/historical`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dhan_token')}`,
          'X-Client-Id': localStorage.getItem('dhan_client_id')
        },
        body: JSON.stringify({
          securityId: String(securityId), exchangeSegment, instrument,
          interval: '1', oi: false, isIntraday: true,
          fromDate: today, toDate: today
        })
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch { return null; }
  }

  /** Fetch full quote with 5-level depth */
  async getFullQuote(instrumentMap) {
    try {
      const res = await fetch(`${this.apiUrl}/api/market/fullquote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dhan_token')}`,
          'X-Client-Id': localStorage.getItem('dhan_client_id')
        },
        body: JSON.stringify(instrumentMap)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch { return null; }
  }

  /** Fetch option chain from Dhan */
  async getOptionChain({ underlyingScrip, underlyingSeg, expiryDate }) {
    try {
      const res = await fetch(`${this.apiUrl}/api/market/chain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dhan_token')}`,
          'X-Client-Id': localStorage.getItem('dhan_client_id')
        },
        body: JSON.stringify({
          UnderlyingScrip: underlyingScrip, UnderlyingSeg: underlyingSeg,
          ExpiryDate: expiryDate
        })
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch { return null; }
  }

  /** Fetch expiry list from Dhan */
  async getExpiryList({ underlyingScrip, underlyingSeg }) {
    try {
      const res = await fetch(`${this.apiUrl}/api/market/expirylist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dhan_token')}`,
          'X-Client-Id': localStorage.getItem('dhan_client_id')
        },
        body: JSON.stringify({ UnderlyingScrip: underlyingScrip, UnderlyingSeg: underlyingSeg })
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch { return null; }
  }

  /** Fetch LTP + OHLC for multiple instruments (for polling) */
  async getLTP(instrumentMap) {
    try {
      const res = await fetch(`${this.apiUrl}/api/market/ohlc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dhan_token')}`,
          'X-Client-Id': localStorage.getItem('dhan_client_id')
        },
        body: JSON.stringify(instrumentMap)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch { return null; }
  }

  /** Fetch full quote with depth, OI, volume for single instrument */
  async getFullQuote(instrumentMap) {
    try {
      const res = await fetch(`${this.apiUrl}/api/market/fullquote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dhan_token')}`,
          'X-Client-Id': localStorage.getItem('dhan_client_id')
        },
        body: JSON.stringify(instrumentMap)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch { return null; }
  }

  /** Fetch Market Quote (legacy alias) */
  async getMarketQuote(instruments) {
    return this.getLTP(instruments);
  }

  getEngineStates() {
    return Object.entries(this.engines).map(([key, engine]) => ({
      key, ...engine,
    }));
  }

  getOverallStatus() {
    const states = this.getEngineStates();
    const allUp = states.every(e => e.status === 'healthy');
    return allUp ? 'healthy' : 'degraded';
  }
}

const engineConnector = new EngineConnector();
export default engineConnector;
