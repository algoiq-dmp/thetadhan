import { getSector } from './sectors';

// Generate realistic mock data for ~180 NSE F&O symbols
const SYMBOLS_RAW = [
  // Indices
  { s: 'NIFTY', p: 24250, lot: 75 }, { s: 'BANKNIFTY', p: 52100, lot: 30 }, { s: 'FINNIFTY', p: 23800, lot: 40 }, { s: 'MIDCPNIFTY', p: 12450, lot: 50 },
  // Bank
  { s: 'HDFCBANK', p: 1720, lot: 550 }, { s: 'ICICIBANK', p: 1380, lot: 700 }, { s: 'KOTAKBANK', p: 1920, lot: 400 }, { s: 'SBIN', p: 820, lot: 1500 },
  { s: 'AXISBANK', p: 1180, lot: 900 }, { s: 'INDUSINDBK', p: 1520, lot: 500 }, { s: 'BANDHANBNK', p: 195, lot: 4000 }, { s: 'PNB', p: 108, lot: 8000 },
  { s: 'BANKBARODA', p: 255, lot: 5850 }, { s: 'FEDERALBNK', p: 178, lot: 5000 }, { s: 'IDFCFIRSTB', p: 78, lot: 10000 }, { s: 'AUBANK', p: 680, lot: 1000 },
  { s: 'CANBK', p: 105, lot: 6700 }, { s: 'MANAPPURAM', p: 215, lot: 4000 },
  // IT
  { s: 'TCS', p: 3850, lot: 175 }, { s: 'INFY', p: 1520, lot: 400 }, { s: 'WIPRO', p: 425, lot: 1600 }, { s: 'HCLTECH', p: 1680, lot: 350 },
  { s: 'TECHM', p: 1420, lot: 600 }, { s: 'LTIM', p: 5200, lot: 150 }, { s: 'MPHASIS', p: 2750, lot: 275 }, { s: 'COFORGE', p: 5800, lot: 100 },
  { s: 'PERSISTENT', p: 5450, lot: 100 }, { s: 'LTTS', p: 4950, lot: 150 },
  // Pharma
  { s: 'SUNPHARMA', p: 1780, lot: 350 }, { s: 'DRREDDY', p: 6200, lot: 125 }, { s: 'CIPLA', p: 1480, lot: 650 }, { s: 'DIVISLAB', p: 5900, lot: 100 },
  { s: 'AUROPHARMA', p: 1280, lot: 500 }, { s: 'BIOCON', p: 345, lot: 2300 }, { s: 'LUPIN', p: 2100, lot: 425 }, { s: 'TORNTPHARM', p: 3350, lot: 250 },
  { s: 'ALKEM', p: 5700, lot: 100 }, { s: 'LAURUSLABS', p: 580, lot: 1100 }, { s: 'IPCALAB', p: 1550, lot: 450 },
  // Auto
  { s: 'TATAMOTORS', p: 780, lot: 1425 }, { s: 'M&M', p: 2680, lot: 350 }, { s: 'MARUTI', p: 12500, lot: 50 }, { s: 'BAJAJ-AUTO', p: 8800, lot: 75 },
  { s: 'HEROMOTOCO', p: 4650, lot: 150 }, { s: 'EICHERMOT', p: 4850, lot: 150 }, { s: 'ASHOKLEY', p: 228, lot: 4500 }, { s: 'BALKRISIND', p: 2950, lot: 250 },
  { s: 'TVSMOTOR', p: 2480, lot: 300 }, { s: 'MOTHERSON', p: 165, lot: 6400 }, { s: 'MRF', p: 125000, lot: 5 }, { s: 'BHARATFORG', p: 1320, lot: 500 },
  // Metal
  { s: 'TATASTEEL', p: 162, lot: 5500 }, { s: 'JSWSTEEL', p: 1020, lot: 900 }, { s: 'HINDALCO', p: 640, lot: 1400 }, { s: 'VEDL', p: 445, lot: 2250 },
  { s: 'COALINDIA', p: 410, lot: 2400 }, { s: 'NMDC', p: 225, lot: 4500 }, { s: 'SAIL', p: 128, lot: 5500 }, { s: 'NATIONALUM', p: 195, lot: 3000 },
  { s: 'HINDCOPPER', p: 295, lot: 3200 }, { s: 'APLAPOLLO', p: 1580, lot: 375 },
  // Energy
  { s: 'RELIANCE', p: 2540, lot: 250 }, { s: 'ONGC', p: 272, lot: 3850 }, { s: 'NTPC', p: 365, lot: 2400 }, { s: 'POWERGRID', p: 315, lot: 2800 },
  { s: 'ADANIENT', p: 2350, lot: 250 }, { s: 'ADANIPORTS', p: 1380, lot: 500 }, { s: 'GAIL', p: 198, lot: 4575 }, { s: 'IOC', p: 168, lot: 4850 },
  { s: 'BPCL', p: 310, lot: 2700 }, { s: 'PETRONET', p: 332, lot: 3000 }, { s: 'IGL', p: 482, lot: 1850 }, { s: 'TATAPOWER', p: 418, lot: 2700 },
  { s: 'NHPC', p: 98, lot: 7000 }, { s: 'SJVN', p: 118, lot: 6700 },
  // FMCG
  { s: 'ITC', p: 435, lot: 1600 }, { s: 'HINDUNILVR', p: 2380, lot: 300 }, { s: 'NESTLEIND', p: 2450, lot: 200 }, { s: 'BRITANNIA', p: 5150, lot: 100 },
  { s: 'DABUR', p: 512, lot: 1250 }, { s: 'MARICO', p: 608, lot: 1200 }, { s: 'GODREJCP', p: 1280, lot: 500 }, { s: 'COLPAL', p: 2950, lot: 250 },
  { s: 'TATACONSUM', p: 1050, lot: 600 }, { s: 'UBL', p: 1920, lot: 350 }, { s: 'VBL', p: 610, lot: 1000 }, { s: 'EMAMILTD', p: 730, lot: 1000 },
  // Finance
  { s: 'BAJFINANCE', p: 8400, lot: 125 }, { s: 'BAJAJFINSV', p: 1780, lot: 500 }, { s: 'HDFCLIFE', p: 680, lot: 1100 }, { s: 'SBILIFE', p: 1620, lot: 375 },
  { s: 'ICICIPRULI', p: 720, lot: 1000 }, { s: 'MUTHOOTFIN', p: 1950, lot: 400 }, { s: 'CHOLAFIN', p: 1480, lot: 625 }, { s: 'SHRIRAMFIN', p: 645, lot: 1200 },
  { s: 'M&MFIN', p: 290, lot: 4000 }, { s: 'LICHSGFIN', p: 640, lot: 1000 }, { s: 'RECLTD', p: 520, lot: 1600 }, { s: 'PFC', p: 440, lot: 1800 },
  { s: 'ICICIGI', p: 1820, lot: 425 }, { s: 'SBICARD', p: 810, lot: 800 },
  // Realty
  { s: 'DLF', p: 820, lot: 825 }, { s: 'GODREJPROP', p: 2750, lot: 325 }, { s: 'OBEROIRLTY', p: 1950, lot: 400 }, { s: 'PRESTIGE', p: 1480, lot: 625 },
  { s: 'PHOENIXLTD', p: 1620, lot: 325 }, { s: 'BRIGADE', p: 1280, lot: 550 },
  // Infra
  { s: 'ABB', p: 7500, lot: 75 }, { s: 'SIEMENS', p: 6800, lot: 75 }, { s: 'HAVELLS', p: 1650, lot: 500 }, { s: 'POLYCAB', p: 6250, lot: 100 },
  { s: 'CGPOWER', p: 620, lot: 1500 }, { s: 'BEL', p: 305, lot: 2500 }, { s: 'HAL', p: 4450, lot: 150 }, { s: 'BHEL', p: 248, lot: 3750 }, { s: 'IRCTC', p: 820, lot: 875 },
  // Cement
  { s: 'ULTRACEMCO', p: 11200, lot: 50 }, { s: 'SHREECEM', p: 26500, lot: 25 }, { s: 'AMBUJACEM', p: 595, lot: 1100 }, { s: 'ACC', p: 2180, lot: 250 },
  { s: 'DALBHARAT', p: 1850, lot: 400 }, { s: 'RAMCOCEM', p: 920, lot: 750 }, { s: 'JKCEMENT', p: 4350, lot: 125 },
  // Chemical
  { s: 'PIDILITIND', p: 2980, lot: 250 }, { s: 'SRF', p: 2400, lot: 250 }, { s: 'ATUL', p: 7200, lot: 75 }, { s: 'DEEPAKNTR', p: 2680, lot: 250 },
  { s: 'NAVINFLUOR', p: 3550, lot: 150 }, { s: 'CLEAN', p: 1420, lot: 400 },
  // Telecom
  { s: 'BHARTIARTL', p: 1680, lot: 475 }, { s: 'IDEA', p: 8.2, lot: 80000 },
  // Media
  { s: 'ZEEL', p: 134, lot: 6000 }, { s: 'PVR', p: 1520, lot: 407 },
  // Others
  { s: 'APOLLOHOSP', p: 6400, lot: 100 }, { s: 'MAXHEALTH', p: 920, lot: 700 }, { s: 'LALPATHLAB', p: 3100, lot: 200 },
  { s: 'TITAN', p: 3250, lot: 175 }, { s: 'TRENT', p: 5800, lot: 100 }, { s: 'PAGEIND', p: 42000, lot: 15 },
  { s: 'DMART', p: 4150, lot: 125 }, { s: 'ZOMATO', p: 242, lot: 3000 }, { s: 'PAYTM', p: 485, lot: 1500 },
  { s: 'JSWENERGY', p: 560, lot: 1200 }, { s: 'ADANIGREEN', p: 1750, lot: 300 },
  { s: 'DIXON', p: 12800, lot: 50 }, { s: 'VOLTAS', p: 1650, lot: 375 },
  { s: 'ASTRAL', p: 1780, lot: 300 }, { s: 'CROMPTON', p: 380, lot: 1600 },
  { s: 'CUMMINSIND', p: 3250, lot: 200 }, { s: 'HONAUT', p: 48000, lot: 10 },
  { s: 'PIIND', p: 3850, lot: 150 }, { s: 'SYNGENE', p: 820, lot: 750 },
  { s: 'GLENMARK', p: 1450, lot: 490 }, { s: 'INDIAMART', p: 2750, lot: 225 },
  { s: 'NAUKRI', p: 6800, lot: 75 }, { s: 'POLICYBZR', p: 1580, lot: 375 },
  { s: 'STARHEALTH', p: 520, lot: 1200 },
  { s: 'LICI', p: 920, lot: 700 }, { s: 'IRFC', p: 158, lot: 5000 },
  { s: 'INDUSTOWER', p: 345, lot: 2000 }, { s: 'CONCOR', p: 780, lot: 800 },
  { s: 'CHAMBLFERT', p: 520, lot: 1300 }, { s: 'GNFC', p: 680, lot: 1000 },
  { s: 'ABCAPITAL', p: 215, lot: 3200 }, { s: 'CANFINHOME', p: 840, lot: 800 },
  { s: 'GUJGASLTD', p: 510, lot: 1250 }, { s: 'MGL', p: 1720, lot: 375 },
  { s: 'METROPOLIS', p: 1850, lot: 350 }, { s: 'AARTIIND', p: 580, lot: 1050 },
  { s: 'ESCORTS', p: 3450, lot: 200 }, { s: 'EXIDEIND', p: 480, lot: 1200 },
  { s: 'BATAINDIA', p: 1380, lot: 425 }, { s: 'RELAXO', p: 820, lot: 750 },
  { s: 'WHIRLPOOL', p: 1680, lot: 275 }, { s: 'BLUESTARLT', p: 1850, lot: 250 },
  { s: 'INDHOTEL', p: 720, lot: 850 }, { s: 'JUBLFOOD', p: 580, lot: 1000 },
];

