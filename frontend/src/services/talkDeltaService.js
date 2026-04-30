/**
 * TalkDelta Service — Live Feed & Post-Trade Analytics
 * 
 * Our own product. Provides IBT/UDP broadcast feed + portfolio analytics.
 * Feeds Lakshmi engine with real-time ticks.
 */

const TALKDELTA_BASE = 'http://localhost:3008'; // TalkDelta engine port

class TalkDeltaService {
  constructor() {
    this.isConnected = false;
    this.feedStatus = 'disconnected'; // disconnected | connecting | live | error
    this.lastTick = null;
    this.tickCount = 0;
    this.lastError = null;
  }

  // ── Feed Status ──
  async getFeedStatus() {
    try {
      const res = await fetch(`${TALKDELTA_BASE}/api/feed/status`);
      const data = await res.json();
      this.feedStatus = data.status || 'disconnected';
      this.isConnected = data.status === 'live';
      return data;
    } catch (err) {
      this.feedStatus = 'disconnected';
      this.isConnected = false;
      return { status: 'disconnected', error: err.message };
    }
  }

  // ── Portfolio Analysis ──
  async getPortfolio() {
    try {
      const res = await fetch(`${TALKDELTA_BASE}/api/portfolio`);
      return await res.json();
    } catch (err) {
      console.warn('[TalkDelta] Portfolio fetch failed:', err.message);
      return null;
    }
  }

  // ── Risk Metrics ──
  async getRiskMetrics() {
    try {
      const res = await fetch(`${TALKDELTA_BASE}/api/risk-metrics`);
      return await res.json();
    } catch (err) {
      console.warn('[TalkDelta] Risk metrics failed:', err.message);
      return null;
    }
  }

  // ── Trade Reports ──
  async getTradeReport(period = 'daily') {
    try {
      const res = await fetch(`${TALKDELTA_BASE}/api/reports/${period}`);
      return await res.json();
    } catch (err) {
      console.warn('[TalkDelta] Report failed:', err.message);
      return null;
    }
  }

  // ── Broadcast Settings ──
  async getBroadcastSettings() {
    try {
      const res = await fetch(`${TALKDELTA_BASE}/api/settings`);
      return await res.json();
    } catch (err) {
      return null;
    }
  }

  async saveBroadcastSettings(settings) {
    try {
      const res = await fetch(`${TALKDELTA_BASE}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      feedStatus: this.feedStatus,
      tickCount: this.tickCount,
      lastError: this.lastError,
    };
  }
}

const talkDeltaService = new TalkDeltaService();
export default talkDeltaService;
