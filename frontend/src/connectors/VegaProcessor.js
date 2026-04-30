/**
 * VegaProcessor — Unified Trading Connector Abstraction
 * Routes all order operations through a pluggable connector interface.
 * Supported connectors: XTS, GETS, Dhan, AlgoEngines Vega (port 3007), Paper Trading
 */

import PaperConnector from './PaperConnector';
import XTSConnector from './XTSConnector';
import BrokerConnector from './BrokerConnector';
import KuberAlphaBridge from './KuberAlphaBridge';

class VegaProcessor {
  constructor() {
    this.connector = null;
    this.connectorType = 'paper';
    this.bridge = null; // Kuber Alpha read-only bridge
  }

  /** Initialize or switch the active connector */
  setConnector(type, config = {}) {
    this.connectorType = type;
    switch (type) {
      case 'xts':
        this.connector = new XTSConnector(config);
        break;
      case 'gets':
        // GETSConnector — placeholder, same interface as XTS
        this.connector = new XTSConnector({ ...config, provider: 'GETS' });
        break;
      case 'dhan':
        this.connector = new BrokerConnector(config.baseUrl);
        break;
      case 'vega':
        this.connector = new XTSConnector({ ...config, provider: 'Vega', baseUrl: config.baseUrl || 'http://127.0.0.1:3007' });
        break;
      case 'paper':
      default:
        this.connector = new PaperConnector(config);
        break;
    }
    return this.connector;
  }

  /** Initialize Kuber Alpha read-only bridge */
  connectKuberAlpha(config) {
    this.bridge = new KuberAlphaBridge(config);
    return this.bridge;
  }

  // ── Unified Order API ──
  async placeOrder(order) {
    if (!this.connector) throw new Error('No connector initialized');
    return this.connector.placeOrder(order);
  }

  async modifyOrder(orderId, changes) {
    if (!this.connector) throw new Error('No connector initialized');
    return this.connector.modifyOrder(orderId, changes);
  }

  async cancelOrder(orderId) {
    if (!this.connector) throw new Error('No connector initialized');
    return this.connector.cancelOrder(orderId);
  }

  async getPositions() {
    if (!this.connector) return [];
    return this.connector.getPositions();
  }

  async getOrderBook() {
    if (!this.connector) return [];
    return this.connector.getOrderBook();
  }

  async getTradeBook() {
    if (!this.connector) return [];
    return this.connector.getTradeBook();
  }

  async testConnection() {
    if (!this.connector) return { success: false, error: 'No connector' };
    return this.connector.testConnection();
  }

  getStatus() {
    return {
      connector: this.connectorType,
      connected: this.connector?.connected || false,
      bridge: this.bridge?.connected || false,
    };
  }
}

// Singleton
const vegaProcessor = new VegaProcessor();
export default vegaProcessor;