function rand(min, max) { return min + Math.random() * (max - min); }
function roundTo(n, d) { return Number(n.toFixed(d)); }

// Build full universe with computed analytics
export function generateMockUniverse() {
  const expiry = '2026-04-30';
  return SYMBOLS_RAW.map((raw, idx) => {
    const p = raw.p;
    const changePct = roundTo(rand(-4, 4), 2);
    const yClose = roundTo(p / (1 + changePct / 100), 2);
    const change = roundTo(p - yClose, 2);
    const todayHigh = roundTo(p * (1 + rand(0.002, 0.025)), 2);
    const todayLow = roundTo(p * (1 - rand(0.002, 0.025)), 2);
    const vol = Math.round(rand(50000, 5000000));
    const oi = Math.round(rand(100000, 20000000));
    const d7High = roundTo(p * (1 + rand(0.01, 0.06)), 2);
    const d7Low = roundTo(p * (1 - rand(0.01, 0.06)), 2);
    const m1High = roundTo(p * (1 + rand(0.03, 0.12)), 2);
    const m1Low = roundTo(p * (1 - rand(0.03, 0.12)), 2);
    const d10Avg = roundTo(p * (1 + rand(-0.02, 0.02)), 2);
    const sma30 = roundTo(p * (1 + rand(-0.04, 0.04)), 2);
    const sma100 = roundTo(p * (1 + rand(-0.08, 0.08)), 2);
    const sma200 = roundTo(p * (1 + rand(-0.12, 0.12)), 2);
    const iv = roundTo(rand(12, 55), 1);
    const ivLow5d = roundTo(iv - rand(2, 8), 1);
    const ivHigh5d = roundTo(iv + rand(2, 8), 1);
    const strikeDist = p > 5000 ? 100 : p > 1000 ? 50 : p > 500 ? 25 : 10;
    const atm = Math.round(p / strikeDist) * strikeDist;
    const ceStrike = atm + strikeDist * Math.round(rand(4, 8));
    const peStrike = atm - strikeDist * Math.round(rand(4, 8));
    const cePremium = roundTo(rand(2, 50), 2);
    const pePremium = roundTo(rand(2, 50), 2);

    return {
      id: idx + 1,
      symbol: raw.s,
      ltp: p,
      prevLtp: p,
      change,
      changePct,
      yClose,
      todayHigh,
      todayLow,
      volume: vol,
      oi,
      d7High, d7Low,
      m1High, m1Low,
      d10Avg,
      sma30, sma100, sma200,
      iv, ivLow5d, ivHigh5d,
      ceStrike, peStrike,
      cePremium, pePremium,
      lotSize: raw.lot,
      expiry,
      sector: getSector(raw.s),
      futureSymbol: `${raw.s}APR26FUT`,
      token: 10000 + idx,
      flashClass: '',
    };
  });
}

