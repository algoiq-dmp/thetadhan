/**
 * FeedRelay — Durable Object for WebSocket market data relay
 *
 * Architecture:
 *   Browser ◄──WS──► FeedRelay DO ◄──WS──► Dhan Feed (wss://api-feed.dhan.co)
 *
 * Why Durable Object?
 *   - Workers can't maintain persistent WebSocket connections
 *   - DO keeps ONE connection to Dhan, relays to all browser clients
 *   - Uses WebSocket Hibernation API for cost-efficiency on free tier
 */

export class FeedRelay {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.clients = new Set();
    this.dhanWs = null;
    this.dhanToken = null;
    this.dhanClientId = null;
    this.subscribedInstruments = new Map(); // key: "segment:secId" → count of clients wanting it
  }

  async fetch(request) {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.state.acceptWebSocket(server);
      this.clients.add(server);

      console.log(`[FeedRelay] Client connected. Total: ${this.clients.size}`);

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('Expected WebSocket', { status: 400 });
  }

  async webSocketMessage(ws, message) {
    try {
      const msg = JSON.parse(message);

      switch (msg.type) {
        case 'auth':
          // Client sends Dhan credentials for the upstream connection
          this.dhanToken = msg.token;
          this.dhanClientId = msg.clientId;
          await this.connectToDhan();
          ws.send(JSON.stringify({ type: 'auth_ack', status: 'connected' }));
          break;

        case 'subscribe':
          // Subscribe to instruments: [{ exchange: "NSE_FNO", securityId: "1333" }]
          if (msg.instruments && Array.isArray(msg.instruments)) {
            for (const inst of msg.instruments) {
              const key = `${inst.exchange}:${inst.securityId}`;
              this.subscribedInstruments.set(key, (this.subscribedInstruments.get(key) || 0) + 1);
            }
            this.sendSubscribeToDhan(msg.instruments);
          }
          break;

        case 'unsubscribe':
          if (msg.instruments && Array.isArray(msg.instruments)) {
            for (const inst of msg.instruments) {
              const key = `${inst.exchange}:${inst.securityId}`;
              const count = (this.subscribedInstruments.get(key) || 1) - 1;
              if (count <= 0) this.subscribedInstruments.delete(key);
              else this.subscribedInstruments.set(key, count);
            }
            this.sendUnsubscribeToDhan(msg.instruments);
          }
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
          break;
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
    }
  }

  async webSocketClose(ws, code, reason) {
    this.clients.delete(ws);
    console.log(`[FeedRelay] Client disconnected. Remaining: ${this.clients.size}`);

    // If no clients, disconnect from Dhan to save resources
    if (this.clients.size === 0) {
      this.disconnectFromDhan();
    }
  }

  async webSocketError(ws, error) {
    this.clients.delete(ws);
    console.error(`[FeedRelay] Client error:`, error);
  }

  // ─── Dhan Upstream Connection ───

  async connectToDhan() {
    if (this.dhanWs) return; // Already connected
    if (!this.dhanToken || !this.dhanClientId) return;

    const feedUrl = this.env.DHAN_FEED_URL || 'wss://api-feed.dhan.co';
    const url = `${feedUrl}?version=2&token=${this.dhanToken}&clientId=${this.dhanClientId}&authType=2`;

    try {
      const resp = await fetch(url, {
        headers: { Upgrade: 'websocket' },
      });

      this.dhanWs = resp.webSocket;
      if (!this.dhanWs) {
        console.error('[FeedRelay] Failed to upgrade Dhan WebSocket');
        return;
      }

      this.dhanWs.accept();

      this.dhanWs.addEventListener('message', (event) => {
        // Relay binary data directly to all connected browser clients
        for (const client of this.clients) {
          try {
            client.send(event.data);
          } catch { /* client may have disconnected */ }
        }
      });

      this.dhanWs.addEventListener('close', (event) => {
        console.warn(`[FeedRelay] Dhan feed closed: ${event.code}`);
        this.dhanWs = null;
        // Reconnect after 5s if clients exist
        if (this.clients.size > 0) {
          setTimeout(() => this.connectToDhan(), 5000);
        }
      });

      this.dhanWs.addEventListener('error', (event) => {
        console.error('[FeedRelay] Dhan feed error');
        this.dhanWs = null;
      });

      console.log('[FeedRelay] Connected to Dhan feed');
    } catch (err) {
      console.error('[FeedRelay] Dhan connect failed:', err.message);
      this.dhanWs = null;
    }
  }

  disconnectFromDhan() {
    if (this.dhanWs) {
      try {
        this.dhanWs.send(JSON.stringify({ RequestCode: 12 }));
        this.dhanWs.close();
      } catch {}
      this.dhanWs = null;
      console.log('[FeedRelay] Disconnected from Dhan feed');
    }
  }

  sendSubscribeToDhan(instruments) {
    if (!this.dhanWs) return;
    // Batch max 100 per message
    for (let i = 0; i < instruments.length; i += 100) {
      const batch = instruments.slice(i, i + 100);
      this.dhanWs.send(JSON.stringify({
        RequestCode: 15, // Ticker data
        InstrumentCount: batch.length,
        InstrumentList: batch.map(inst => ({
          ExchangeSegment: inst.exchange,
          SecurityId: String(inst.securityId),
        })),
      }));
    }
  }

  sendUnsubscribeToDhan(instruments) {
    if (!this.dhanWs) return;
    this.dhanWs.send(JSON.stringify({
      RequestCode: 16,
      InstrumentCount: instruments.length,
      InstrumentList: instruments.map(inst => ({
        ExchangeSegment: inst.exchange,
        SecurityId: String(inst.securityId),
      })),
    }));
  }
}
