/**
 * PaperConnector — Local paper trading simulator
 * Fills orders immediately at market price, tracks P&L in localStorage
 */

const STORAGE_KEY = 'ty_paper_trading';

export default class PaperConnector {
  constructor(config = {}) {
    this.connected = true;
    this.capital = config.capital || 1000000;
    this.brokerage = config.brokerage || 20; // flat per order
    const saved = localStorage.getItem(STORAGE_KEY);
    this.state = saved ? JSON.parse(saved) : { orders: [], positions: [], trades: [], balance: this.capital };
  }

  save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); }

  async placeOrder({ symbol, side, qty, price, orderType = 'MKT', product = 'MIS', bracket }) {
    const orderId = `PAPER-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const fillPrice = price || (20000 + Math.random() * 5000); // simulated
    const order = {
      orderId, symbol, side, qty, price: fillPrice, orderType, product,
      status: 'FILLED', filledQty: qty, avgPrice: fillPrice,
      timestamp: new Date().toISOString(), bracket: bracket || null,
    };
    this.state.orders.push(order);
    this.state.trades.push({ ...order, tradeId: `T-${orderId}` });

    // Update positions
    const existing = this.state.positions.find(p => p.symbol === symbol);
    const qtyDelta = side === 'BUY' ? qty : -qty;
    if (existing) {
      existing.qty += qtyDelta;
      if (existing.qty === 0) this.state.positions = this.state.positions.filter(p => p.symbol !== symbol);
      else existing.avgPrice = (existing.avgPrice * (existing.qty - qtyDelta) + fillPrice * qtyDelta) / existing.qty;
    } else {
      this.state.positions.push({ symbol, qty: qtyDelta, avgPrice: fillPrice, product, ltp: fillPrice, pnl: 0 });
    }
    this.state.balance -= this.brokerage;
    this.save();
    return { success: true, orderId, message: `Paper order filled: ${side} ${qty} ${symbol} @ ₹${fillPrice.toFixed(2)}` };
  }

  async modifyOrder(orderId, changes) {
    const order = this.state.orders.find(o => o.orderId === orderId);
    if (order) Object.assign(order, changes);
    this.save();
    return { success: true, message: 'Paper order modified' };
  }

  async cancelOrder(orderId) {
    const order = this.state.orders.find(o => o.orderId === orderId);
    if (order) order.status = 'CANCELLED';
    this.save();
    return { success: true, message: 'Paper order cancelled' };
  }

  async getPositions() { return this.state.positions; }
  async getOrderBook() { return this.state.orders; }
  async getTradeBook() { return this.state.trades; }
  async testConnection() { return { success: true, message: 'Paper trading active', balance: this.state.balance }; }

  resetPortfolio() {
    this.state = { orders: [], positions: [], trades: [], balance: this.capital };
    this.save();
  }
}