// Simulated tick — random walk each symbol
// Enhanced: accepts simulation config for volatility, trend bias, and field toggles
export function simulateTick(row, config = {}) {
  // Safety: skip simulation for rows with no price data (live-only symbols)
  if (!row.ltp || !row.yClose) return row;

  const volatility = config.volatility || 1;
  const bias = config.trendBias === 'bullish' ? -0.46 : config.trendBias === 'bearish' ? -0.52 : -0.48;
  const tickPct = (Math.random() + bias) * 0.004 * volatility;
  const prevLtp = row.ltp;
  const newLtp = roundTo(row.ltp * (1 + tickPct), 2);
  const change = roundTo(newLtp - (row.yClose || row.ltp), 2);
  const changePct = roundTo((change / (row.yClose || row.ltp || 1)) * 100, 2);
  const todayHigh = Math.max(row.todayHigh || 0, newLtp);
  const todayLow = Math.min(row.todayLow || newLtp, newLtp);
  const flashClass = newLtp > prevLtp ? 'cell-flash-green' : newLtp < prevLtp ? 'cell-flash-red' : '';

  const updates = { ...row, ltp: newLtp, prevLtp, change, changePct, todayHigh, todayLow, flashClass };

  // Optional OI simulation
  if (config.oiSimulation !== false) {
    const oiDelta = Math.round((Math.random() - 0.45) * row.oi * 0.002 * volatility);
    updates.oi = Math.max(0, row.oi + oiDelta);
  }

  // Optional IV simulation
  if (config.ivSimulation !== false) {
    const ivDelta = roundTo((Math.random() - 0.5) * 0.3 * volatility, 2);
    updates.iv = roundTo(Math.max(5, Math.min(80, (row.iv || 15) + ivDelta)), 1);
    updates.cePremium = roundTo(Math.max(0.05, (row.cePremium || 1) * (1 + tickPct * 1.5)), 2);
    updates.pePremium = roundTo(Math.max(0.05, (row.pePremium || 1) * (1 - tickPct * 1.5)), 2);
  }

  // Optional volume simulation
  if (config.volumeSimulation !== false) {
    const volTick = Math.round(Math.random() * 5000 * volatility);
    updates.volume = row.volume + volTick;
  }

  return updates;
}

