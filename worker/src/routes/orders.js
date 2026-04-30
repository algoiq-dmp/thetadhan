/**
 * Order Routes — Place, modify, cancel, order book, trade book
 */
import { Hono } from 'hono';
import { DhanClient } from '../services/dhanClient.js';

export const orderRoutes = new Hono();

// Middleware: extract auth headers
function getClient(c) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  const clientId = c.req.header('X-Client-Id');
  if (!token || !clientId) throw new Error('Missing auth headers');
  return new DhanClient(c.env, token, clientId);
}

// POST /api/orders/place
orderRoutes.post('/place', async (c) => {
  try {
    const client = getClient(c);
    const body = await c.req.json();

    // Normalize order body → Dhan format
    const dhanOrder = {
      dhanClientId: c.req.header('X-Client-Id'),
      transactionType: body.side?.toUpperCase() || body.transactionType, // BUY / SELL
      exchangeSegment: body.exchangeSegment || body.exchange || 'NSE_FNO',
      productType: body.productType || body.product || 'INTRADAY',
      orderType: body.orderType || 'MARKET',
      validity: body.validity || 'DAY',
      securityId: String(body.securityId || body.token),
      quantity: body.quantity || body.qty,
      price: body.price || 0,
      triggerPrice: body.triggerPrice || 0,
      disclosedQuantity: body.disclosedQuantity || 0,
    };

    const result = await client.placeOrder(dhanOrder);
    return c.json({ success: true, ...result });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// PUT /api/orders/modify/:orderId
orderRoutes.put('/modify/:orderId', async (c) => {
  try {
    const client = getClient(c);
    const body = await c.req.json();
    const result = await client.modifyOrder(c.req.param('orderId'), body);
    return c.json({ success: true, ...result });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// DELETE /api/orders/cancel/:orderId
orderRoutes.delete('/cancel/:orderId', async (c) => {
  try {
    const client = getClient(c);
    const result = await client.cancelOrder(c.req.param('orderId'));
    return c.json({ success: true, ...result });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// GET /api/orders — Full order book
orderRoutes.get('/', async (c) => {
  try {
    const client = getClient(c);
    const orders = await client.getOrders();
    return c.json({ success: true, orders });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// GET /api/orders/trades — Trade book
orderRoutes.get('/trades', async (c) => {
  try {
    const client = getClient(c);
    const trades = await client.getTradeBook();
    return c.json({ success: true, trades });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
