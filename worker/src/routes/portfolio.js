/**
 * Portfolio Routes — Positions, holdings, funds, exit-all
 */
import { Hono } from 'hono';
import { DhanClient } from '../services/dhanClient.js';

export const portfolioRoutes = new Hono();

function getClient(c) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  const clientId = c.req.header('X-Client-Id');
  if (!token || !clientId) throw new Error('Missing auth headers');
  return new DhanClient(c.env, token, clientId);
}

// GET /api/portfolio/positions
portfolioRoutes.get('/positions', async (c) => {
  try {
    const client = getClient(c);
    const positions = await client.getPositions();
    return c.json({ success: true, positions });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// GET /api/portfolio/holdings
portfolioRoutes.get('/holdings', async (c) => {
  try {
    const client = getClient(c);
    const holdings = await client.getHoldings();
    return c.json({ success: true, holdings });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// GET /api/portfolio/funds
portfolioRoutes.get('/funds', async (c) => {
  try {
    const client = getClient(c);
    const funds = await client.getFunds();
    return c.json({ success: true, funds });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// POST /api/portfolio/exit-all — Emergency: square off all positions
portfolioRoutes.post('/exit-all', async (c) => {
  try {
    const client = getClient(c);
    const positions = await client.getPositions();
    const openPositions = (positions || []).filter(p =>
      (p.netQty || p.buyQty - p.sellQty) !== 0
    );

    const results = [];
    for (const pos of openPositions) {
      const netQty = pos.netQty || (pos.buyQty - pos.sellQty);
      if (netQty === 0) continue;

      try {
        const exitOrder = {
          dhanClientId: c.req.header('X-Client-Id'),
          transactionType: netQty > 0 ? 'SELL' : 'BUY',
          exchangeSegment: pos.exchangeSegment,
          productType: pos.productType,
          orderType: 'MARKET',
          validity: 'DAY',
          securityId: pos.securityId,
          quantity: Math.abs(netQty),
          price: 0,
          triggerPrice: 0,
          disclosedQuantity: 0,
        };
        const result = await client.placeOrder(exitOrder);
        results.push({ securityId: pos.securityId, status: 'exited', ...result });
      } catch (err) {
        results.push({ securityId: pos.securityId, status: 'failed', error: err.message });
      }
    }

    return c.json({ success: true, exited: results.length, results });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