// Sample Option Chain
export function generateMockChain(symbol, ltp, lotSize) {
  const step = ltp > 5000 ? 100 : ltp > 1000 ? 50 : ltp > 500 ? 25 : 10;
  const atm = Math.round(ltp / step) * step;
  const strikes = [];
  for (let i = -10; i <= 10; i++) {
    const strike = atm + i * step;
    const dist = Math.abs(i);
    const callDelta = roundTo(Math.max(0.01, 0.5 - dist * 0.05 + rand(-0.02, 0.02)), 2);
    const putDelta = roundTo(-1 + callDelta, 2);
    const callIV = roundTo(rand(14, 35) + dist * 0.8, 1);
    const putIV = roundTo(rand(14, 35) + dist * 0.8, 1);
    const callLTP = roundTo(Math.max(0.5, (0.5 - dist * 0.04) * ltp * 0.03 * (1 + rand(-0.2, 0.2))), 2);
    const putLTP = roundTo(Math.max(0.5, (0.5 - dist * 0.04) * ltp * 0.03 * (1 + rand(-0.2, 0.2))), 2);
    const callOI = Math.round(rand(5, 200)) * 100;
    const putOI = Math.round(rand(5, 200)) * 100;
    const buildups = ['Long Build', 'Short Build', 'Short Cover', 'Long Unwind'];
    strikes.push({
      strike,
      isATM: i === 0,
      isDelta01: Math.abs(callDelta - 0.1) < 0.04 || Math.abs(putDelta + 0.1) < 0.04,
      callLTP, putLTP,
      callDelta, putDelta,
      callIV, putIV,
      callOI: callOI * 1000, putOI: putOI * 1000,
      callOIChange: Math.round(rand(-5000, 8000)),
      putOIChange: Math.round(rand(-5000, 8000)),
      callBuildup: buildups[Math.floor(rand(0, 4))],
      putBuildup: buildups[Math.floor(rand(0, 4))],
    });
  }
  return { symbol, ltp, lotSize, atm, expiry: '24 Apr 2026', strikes };
}
