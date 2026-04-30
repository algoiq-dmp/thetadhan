/**
 * BrokerConnector — Generic Frontend Broker REST Client
 * 
 * Works for ANY broker since the backend normalizes everything.
 * Calls /api/broker/* endpoints which route to the active adapter.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5010';

export default class BrokerConnector {
  constructor(baseUrl = API_URL) {
    this.baseUrl = baseUrl;
  }

  async _fetch(endpoint, options = {}) {
    try {
      const res = await fetch(`${this.baseUrl}/api/broker${endpoint}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || `HTTP ${res.status}`);
      }
      return res.json();
    } catch (e) {
      console.error(`[BrokerConnector] ${endpoint}:`, e.message);
      throw e;
    }
  }

  // ── Auth ──
  async login(brokerId, credentials) {
    return this._fetch('/login', {
      method: 'POST',
      body: JSON.stringify({ brokerId, ...credentials }),
    });
  }

  async logout() {
    return this._fetch('/logout', { method: 'POST' });
  }

  async getStatus() {
    return this._fetch('/status');
  }

  // ── Trading ──
  async placeOrder(order) {
    return this._fetch('/order', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async modifyOrder(orderId, changes) {
    return this._fetch(`/order/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(changes),
    });
  }

  async cancelOrder(orderId) {
    return this._fetch(`/order/${orderId}`, { method: 'DELETE' });
  }

  // ── Portfolio ──
  async getOrderBook() { return this._fetch('/orderbook'); }
  async getTradeBook() { return this._fetch('/tradebook'); }
  async getPositions() { return this._fetch('/positions'); }
  async getHoldings()  { return this._fetch('/holdings'); }
  async getFunds()     { return this._fetch('/funds'); }

  // ── Data ──
  async getMarketQuote(instruments) {
    return this._fetch('/quote', {
      method: 'POST',
      body: JSON.stringify({ instruments }),
    });
  }

  async getOptionChain(token, segment, expiry) {
    return this._fetch('/optionchain', {
      method: 'POST',
      body: JSON.stringify({ token, segment, expiry }),
    });
  }

  async getExpiryList(token, segment) {
    return this._fetch('/expirylist', {
      method: 'POST',
      body: JSON.stringify({ token, segment }),
    });
  }

  async subscribeFeed(instruments) {
    return this._fetch('/subscribe', {
      method: 'POST',
      body: JSON.stringify({ instruments }),
    });
  }

  // ── Emergency ──
  async exitAllPositions() {
    return this._fetch('/positions', { method: 'DELETE' });
  }

  // ── Connection Test ──
  async testConnection() {
    try {
      const status = await this.getStatus();
      return { success: true, ...status };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}
