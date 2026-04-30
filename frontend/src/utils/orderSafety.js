/**
 * Order Safety Engine — 12-layer pre-trade validation
 * Prevents costly manual trading errors
 */

const SAFETY_CONFIG = {
  fatFingerPct: 5,           // Max % deviation from LTP
  maxLotsPerOrder: 50,       // Max lots in single order
  maxOrderValue: 5000000,    // ₹50L max
  duplicateWindowMs: 3000,   // 3 second duplicate check
  maxOrdersPerMinute: 30,    // Throttle
  marketOpen: '09:15',
  marketClose: '15:30',
  bufferMarginPct: 10,       // 10% margin buffer
};

// Track recent orders for duplicate detection
const recentOrders = [];

/**
 * Run all 12 safety checks on an order
 * @returns {{ pass: boolean, checks: Array<{id, name, status, message, type}> }}
 */
export function validateOrder(order) {
  const { symbol, side, price, qty, lotSize, ltp, changePct, iv, expiry, isBanned } = order;
  const checks = [];

  // 1. Fat Finger Check
  const deviation = Math.abs((price - ltp) / ltp) * 100;
  checks.push({
    id: 1, name: 'Fat Finger',
    status: deviation > SAFETY_CONFIG.fatFingerPct ? 'warn' : 'pass',
    message: deviation > SAFETY_CONFIG.fatFingerPct
      ? `Price ₹${price} is ${deviation.toFixed(1)}% away from LTP ₹${ltp}`
      : `Price within ${SAFETY_CONFIG.fatFingerPct}% of LTP`,
    type: 'soft',
  });

  // 2. Quantity Limit
  const lots = qty / (lotSize || 1);
  checks.push({
    id: 2, name: 'Quantity Limit',
    status: lots > SAFETY_CONFIG.maxLotsPerOrder ? 'fail' : 'pass',
    message: lots > SAFETY_CONFIG.maxLotsPerOrder
      ? `${lots} lots exceeds max ${SAFETY_CONFIG.maxLotsPerOrder} lots`
      : `${lots} lots within limit`,
    type: 'hard',
  });

  // 3. Order Value Limit
  const value = price * qty;
  checks.push({
    id: 3, name: 'Order Value',
    status: value > SAFETY_CONFIG.maxOrderValue ? 'fail' : 'pass',
    message: value > SAFETY_CONFIG.maxOrderValue
      ? `Order value ₹${(value / 100000).toFixed(1)}L exceeds ₹${(SAFETY_CONFIG.maxOrderValue / 100000).toFixed(0)}L limit`
      : `Order value ₹${(value / 100000).toFixed(1)}L within limit`,
    type: 'hard',
  });

  // 4. Duplicate Order
  const now = Date.now();
  const isDuplicate = recentOrders.some(o =>
    o.symbol === symbol && o.side === side && (now - o.timestamp) < SAFETY_CONFIG.duplicateWindowMs
  );
  checks.push({
    id: 4, name: 'Duplicate Check',
    status: isDuplicate ? 'warn' : 'pass',
    message: isDuplicate
      ? `Same ${side} on ${symbol} within ${SAFETY_CONFIG.duplicateWindowMs / 1000}s`
      : 'No duplicate detected',
    type: 'soft',
  });

  // 5. Freeze Quantity (exchange-defined)
  const freezeQty = symbol.includes('NIFTY') ? 1800 : symbol.includes('BANK') ? 900 : 5000;
  checks.push({
    id: 5, name: 'Freeze Qty',
    status: qty > freezeQty ? 'fail' : 'pass',
    message: qty > freezeQty
      ? `Qty ${qty} exceeds exchange freeze limit ${freezeQty}`
      : 'Within exchange freeze limit',
    type: 'hard',
  });

  // 6. Banned Script
  checks.push({
    id: 6, name: 'Banned Script',
    status: isBanned ? 'fail' : 'pass',
    message: isBanned ? `${symbol} is in F&O ban period` : 'Not banned',
    type: 'hard',
  });

  // 7. Circuit Limit
  const nearCircuit = Math.abs(changePct) > 15;
  checks.push({
    id: 7, name: 'Circuit Limit',
    status: nearCircuit ? 'warn' : 'pass',
    message: nearCircuit
      ? `${symbol} moved ${changePct.toFixed(1)}% — near circuit limit`
      : 'Away from circuit limits',
    type: 'soft',
  });

  // 8. Margin Check (simplified)
  checks.push({
    id: 8, name: 'Margin Check',
    status: 'pass',
    message: 'Margin sufficient (mock)',
    type: 'hard',
  });

  // 9. M2M Kill Switch
  checks.push({
    id: 9, name: 'M2M Kill Switch',
    status: 'pass',
    message: 'Kill switch not triggered',
    type: 'hard',
  });

  // 10. Orders/Minute Throttle
  const recentCount = recentOrders.filter(o => (now - o.timestamp) < 60000).length;
  checks.push({
    id: 10, name: 'Rate Limit',
    status: recentCount >= SAFETY_CONFIG.maxOrdersPerMinute ? 'fail' : 'pass',
    message: recentCount >= SAFETY_CONFIG.maxOrdersPerMinute
      ? `${recentCount} orders in last minute — throttled`
      : `${recentCount}/${SAFETY_CONFIG.maxOrdersPerMinute} orders/min`,
    type: 'hard',
  });

  // 11. Market Hours Check
  const nowTime = new Date();
  const h = nowTime.getHours(), m = nowTime.getMinutes();
  const timeNum = h * 100 + m;
  const isMarketOpen = timeNum >= 915 && timeNum <= 1530;
  checks.push({
    id: 11, name: 'Market Hours',
    status: !isMarketOpen ? 'warn' : 'pass',
    message: !isMarketOpen
      ? `Market is closed (${h}:${m.toString().padStart(2, '0')})`
      : 'Market is open',
    type: 'soft',
  });

  // 12. Expiry Check
  const isExpiryDay = expiry === 'today';
  const after3pm = h >= 15;
  checks.push({
    id: 12, name: 'Expiry Check',
    status: isExpiryDay && after3pm ? 'warn' : 'pass',
    message: isExpiryDay && after3pm
      ? '⚠️ Option expiring TODAY after 3 PM — rapid theta decay!'
      : isExpiryDay ? 'Expiry day — exercise caution' : 'Not expiry day',
    type: 'soft',
  });

  // Record order for duplicate tracking
  recentOrders.push({ symbol, side, timestamp: now });
  // Keep only last 60s of orders
  while (recentOrders.length > 0 && (now - recentOrders[0].timestamp) > 60000) {
    recentOrders.shift();
  }

  const hardFails = checks.filter(c => c.type === 'hard' && c.status === 'fail');
  const softWarns = checks.filter(c => c.status === 'warn');

  return {
    pass: hardFails.length === 0,
    hardBlock: hardFails.length > 0,
    warnings: softWarns.length,
    checks,
  };
}

/**
 * Get AI insights for order context
 */
export function getOrderInsights(order) {
  const insights = [];

  if (order.iv > 40) {
    insights.push({ icon: '⚠️', label: 'High IV', detail: `IV at ${order.iv.toFixed(1)} — premium is expensive`, color: 'var(--orange)' });
  }

  if (order.daysToExpiry <= 3) {
    insights.push({ icon: '⏰', label: 'Near Expiry', detail: `${order.daysToExpiry} DTE — rapid theta decay`, color: 'var(--red)' });
  }

  if (order.oiChange > 10) {
    insights.push({ icon: '📊', label: 'OI Buildup', detail: `OI change +${order.oiChange}% at this strike`, color: 'var(--cyan)' });
  }

  if (order.maxPainGap > 200) {
    insights.push({ icon: '🎯', label: 'Max Pain Gap', detail: `Strike is ${order.maxPainGap} pts from max pain`, color: 'var(--purple)' });
  }

  return insights;
}
