/**
 * XTSConnector — Broker API connector (XTS / GETS / Dhan / Vega)
 * All actual API calls will go through the Node.js backend proxy.
 * Frontend only stores credentials and routes via backend /api/orders/*
 */

export default class XTSConnector {
  constructor(config = {}) {
    this.provider = config.provider || 'Gateway';
    this.baseUrl = import.meta.env.VITE_GATEWAY_URL || 'https://kuber-gateway.algoiq.in';
    this.token = config.token || '';
    this.connected = false;
  }

  async placeOrder({ symbol, side, qty, price, orderType = 'MKT', product = 'MIS', bracket }) {
    // Route manual orders through Kuber Gateway MTC Controller
    const payload = {
       buySell: side,
       symbol: symbol,
       qty: qty,
       orderType: orderType === 'MKT' ? 'MARKET' : 'LIMIT',
       strike: "",
       optionType: "",
       expiry: "",
       instrument: symbol.includes(" ") ? "OPTIDX" : "FUTIDX",
       exchange: "NSEFNO",
       price: price
    };

    const res = await fetch(`${this.baseUrl}/api/mtc/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (!res) return { success: false, error: `${this.provider} not connected. Gateway required.` };
    return res.json();
  }

  async modifyOrder(orderId, changes) {
    return { success: false, error: 'Modify not supported via Gateway proxy yet' };
  }

  async cancelOrder(orderId) {
    const res = await fetch(`${this.baseUrl}/api/strategy/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({ Action: "CANCEL", ClientOrderId: orderId })
    }).catch(() => null);
    if (!res) return { success: false, error: 'Gateway not connected' };
    return res.json();
  }

  async getPositions() {
    const res = await fetch(`${this.baseUrl}/api/mtc/positions`, {
      headers: { 'Authorization': `Bearer ${this.token}` },
    }).catch(() => null);
    return res ? res.json() : [];
  }

  async getOrderBook() {
    const res = await fetch(`${this.baseUrl}/api/orders/book`, {
      headers: { 'Authorization': `Bearer ${this.token}` },
    }).catch(() => null);
    return res ? res.json() : [];
  }

  async getTradeBook() {
    const res = await fetch(`${this.baseUrl}/api/trades/book`, {
      headers: { 'Authorization': `Bearer ${this.token}` },
    }).catch(() => null);
    return res ? res.json() : [];
  }

  async testConnection() {
    const res = await fetch(`${this.baseUrl}/api/engines/status`, {
      headers: { 'Authorization': `Bearer ${this.token}` },
    }).catch(() => null);
    if (!res) return { success: false, error: `Cannot reach Gateway` };
    this.connected = true;
    return { success: true, message: `Gateway connected` };
  }
}
