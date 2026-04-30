/**
 * Instrument Routes — Search, F&O list, sync from D1
 */
import { Hono } from 'hono';

export const instrumentRoutes = new Hono();

// GET /api/instruments/search?q=RELIANCE&segment=NSE_FNO
instrumentRoutes.get('/search', async (c) => {
  const q = c.req.query('q') || '';
  const segment = c.req.query('segment') || '';
  const limit = parseInt(c.req.query('limit')) || 50;

  if (q.length < 2) {
    return c.json({ success: true, instruments: [], message: 'Query too short (min 2 chars)' });
  }

  let sql = `SELECT * FROM instruments WHERE (symbol LIKE ? OR trading_symbol LIKE ?)`;
  const params = [`%${q}%`, `%${q}%`];

  if (segment) {
    sql += ` AND exchange_segment = ?`;
    params.push(segment);
  }

  sql += ` ORDER BY symbol LIMIT ?`;
  params.push(limit);

  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ success: true, instruments: results });
});

// POST /api/instruments/batch — Batch lookup by exact symbols (single D1 query)
// Body: { symbols: ['NIFTY', 'BANKNIFTY', 'RELIANCE', ...] }
instrumentRoutes.post('/batch', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const symbols = (body.symbols || []).map(s => s.toUpperCase()).filter(Boolean);

  if (symbols.length === 0) {
    return c.json({ success: true, instruments: [] });
  }

  // Cap at 200 symbols per batch to protect D1
  const capped = symbols.slice(0, 200);

  // Build IN clause: SELECT where symbol IN (?, ?, ...)
  const placeholders = capped.map(() => '?').join(',');

  // For each symbol, get the most relevant instrument (prefer index/futures, then equity)
  const sql = `
    SELECT * FROM instruments
    WHERE symbol IN (${placeholders})
    ORDER BY
      CASE exchange_segment
        WHEN 'NSE_FNO' THEN 1
        WHEN 'NSE_EQ'  THEN 2
        ELSE 3
      END,
      CASE instrument_type
        WHEN 'FUTIDX' THEN 1
        WHEN 'FUTSTK' THEN 2
        WHEN 'OPTIDX' THEN 3
        WHEN 'OPTSTK' THEN 4
        ELSE 5
      END,
      expiry_date ASC
    LIMIT ${capped.length * 3}
  `;

  const { results } = await c.env.DB.prepare(sql).bind(...capped).all();

  // Deduplicate — return one best result per symbol
  const seen = new Set();
  const deduped = results.filter(r => {
    if (seen.has(r.symbol)) return false;
    seen.add(r.symbol);
    return true;
  });

  return c.json({ success: true, count: deduped.length, instruments: deduped });
});

// GET /api/instruments/fno — All F&O tradeable symbols (unique underlyings)
instrumentRoutes.get('/search', async (c) => {
  const q = c.req.query('q') || '';
  if (q.length < 2) return c.json({ success: true, instruments: [] });

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM instruments 
     WHERE symbol LIKE ? OR trading_symbol LIKE ? 
     LIMIT 50`
  ).bind(`%${q}%`, `%${q}%`).all();

  return c.json({ success: true, instruments: results });
});

instrumentRoutes.get('/fno', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT DISTINCT symbol, MIN(security_id) as security_id, exchange_segment, 
            lot_size, MIN(expiry_date) as nearest_expiry
     FROM instruments 
     WHERE exchange_segment = 'NSE_FNO' 
       AND instrument_type IN ('FUTSTK', 'FUTIDX')
       AND expiry_date >= date('now')
     GROUP BY symbol
     ORDER BY symbol`
  ).all();

  return c.json({ success: true, count: results.length, instruments: results });
});

// GET /api/instruments/chain/:symbol — All strikes for a symbol
instrumentRoutes.get('/chain/:symbol', async (c) => {
  const symbol = c.req.param('symbol').toUpperCase();
  const expiry = c.req.query('expiry') || '';

  let sql = `SELECT * FROM instruments 
     WHERE symbol = ? AND exchange_segment = 'NSE_FNO'
       AND instrument_type IN ('OPTSTK', 'OPTIDX')`;
  const params = [symbol];

  if (expiry) {
    sql += ` AND expiry_date = ?`;
    params.push(expiry);
  } else {
    // Nearest expiry
    sql += ` AND expiry_date >= date('now')`;
  }

  sql += ` ORDER BY strike_price, option_type`;

  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ success: true, symbol, count: results.length, strikes: results });
});

