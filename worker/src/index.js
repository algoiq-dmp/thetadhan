/**
 * ═══════════════════════════════════════════════════════════════
 *  ThetaDhan — Worker Entry Point (Hono)
 * ═══════════════════════════════════════════════════════════════
 *  Cloudflare Worker serving as the API backend for ThetaDhan.
 *  Routes all broker requests through adapter pattern.
 *  Currently: Dhan. Future: Upstox, XTS, Groww, Shoonya, Fyers.
 * ═══════════════════════════════════════════════════════════════
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth.js';
import { orderRoutes } from './routes/orders.js';
import { portfolioRoutes } from './routes/portfolio.js';
import { marketRoutes } from './routes/market.js';
import { instrumentRoutes } from './routes/instruments.js';
import { diagnosticsRoutes } from './routes/diagnostics.js';
import { FeedRelay } from './feed/FeedRelay.js';

const app = new Hono();

// ─── CORS ───
app.use('*', cors({
  origin: ['https://thetadhan.pages.dev', 'http://localhost:5173', 'http://localhost:5174'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Broker'],
  credentials: true,
}));

// ─── Health ───
app.get('/', (c) => c.json({
  name: 'ThetaDhan API',
  version: '1.0.0',
  status: 'live',
  broker: 'dhan',
  timestamp: new Date().toISOString(),
}));

app.get('/api/health', (c) => c.json({ status: 'ok', edge: c.req.raw.cf?.colo || 'local' }));

// ─── Route Groups ───
app.route('/api/auth', authRoutes);
app.route('/api/orders', orderRoutes);
app.route('/api/portfolio', portfolioRoutes);
app.route('/api/market', marketRoutes);
app.route('/api/instruments', instrumentRoutes);
app.route('/api/diagnostics', diagnosticsRoutes);

// ─── WebSocket Feed Upgrade ───
app.get('/api/feed', async (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.json({ error: 'Expected WebSocket upgrade' }, 426);
  }
  // Route to Durable Object
  const id = c.env.FEED_RELAY.idFromName('feed-singleton');
  const obj = c.env.FEED_RELAY.get(id);
  return obj.fetch(c.req.raw);
});

// ─── Cron: Daily instrument sync ───
async function scheduled(event, env, ctx) {
  console.log('[Cron] Daily instrument sync triggered');
  // Fetch Dhan instrument CSV and populate D1
  try {
    const res = await fetch('https://images.dhan.co/api-data/api-scrip-master.csv');
    if (!res.ok) throw new Error(`Dhan CSV fetch failed: ${res.status}`);
    const csv = await res.text();
    await syncInstrumentsToD1(csv, env.DB);
    console.log('[Cron] Instrument sync complete');
  } catch (err) {
    console.error('[Cron] Instrument sync failed:', err.message);
  }
}

async function syncInstrumentsToD1(csv, db) {
  const lines = csv.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

  // Find column indices
  const idx = {};
  ['SEM_SMST_SECURITY_ID', 'SEM_TRADING_SYMBOL', 'SEM_EXM_EXCH_ID', 'SEM_SEGMENT',
   'SEM_INSTRUMENT_NAME', 'SEM_LOT_UNITS', 'SEM_EXPIRY_DATE', 'SEM_STRIKE_PRICE',
   'SEM_OPTION_TYPE', 'SEM_CUSTOM_SYMBOL', 'SEM_EXPIRY_FLAG'
  ].forEach(col => { idx[col] = headers.indexOf(col); });

  // Clear and re-insert (batch of 100)
  await db.prepare('DELETE FROM instruments').run();

  const batchSize = 50;
  for (let i = 1; i < lines.length; i += batchSize) {
    const batch = [];
    for (let j = i; j < Math.min(i + batchSize, lines.length); j++) {
      const cols = lines[j].split(',').map(c => c.trim().replace(/"/g, ''));
      if (!cols[idx.SEM_SMST_SECURITY_ID]) continue;

      // Only import NSE F&O + Equity segments
      const segment = cols[idx.SEM_SEGMENT] || '';
      if (!['NSE_EQ', 'NSE_FNO', 'BSE_EQ', 'MCX_COMM', 'NSE_CURRENCY'].includes(segment)) continue;

      batch.push(
        db.prepare(
          `INSERT OR REPLACE INTO instruments (security_id, symbol, trading_symbol, exchange_segment, instrument_type, lot_size, expiry_date, strike_price, option_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          cols[idx.SEM_SMST_SECURITY_ID],
          cols[idx.SEM_CUSTOM_SYMBOL] || cols[idx.SEM_TRADING_SYMBOL],
          cols[idx.SEM_TRADING_SYMBOL],
          segment,
          cols[idx.SEM_INSTRUMENT_NAME] || '',
          parseInt(cols[idx.SEM_LOT_UNITS]) || 1,
          cols[idx.SEM_EXPIRY_DATE] || null,
          parseFloat(cols[idx.SEM_STRIKE_PRICE]) || null,
          cols[idx.SEM_OPTION_TYPE] || null
        )
      );
    }
    if (batch.length > 0) {
      await db.batch(batch);
    }
  }
}

// ─── Export ───
export default {
  fetch: app.fetch,
  scheduled,
};
export { FeedRelay };
