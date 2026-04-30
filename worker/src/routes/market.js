/**
 * Market Routes — Quotes, option chain, historical data
 */
import { Hono } from 'hono';
import { DhanClient } from '../services/dhanClient.js';

export const marketRoutes = new Hono();

function getClient(c) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  const clientId = c.req.header('X-Client-Id');
  if (!token || !clientId) throw new Error('Missing auth headers');
  return new DhanClient(c.env, token, clientId);
}

// POST /api/market/quote — Get LTP for multiple instruments
marketRoutes.post('/quote', async (c) => {
  try {
    const client = getClient(c);
    const body = await c.req.json();
    const data = await client.getMarketQuote(body);
    return c.json({ success: true, data });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// POST /api/market/ohlc — Get OHLC for instruments
marketRoutes.post('/ohlc', async (c) => {
  try {
    const client = getClient(c);
    const body = await c.req.json();
    const data = await client.getMarketOHLC(body);
    return c.json({ success: true, data });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// POST /api/market/chain — Option chain
marketRoutes.post('/chain', async (c) => {
  try {
    const client = getClient(c);
    const body = await c.req.json();
    const data = await client.getOptionChain(body);
    return c.json({ success: true, data });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// POST /api/market/historical — Historical candle data
marketRoutes.post('/historical', async (c) => {
  try {
    const client = getClient(c);
    const body = await c.req.json();
    const data = await client.getHistorical(body);
    return c.json({ success: true, data });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// POST /api/market/intraday — Intraday chart data
marketRoutes.post('/intraday', async (c) => {
  try {
    const client = getClient(c);
    const body = await c.req.json();
    const data = await client.getIntradayChart(body);
    return c.json({ success: true, data });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
