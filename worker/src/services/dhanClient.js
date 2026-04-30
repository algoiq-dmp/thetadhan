/**
 * Dhan REST API Client — used by all route handlers.
 * Broker-agnostic interface so future adapters (Upstox, XTS) follow same shape.
 */

export class DhanClient {
  constructor(env, token, clientId) {
    this.baseUrl = env.DHAN_API_BASE || 'https://api.dhan.co/v2';
    this.token = token;
    this.clientId = clientId;
  }

  _headers() {
    return {
      'Content-Type': 'application/json',
      'access-token': this.token,
      'client-id': this.clientId,
    };
  }

  async _request(method, path, body = null) {
    const opts = { method, headers: this._headers() };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${this.baseUrl}${path}`, opts);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.errorMessage || data.message || `Dhan API error: ${res.status}`);
    }
    return data;
  }

  // ─── Auth ───
  async getProfile() { return this._request('GET', '/profile'); }
  async getFunds() { return this._request('GET', '/fundlimit'); }

  // ─── Orders ───
  async placeOrder(order) { return this._request('POST', '/orders', order); }
  async modifyOrder(orderId, updates) { return this._request('PUT', `/orders/${orderId}`, updates); }
  async cancelOrder(orderId) { return this._request('DELETE', `/orders/${orderId}`); }
  async getOrders() { return this._request('GET', '/orders'); }
  async getTradeBook() { return this._request('GET', '/trades'); }
  async getOrderById(orderId) { return this._request('GET', `/orders/${orderId}`); }

  // ─── Portfolio ───
  async getPositions() { return this._request('GET', '/positions'); }
  async getHoldings() { return this._request('GET', '/holdings'); }

  // ─── Market Data ───
  async getMarketLTP(body) { return this._request('POST', '/marketfeed/ltp', body); }
  async getMarketOHLC(body) { return this._request('POST', '/marketfeed/ohlc', body); }
  async getFullQuote(body) { return this._request('POST', '/marketfeed/quote', body); }
  async getOptionChain(body) { return this._request('POST', '/optionchain', body); }
  async getExpiryList(body) { return this._request('POST', '/optionchain/expirylist', body); }
  async getHistorical(body) { return this._request('POST', '/charts/historical', body); }
  async getIntradayChart(body) { return this._request('POST', '/charts/intraday', body); }

  // ─── Position Actions ───
  async convertPosition(body) { return this._request('PUT', '/positions/convert', body); }
}

/**
 * Future adapter interface (for Upstox, XTS, etc.)
 * Each broker adapter must implement these methods:
 *
 * class UpstoxClient {
 *   constructor(env, token, clientId) { ... }
 *   async getProfile() { ... }
 *   async getFunds() { ... }
 *   async placeOrder(order) { ... }
 *   async getOrders() { ... }
 *   async getPositions() { ... }
 *   async getMarketQuote(body) { ... }
 *   // etc.
 * }
 *
 * Register in getBrokerClient() below.
 */

export function getBrokerClient(broker, env, token, clientId) {
  switch (broker) {
    case 'dhan':
      return new DhanClient(env, token, clientId);
    // case 'upstox':
    //   return new UpstoxClient(env, token, clientId);
    // case 'xts':
    //   return new XtsClient(env, token, clientId);
    default:
      throw new Error(`Unsupported broker: ${broker}`);
  }
}
