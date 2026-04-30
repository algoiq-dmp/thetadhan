/**
 * Dhan Binary Tick Parser (Browser-side)
 * Decodes the Little Endian binary feed from DhanHQ.
 */

export function parseBinaryTick(buffer) {
  const dataView = new DataView(buffer);
  
  // Header is 8 bytes
  // [1] responseCode (byte)
  // [1] exchangeSegment (byte)
  // [2] empty (short)
  // [4] securityId (int)
  
  const responseCode = dataView.getInt8(0);
  const exchangeSegment = dataView.getInt8(1);
  const securityId = dataView.getInt32(4, true); // true = little endian

  const tick = {
    exchangeSegment,
    securityId,
    type: 'unknown'
  };

  // Ticker Data (Response Code 2) — 50 bytes total
  if (responseCode === 2 && buffer.byteLength >= 50) {
    tick.type = 'ticker';
    tick.ltp = dataView.getFloat32(8, true);
    tick.ltt = dataView.getInt32(12, true); // Last trade time (epoch)
    tick.lastTradeQty = dataView.getInt32(16, true);
    tick.volume = dataView.getInt32(20, true);
    tick.bidPrice = dataView.getFloat32(24, true);
    tick.bidQty = dataView.getInt32(28, true);
    tick.askPrice = dataView.getFloat32(32, true);
    tick.askQty = dataView.getInt32(36, true);
    tick.oi = dataView.getInt32(40, true);
    tick.prevClose = dataView.getFloat32(44, true);
    tick.prevOI = dataView.getInt32(48, true);
    
    // Derived values
    if (tick.prevClose > 0) {
      tick.change = tick.ltp - tick.prevClose;
      tick.changePct = (tick.change / tick.prevClose) * 100;
    }
  } 
  // Quote Data (Response Code 4) — 8 bytes header + more data (we can parse if needed)
  else if (responseCode === 4) {
    tick.type = 'quote';
    tick.ltp = dataView.getFloat32(8, true);
    tick.open = dataView.getFloat32(12, true);
    tick.high = dataView.getFloat32(16, true);
    tick.low = dataView.getFloat32(20, true);
    tick.close = dataView.getFloat32(24, true);
    tick.volume = dataView.getInt32(28, true);
    // There are more fields, but usually LTP and OHLC are sufficient
    if (tick.close > 0) {
      tick.change = tick.ltp - tick.close;
      tick.changePct = (tick.change / tick.close) * 100;
    }
  }

  return tick;
}
