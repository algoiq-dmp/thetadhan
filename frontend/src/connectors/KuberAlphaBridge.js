/**
 * KuberAlphaBridge — Read-only connection to Kuber Alpha .NET Gateway
 * 
 * ARCHITECTURAL RULE: This bridge is READ-ONLY.
 * - CAN read: Positions, LTP stream, Engine health, Strategy status
 * - CANNOT: Place orders, modify strategies, trigger kill-switch
 * 
 * Orders from Theta Yantra always go through its own VegaProcessor connector,
 * never through Kuber Alpha to avoid interfering with algo trading.
 */

export default class KuberAlphaBridge {
  constructor(config = {}) {
    this.gatewayUrl = config.gatewayUrl || 'http://127.0.0.1:5000';
    this.connected = false;
    this.syncOptions = config.sync || { positions: true, ltp: true, engineHealth: true, orders: false };
  }

  async connect() {
    try {
      const res = await fetch(`${this.gatewayUrl}/api/health`).catch(() => null);
      if (res && res.ok) {
        this.connected = true;
        return { success: true, message: 'Kuber Alpha bridge connected (read-only)' };
      }
      return { success: false, error: 'Cannot reach Kuber Alpha Gateway' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  disconnect() {
    this.connected = false;
  }

  /** Read algo positions (display only) */
  async getAlgoPositions() {
    if (!this.connected || !this.syncOptions.positions) return [];
    const res = await fetch(`${this.gatewayUrl}/api/positions`).catch(() => null);
    return res ? res.json() : [];
  }

  /** Read engine health status */
  async getEngineHealth() {
    if (!this.connected || !this.syncOptions.engineHealth) return {};
    const res = await fetch(`${this.gatewayUrl}/api/health/engines`).catch(() => null);
    return res ? res.json() : {};
  }

  /** Read strategy status */
  async getStrategyStatus() {
    if (!this.connected) return [];
    const res = await fetch(`${this.gatewayUrl}/api/strategies`).catch(() => null);
    return res ? res.json() : [];
  }

  getStatus() {
    return { connected: this.connected, gateway: this.gatewayUrl, sync: this.syncOptions, mode: 'READ-ONLY' };
  }
}
