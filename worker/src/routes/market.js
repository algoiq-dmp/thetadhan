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

// POST /api/market/ltp — Get LTP for multiple instruments (fast, for polling)
marketRoutes.post('/ltp', async (c) => {
  try {
    const client = getClient(c);
    const body = await c.req.json();
    const data = await client.getMarketLTP(body);
    return c.json({ success: true, data });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// POST /api/market/quote — Get LTP for multiple instruments (alias)
marketRoutes.post('/quote', async (c) => {
  try {
    const client = getClient(c);
    const body = await c.req.json();
    const data = await client.getMarketLTP(body);
    return c.json({ success: true, data });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// POST /api/market/ohlc — Get LTP + OHLC for instruments
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

// POST /api/market/fullquote — Get LTP + OHLC + Depth + OI + Volume
marketRoutes.post('/fullquote', async (c) => {
  try {
    const client = getClient(c);
    const body = await c.req.json();
    const data = await client.getFullQuote(body);
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

// Helper to get Data API client if configured, otherwise fallback to session client
function getDataClient(c) {
  // Frontend can override token with X-Data-Token, otherwise fallback to env secret, otherwise session token
  const dataToken = c.req.header('X-Data-Token') || c.env.DHAN_DATA_API_TOKEN || c.req.header('Authorization')?.replace('Bearer ', '');
  const dataClientId = c.env.DHAN_DATA_CLIENT_ID || c.req.header('X-Client-Id');
  if (!dataToken || !dataClientId) throw new Error('Missing auth headers and no global Data API credentials found');
  return new DhanClient(c.env, dataToken, dataClientId);
}

// POST /api/market/historical — Historical/Intraday charts from Dhan
marketRoutes.post('/historical', async (c) => {
  try {
    const client = getDataClient(c);
    const body = await c.req.json();
    const isIntraday = body.isIntraday;
    delete body.isIntraday;
    
    // Call the appropriate Dhan endpoint
    const data = isIntraday ? await client.getIntradayChart(body) : await client.getHistorical(body);
    return c.json({ success: true, data });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// POST /api/market/intraday — Intraday chart data
marketRoutes.post('/intraday', async (c) => {
  try {
    const client = getDataClient(c);
    const body = await c.req.json();
    const data = await client.getIntradayChart(body);
    return c.json({ success: true, data });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// POST /api/market/expirylist — Get available option expiry dates
marketRoutes.post('/expirylist', async (c) => {
  try {
    const client = getClient(c);
    const body = await c.req.json();
    const data = await client.getExpiryList(body);
    return c.json({ success: true, data });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
