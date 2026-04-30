/**
 * Auth Routes — TOTP auto-login, token refresh, profile
 */
import { Hono } from 'hono';
import { generateTOTP } from '../services/totpGenerator.js';

export const authRoutes = new Hono();

// POST /api/auth/login — Auto-generate token via TOTP or manual token
authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const broker = body.broker || 'dhan';
  const clientId = body.clientId || c.env.DHAN_CLIENT_ID;
  const pin = body.pin || c.env.DHAN_PIN;
  const totpSecret = body.totpSecret || c.env.DHAN_TOTP_SECRET;
  let accessToken = body.accessToken || null;

  if (broker !== 'dhan') {
    return c.json({ success: false, error: `Broker '${broker}' not yet supported` }, 400);
  }

  if (!clientId) {
    return c.json({ success: false, error: 'Client ID is required' }, 400);
  }

  // MODE 1: TOTP auto-generate
  if (totpSecret && pin) {
    try {
      const totp = await generateTOTP(totpSecret);
      console.log(`[Auth] TOTP generated: ${totp.substring(0, 2)}****`);

      const authUrl = c.env.DHAN_AUTH_URL || 'https://auth.dhan.co';
      const res = await fetch(
        `${authUrl}/app/generateAccessToken?dhanClientId=${clientId}&pin=${pin}&totp=${totp}`,
        { method: 'POST' }
      );
      const data = await res.json();

      if (data.accessToken) {
        accessToken = data.accessToken;
        console.log(`[Auth] ✓ Token auto-generated for ${data.dhanClientName || clientId}`);
        
        // Track API usage
        await trackApiCall(c.env.DB, 'auth/login');

        return c.json({
          success: true,
          broker: 'dhan',
          clientId,
          clientName: data.dhanClientName || '',
          accessToken,
          tokenExpiry: data.expiryTime || null,
          message: 'Auto-login via TOTP successful',
        });
      } else {
        return c.json({ success: false, error: `TOTP failed: ${JSON.stringify(data)}` }, 401);
      }
    } catch (err) {
      if (!accessToken) {
        return c.json({ success: false, error: `TOTP auth failed: ${err.message}` }, 500);
      }
    }
  }

  // MODE 2: Manual access token — validate it
  if (!accessToken) {
    return c.json({ success: false, error: 'No access token. Provide TOTP credentials or manual token.' }, 400);
  }

  try {
    const apiBase = c.env.DHAN_API_BASE || 'https://api.dhan.co/v2';
    const res = await fetch(`${apiBase}/fundlimit`, {
      headers: { 'access-token': accessToken, 'client-id': clientId, 'Content-Type': 'application/json' },
    });
    const funds = await res.json();
    
    await trackApiCall(c.env.DB, 'auth/login');

    return c.json({
      success: true,
      broker: 'dhan',
      clientId,
      accessToken,
      funds,
      message: 'Manual token validated',
    });
  } catch (err) {
    return c.json({ success: false, error: `Token validation failed: ${err.message}` }, 401);
  }
});

// POST /api/auth/refresh — Renew 24h token
authRoutes.post('/refresh', async (c) => {
  const { accessToken, clientId } = await c.req.json().catch(() => ({}));
  if (!accessToken || !clientId) {
    return c.json({ success: false, error: 'accessToken and clientId required' }, 400);
  }

  const apiBase = c.env.DHAN_API_BASE || 'https://api.dhan.co/v2';
  const res = await fetch(`${apiBase}/RenewToken`, {
    headers: { 'access-token': accessToken, 'dhanClientId': clientId },
  });
  const data = await res.json();
  
  await trackApiCall(c.env.DB, 'auth/refresh');

  if (data.accessToken) {
    return c.json({ success: true, accessToken: data.accessToken, expiryTime: data.expiryTime });
  }
  return c.json({ success: false, error: 'Token renewal failed' }, 401);
});

// GET /api/auth/profile — Validate token + get profile
authRoutes.get('/profile', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  const clientId = c.req.header('X-Client-Id');
  if (!token) return c.json({ error: 'Missing Authorization header' }, 401);

  const apiBase = c.env.DHAN_API_BASE || 'https://api.dhan.co/v2';
  const res = await fetch(`${apiBase}/profile`, {
    headers: { 'access-token': token },
  });
  
  await trackApiCall(c.env.DB, 'auth/profile');
  return c.json(await res.json());
});

// ─── API Usage Tracker ───
async function trackApiCall(db, endpoint) {
  try {
    const today = new Date().toISOString().split('T')[0];
    await db.prepare(
      `INSERT INTO api_usage (date, endpoint, count) VALUES (?, ?, 1)
       ON CONFLICT(date, endpoint) DO UPDATE SET count = count + 1`
    ).bind(today, endpoint).run();
  } catch { /* silently ignore if table doesn't exist yet */ }
}