// GET /api/instruments/expiries/:symbol — All expiry dates for a symbol
instrumentRoutes.get('/expiries/:symbol', async (c) => {
  const symbol = c.req.param('symbol').toUpperCase();
  const { results } = await c.env.DB.prepare(
    `SELECT DISTINCT expiry_date FROM instruments 
     WHERE symbol = ? AND exchange_segment = 'NSE_FNO'
       AND expiry_date >= date('now')
     ORDER BY expiry_date`
  ).bind(symbol).all();

  return c.json({
    success: true,
    symbol,
    expiries: results.map(r => r.expiry_date),
  });
});

// GET /api/instruments/stats — Instrument DB stats for diagnostics
instrumentRoutes.get('/stats', async (c) => {
  const total = await c.env.DB.prepare('SELECT COUNT(*) as count FROM instruments').first();
  const fno = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM instruments WHERE exchange_segment = 'NSE_FNO'`
  ).first();
  const equity = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM instruments WHERE exchange_segment = 'NSE_EQ'`
  ).first();
  const futures = await c.env.DB.prepare(
    `SELECT COUNT(DISTINCT symbol) as count FROM instruments 
     WHERE instrument_type IN ('FUTSTK', 'FUTIDX') AND expiry_date >= date('now')`
  ).first();

  return c.json({
    success: true,
    stats: {
      totalInstruments: total?.count || 0,
      fnoInstruments: fno?.count || 0,
      equityInstruments: equity?.count || 0,
      activeUnderlyings: futures?.count || 0,
    },
  });
});

// GET /api/instruments/sync — Manual trigger to sync Dhan CSV to D1
instrumentRoutes.get('/sync', async (c) => {
  try {
    const res = await fetch('https://images.dhan.co/api-data/api-scrip-master.csv');
    if (!res.ok) throw new Error(`Dhan CSV fetch failed: ${res.status}`);
    const csv = await res.text();
    
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    // Find column indices
    const idx = {};
    ['SEM_SMST_SECURITY_ID', 'SEM_TRADING_SYMBOL', 'SEM_EXM_EXCH_ID', 'SEM_SEGMENT',
     'SEM_INSTRUMENT_NAME', 'SEM_LOT_UNITS', 'SEM_EXPIRY_DATE', 'SEM_STRIKE_PRICE',
     'SEM_OPTION_TYPE', 'SEM_CUSTOM_SYMBOL', 'SEM_EXPIRY_FLAG'
    ].forEach(col => { idx[col] = headers.indexOf(col); });

    // Clear existing
    await c.env.DB.prepare('DELETE FROM instruments').run();

    let count = 0;
    const batchSize = 50;
    
    // Process in batches
    for (let i = 1; i < lines.length; i += batchSize) {
      const batch = [];
      for (let j = i; j < Math.min(i + batchSize, lines.length); j++) {
        const cols = lines[j].split(',').map(c => c.trim().replace(/"/g, ''));
        if (!cols[idx.SEM_SMST_SECURITY_ID]) continue;

        // Only import NSE_FNO and NSE_EQ
        const exch = cols[idx.SEM_EXM_EXCH_ID] || '';
        const seg = cols[idx.SEM_SEGMENT] || '';
        let segment = '';
        
        if (exch === 'NSE' && seg === 'D') segment = 'NSE_FNO';
        else if (exch === 'NSE' && seg === 'C') segment = 'NSE_EQ';
        else continue;

        const symbol = cols[idx.SEM_CUSTOM_SYMBOL] || cols[idx.SEM_TRADING_SYMBOL] || '';
        
        batch.push(
          c.env.DB.prepare(
            `INSERT OR REPLACE INTO instruments (security_id, symbol, trading_symbol, exchange_segment, instrument_type, lot_size, expiry_date, strike_price, option_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            cols[idx.SEM_SMST_SECURITY_ID],
            symbol,
            cols[idx.SEM_TRADING_SYMBOL],
            segment,
            cols[idx.SEM_INSTRUMENT_NAME] || '',
            parseInt(cols[idx.SEM_LOT_UNITS]) || 1,
            cols[idx.SEM_EXPIRY_DATE] || null,
            parseFloat(cols[idx.SEM_STRIKE_PRICE]) || null,
            cols[idx.SEM_OPTION_TYPE] || null
          )
        );
        count++;
      }
      if (batch.length > 0) {
        await c.env.DB.batch(batch);
      }
    }

    // Update settings with last sync time
    await c.env.DB.prepare(
      `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('last_instrument_sync', ?, datetime('now'))`
    ).bind(JSON.stringify(new Date().toISOString())).run();

    return c.json({ success: true, message: `Synced ${count} instruments` });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
