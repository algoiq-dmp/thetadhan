/**
 * WebSocket Manager — Dhan FeedRelay Integration
 * Connects to Cloudflare FeedRelay DO, decodes Dhan binary ticks.
 */

class WebSocketManager {
  constructor() {
    this.ws = null;
    this.url = import.meta.env.VITE_WS_URL || 'wss://thetadhan-api.parlight2.workers.dev/api/feed';
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.channels = new Set();
    this.listeners = new Map();
    this.messageQueue = [];
    this.maxQueueSize = 100;
    this.stats = { messagesReceived: 0, messagesSent: 0, reconnections: 0, lastMessageAt: null, connectTime: null };
  }

  connect(url) {
    if (url) this.url = url;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer';
      this.stats.connectTime = Date.now();

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('[WS] Connected to Dhan FeedRelay');

        // Send auth with both token AND clientId (Bug #8 fix)
        const token = localStorage.getItem('dhan_token');
        const clientId = localStorage.getItem('dhan_client_id');
        if (token && clientId) {
          this._send({ type: 'auth', token, clientId });
        }

        // Flush queued messages
        while (this.messageQueue.length > 0) {
          this._send(this.messageQueue.shift());
        }

        this._emit('connection', { status: 'connected', url: this.url });
      };

      this.ws.onmessage = (event) => {
        this.stats.messagesReceived++;
        this.stats.lastMessageAt = Date.now();

        if (event.data instanceof ArrayBuffer) {
          this._handleBinaryTick(event.data);
        } else {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'pong') return;
            if (msg.type === 'auth_ack') {
              console.log('[WS] Dhan feed authenticated');
              this._emit('connection', { status: 'feed-authenticated' });
              return;
            }
            if (msg.type === 'order_update') this._emit('order-updates', msg.data);
            if (msg.type === 'engine_status') this._emit('engine-status', msg.data);
          } catch { /* non-JSON */ }
        }
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;
        console.log(`[WS] Disconnected (${event.code})`);
        this._emit('connection', { status: 'disconnected', code: event.code });
        this._scheduleReconnect();
      };

      this.ws.onerror = () => {
        this._emit('connection', { status: 'error' });
      };
    } catch (err) {
      console.warn('[WS] Connection failed:', err.message);
      this._scheduleReconnect();
    }
  }

  /**
   * Dhan Binary Packet Parser (Bug #9 fix)
   * Dhan Packet structure (from Dhan docs):
   *   Byte 0:      Feed Response Code (1=Ticker, 2=Quote, 3=Full, etc.)
   *   Byte 1:      Exchange Code
   *   Bytes 2-5:   Security ID (uint32 LE)
   *   Bytes 6-9:   LTP (uint32 LE, divide by 100 for actual price)
   *   Bytes 10-13: LTQ (uint32 LE)
   *   Bytes 14-17: Total Traded Qty / Vol (uint32 LE)
   *   Bytes 18-21: Avg Trade Price (uint32 LE, /100)
   *   Bytes 22-25: Open (uint32 LE, /100)
   *   Bytes 26-29: Close/Prev Close (uint32 LE, /100)
   *   Bytes 30-33: High (uint32 LE, /100)
   *   Bytes 34-37: Low (uint32 LE, /100)
   *   Bytes 38-45: OI (uint64 LE)
   */
  _handleBinaryTick(buffer) {
    try {
      if (buffer.byteLength < 10) return;
      const view = new DataView(buffer);
      
      const feedCode = view.getUint8(0);
      // feedCode 1 = Ticker, 2 = Quote, 3 = Full packet
      if (feedCode !== 1 && feedCode !== 2 && feedCode !== 3) return;

      const securityId = view.getUint32(2, true);
      const ltp = view.getUint32(6, true) / 100;

      let tick = { securityId, ltp, ts: Date.now() };

      if (buffer.byteLength >= 38) {
        tick.volume = view.getUint32(14, true);
        tick.prevClose = view.getUint32(26, true) / 100;
        tick.todayHigh = view.getUint32(30, true) / 100;
        tick.todayLow = view.getUint32(34, true) / 100;
        tick.change = +(ltp - tick.prevClose).toFixed(2);
        tick.changePct = tick.prevClose > 0 ? +((tick.change / tick.prevClose) * 100).toFixed(2) : 0;
      }

      if (buffer.byteLength >= 46) {
        tick.oi = Number(view.getBigUint64(38, true));
      }

      this._emit('market-data', tick);
    } catch (err) {
      console.warn('[WS] Binary parse error:', err.message);
    }
  }

  subscribe(instruments) {
    // instruments: Array<{ exchange, securityId }>
    const msg = { type: 'subscribe', instruments };
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this._send(msg);
    } else {
      if (this.messageQueue.length < this.maxQueueSize) {
        this.messageQueue.push(msg);
      }
    }
  }

  unsubscribe(instruments) {
    this._send({ type: 'unsubscribe', instruments });
  }

  on(channel, callback) {
    if (!this.listeners.has(channel)) this.listeners.set(channel, new Set());
    this.listeners.get(channel).add(callback);
    return () => this.listeners.get(channel)?.delete(callback);
  }

  off(channel, callback) {
    this.listeners.get(channel)?.delete(callback);
  }

  startHeartbeat(intervalMs = 30000) {
    this._heartbeatInterval = setInterval(() => {
      if (this.isConnected) this._send({ type: 'ping', ts: Date.now() });
    }, intervalMs);
  }

  stopHeartbeat() {
    if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
  }

  send(channel, data) {
    this._send({ type: 'message', channel, data });
  }

  disconnect() {
    this.stopHeartbeat();
    if (this._reconnectTimer) clearTimeout(this._reconnectTimer);
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  _send(msg) {
    try {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
        this.stats.messagesSent++;
      }
    } catch (err) {
      console.warn('[WS] Send error:', err.message);
    }
  }

  _emit(channel, data) {
    if (this.listeners.has(channel)) {
      this.listeners.get(channel).forEach(cb => {
        try { cb(data); } catch (err) { console.error('[WS] Emit error:', err); }
      });
    }
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach(cb => cb(data));
    }
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= 10) return;
    const delay = 2000 * Math.pow(1.5, this.reconnectAttempts);
    this.reconnectAttempts++;
    this.stats.reconnections++;
    console.log(`[WS] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})`);
    this._reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  getStatus() {
    return {
      connected: this.isConnected,
      url: this.url,
      stats: { ...this.stats },
      reconnectAttempts: this.reconnectAttempts,
      queueSize: this.messageQueue.length,
      uptime: this.stats.connectTime ? Math.round((Date.now() - this.stats.connectTime) / 1000) : 0,
    };
  }
}

const wsManager = new WebSocketManager();
export default wsManager;
