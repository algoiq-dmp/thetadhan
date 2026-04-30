/**
 * Diagnostics Routes — Real-time platform health & usage monitoring
 * Tracks: API limits, DB size, connection health, performance metrics
 */
import { Hono } from 'hono';

export const diagnosticsRoutes = new Hono();

// GET /api/diagnostics — Full platform health dashboard data
diagnosticsRoutes.get('/', async (c) => {
  const startTime = Date.now();

  // 1. Cloudflare D1 Database Stats
  const dbStats = await getDbStats(c.env.DB);

  // 2. API Usage Today
  const apiUsage = await getApiUsage(c.env.DB);

  // 3. Dhan API Health Check
  const dhanHealth = await checkDhanHealth(c);

  // 4. Instrument DB Freshness
  const instrumentFreshness = await getInstrumentFreshness(c.env.DB);

  const responseTime = Date.now() - startTime;

  return c.json({
    success: true,
    timestamp: new Date().toISOString(),
    diagnosticsResponseMs: responseTime,
    edge: c.req.raw.cf?.colo || 'local',

    // ─── Platform Limits (Cloudflare Free Tier) ───
    limits: {
      workers: {
        maxRequestsPerDay: 100000,
        cpuMsPerRequest: 10,
        maxSubrequests: 50,
      },
      d1: {
        maxStorageMB: 500,
        maxRowsReadPerDay: 5000000,
        maxRowsWrittenPerDay: 100000,
        currentStorageMB: dbStats.totalSizeMB,
        storageUsedPercent: ((dbStats.totalSizeMB / 500) * 100).toFixed(2),
      },
      dhan: {
        maxRequestsPerSec: 20,
        maxWebSocketConnections: 5,
        maxInstrumentsPerWS: 5000,
        tokenValidityHours: 24,
      },
    },

    // ─── Current Usage ───
    usage: {
      apiCallsToday: apiUsage.totalCalls,
      apiCallsByEndpoint: apiUsage.byEndpoint,
      remainingCalls: Math.max(0, 100000 - apiUsage.totalCalls),
      usagePercent: ((apiUsage.totalCalls / 100000) * 100).toFixed(2),
    },

    // ─── Database Health ───
    database: {
      totalTables: dbStats.tableCount,
      totalRows: dbStats.totalRows,
      tables: dbStats.tables,
      instrumentsLoaded: dbStats.instrumentCount,
      lastInstrumentSync: instrumentFreshness.lastSync,
      instrumentAge: instrumentFreshness.ageDescription,
    },

    // ─── Connections ───
    connections: {
      dhan: dhanHealth,
      // Future: upstox, xts, etc.
    },
  });
});

// GET /api/diagnostics/ping — Ultra-light latency test
diagnosticsRoutes.get('/ping', async (c) => {
  return c.json({ pong: true, ts: Date.now(), edge: c.req.raw.cf?.colo || 'local' });
});

// GET /api/diagnostics/dhan — Detailed Dhan API health
diagnosticsRoutes.get('/dhan', async (c) => {
  const health = await checkDhanHealth(c);
  return c.json({ success: true, dhan: health });
});

// ─── Helpers ───

async function getDbStats(db) {
  try {
    // Get table list and row counts
    const tablesResult = await db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'`
    ).all();

    const tables = {};
    let totalRows = 0;
    let instrumentCount = 0;

    for (const t of tablesResult.results || []) {
      const countResult = await db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).first();
      const count = countResult?.c || 0;
      tables[t.name] = count;
      totalRows += count;
      if (t.name === 'instruments') instrumentCount = count;
    }

    // Estimate storage (rough: ~200 bytes per instrument row, ~100 bytes per other row)
    const estimatedBytes = (instrumentCount * 200) + ((totalRows - instrumentCount) * 100);
    const totalSizeMB = parseFloat((estimatedBytes / (1024 * 1024)).toFixed(2));

    return {
      tableCount: Object.keys(tables).length,
      totalRows,
      tables,
      instrumentCount,
      totalSizeMB,
    };
  } catch {
    return { tableCount: 0, totalRows: 0, tables: {}, instrumentCount: 0, totalSizeMB: 0 };
  }
}

async function getApiUsage(db) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { results } = await db.prepare(
      `SELECT endpoint, count FROM api_usage WHERE date = ?`
    ).bind(today).all();

    const byEndpoint = {};
    let totalCalls = 0;
    for (const r of results || []) {
      byEndpoint[r.endpoint] = r.count;
      totalCalls += r.count;
    }
    return { totalCalls, byEndpoint };
  } catch {
    return { totalCalls: 0, byEndpoint: {} };
  }
}

async function checkDhanHealth(c) {
  const start = Date.now();
  try {
    const apiBase = c.env.DHAN_API_BASE || 'https://api.dhan.co/v2';
    // Quick health check — profile endpoint with no auth returns 401 (but proves API is reachable)
    const res = await fetch(`${apiBase}/profile`, {
      headers: { 'access-token': 'health-check' },
    });
    const latencyMs = Date.now() - start;

    return {
      status: res.status === 401 ? 'reachable' : (res.ok ? 'authenticated' : 'error'),
      httpStatus: res.status,
      latencyMs,
      apiBase,
      feedUrl: c.env.DHAN_FEED_URL || 'wss://api-feed.dhan.co',
    };
  } catch (err) {
    return {
      status: 'unreachable',
      error: err.message,
      latencyMs: Date.now() - start,
    };
  }
}

async function getInstrumentFreshness(db) {
  try {
    // Check the most recent expiry date to estimate when data was last synced
    const result = await db.prepare(
      `SELECT MAX(rowid) as maxId FROM instruments`
    ).first();

    // Check settings for last sync timestamp
    const syncResult = await db.prepare(
      `SELECT value FROM settings WHERE key = 'last_instrument_sync'`
    ).first();

    const lastSync = syncResult?.value ? JSON.parse(syncResult.value) : null;
    let ageDescription = 'Unknown';

    if (lastSync) {
      const ageHours = (Date.now() - new Date(lastSync).getTime()) / 3600000;
      if (ageHours < 24) ageDescription = `${ageHours.toFixed(1)} hours ago`;
      else ageDescription = `${(ageHours / 24).toFixed(1)} days ago`;
    }

    return { lastSync, ageDescription, hasData: (result?.maxId || 0) > 0 };
  } catch {
    return { lastSync: null, ageDescription: 'No data', hasData: false };
  }
}
