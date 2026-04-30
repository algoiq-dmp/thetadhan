import { useEffect, useRef, useState } from 'react';
import { FEED_URL } from '../config.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useMarketStore } from '../store/useMarketStore.js';
import { parseBinaryTick } from '../lib/binaryParser.js';

export function useDhanFeed() {
  const ws = useRef(null);
  const [status, setStatus] = useState('disconnected');
  const token = useAuthStore(state => state.token);
  const clientId = useAuthStore(state => state.clientId);
  const updateMarketData = useMarketStore(state => state.updateMarketData);
  
  // Pending subscriptions if we are not connected yet
  const pendingSubs = useRef(new Set());

  useEffect(() => {
    if (!token || !clientId) return;

    function connect() {
      setStatus('connecting');
      ws.current = new WebSocket(FEED_URL);
      // We need arraybuffer to parse binary feed
      ws.current.binaryType = 'arraybuffer';

      ws.current.onopen = () => {
        setStatus('authenticating');
        // Tell the Durable Object our Dhan credentials so it can connect upstream
        ws.current.send(JSON.stringify({
          type: 'auth',
          token,
          clientId
        }));
      };

      ws.current.onmessage = (event) => {
        // If it's a string, it's a control message from our DO
        if (typeof event.data === 'string') {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'auth_ack') {
              setStatus('connected');
              flushPendingSubs();
            } else if (msg.type === 'error') {
              console.error('[Feed] DO Error:', msg.message);
            }
          } catch (e) {}
          return;
        }

        // If it's binary, it's a tick from Dhan!
        if (event.data instanceof ArrayBuffer) {
          const tick = parseBinaryTick(event.data);
          if (tick.type !== 'unknown') {
            updateMarketData([tick]);
          }
        }
      };

      ws.current.onclose = () => {
        setStatus('disconnected');
        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      ws.current.onerror = (err) => {
        console.error('[Feed] WebSocket error', err);
      };
    }

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [token, clientId, updateMarketData]);

  function flushPendingSubs() {
    if (ws.current && status === 'connected' && pendingSubs.current.size > 0) {
      ws.current.send(JSON.stringify({
        type: 'subscribe',
        instruments: Array.from(pendingSubs.current)
      }));
      pendingSubs.current.clear();
    }
  }

  function subscribe(instruments) {
    if (ws.current && status === 'connected') {
      ws.current.send(JSON.stringify({
        type: 'subscribe',
        instruments
      }));
    } else {
      instruments.forEach(i => pendingSubs.current.add(i));
    }
  }

  function unsubscribe(instruments) {
    if (ws.current && status === 'connected') {
      ws.current.send(JSON.stringify({
        type: 'unsubscribe',
        instruments
      }));
    }
    // Remove from pending if they were waiting
    instruments.forEach(i => pendingSubs.current.delete(i));
  }

  return { status, subscribe, unsubscribe };
}
