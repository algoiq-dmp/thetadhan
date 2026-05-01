// Portfolio data generator for all predefined Market Watch lists
// Uses factory functions to generate realistic mock data compactly

let _nextToken = 100

function mkEQ(symbol, ltp, chg, vol, lotSize = 1) {
  const t = _nextToken++
  const chgP = +((chg / (ltp - chg)) * 100).toFixed(2)
  const spread = +(ltp * 0.001).toFixed(2)
  return {
    token: t, symbol, exchange: 'NSE', instrument: 'EQ', type: 'EQ',
    ltp, chg, chgP, open: +(ltp - chg * 0.5).toFixed(2), high: +(ltp + Math.abs(chg) * 1.2).toFixed(2),
    low: +(ltp - Math.abs(chg) * 1.5).toFixed(2), close: +(ltp - chg).toFixed(2),
    bid: +(ltp - spread).toFixed(2), bidQty: Math.floor(Math.random() * 2000) + 200,
    ask: +(ltp + spread).toFixed(2), askQty: Math.floor(Math.random() * 2000) + 200,
    vol, oi: 0, oiChg: 0, atp: +(ltp - chg * 0.3).toFixed(2), ltq: Math.floor(Math.random() * 500) + 10,
    totalBuyQty: vol, totalSellQty: Math.floor(vol * 1.1),
    upperCkt: +(ltp * 1.1).toFixed(2), lowerCkt: +(ltp * 0.9).toFixed(2),
    w52High: +(ltp * 1.35).toFixed(2), w52Low: +(ltp * 0.65).toFixed(2),
    expiry: '', strikePrice: '', optionType: '', lotSize, turnover: Math.floor(ltp * vol / 1000),
  }
}

function mkFUT(symbol, ltp, chg, vol, lotSize, expiry = '24-APR-2026') {
  const t = _nextToken++
  const chgP = +((chg / (ltp - chg)) * 100).toFixed(2)
  return {
    token: t, symbol: symbol + ' FUT', exchange: 'NSE', instrument: 'FUTIDX', type: 'FUT',
    ltp, chg, chgP, open: +(ltp - chg * 0.6).toFixed(2), high: +(ltp + Math.abs(chg) * 1.3).toFixed(2),
    low: +(ltp - Math.abs(chg) * 1.4).toFixed(2), close: +(ltp - chg).toFixed(2),
    bid: +(ltp - 0.5).toFixed(2), bidQty: Math.floor(Math.random() * 3000) + 500,
    ask: +(ltp + 0.5).toFixed(2), askQty: Math.floor(Math.random() * 3000) + 500,
    vol, oi: Math.floor(Math.random() * 50000000) + 5000000, oiChg: Math.floor((Math.random() - 0.4) * 3000000),
    atp: +(ltp - chg * 0.2).toFixed(2), ltq: lotSize,
    totalBuyQty: Math.floor(vol * 1.5), totalSellQty: Math.floor(vol * 1.3),
    upperCkt: +(ltp * 1.1).toFixed(2), lowerCkt: +(ltp * 0.9).toFixed(2),
    w52High: +(ltp * 1.25).toFixed(2), w52Low: +(ltp * 0.7).toFixed(2),
    expiry, strikePrice: '', optionType: '', lotSize, turnover: Math.floor(ltp * vol / 1000),
  }
}

function mkOPT(underlying, strike, optType, ltp, chg, vol, lotSize, expiry = '24-APR-2026') {
  const t = _nextToken++
  const chgP = ltp > 0 ? +((chg / (ltp - chg)) * 100).toFixed(2) : 0
  return {
    token: t, symbol: `${underlying} ${strike}${optType}`, exchange: 'NSE', instrument: 'OPTIDX', type: optType,
    ltp, chg, chgP, open: +(ltp - chg * 0.5).toFixed(2), high: +(ltp + Math.abs(chg) * 1.5).toFixed(2),
    low: +(Math.max(0.05, ltp - Math.abs(chg) * 2)).toFixed(2), close: +(Math.max(0.05, ltp - chg)).toFixed(2),
    bid: +(Math.max(0.05, ltp - 0.5)).toFixed(2), bidQty: Math.floor(Math.random() * 5000) + 500,
    ask: +(ltp + 0.5).toFixed(2), askQty: Math.floor(Math.random() * 5000) + 500,
    vol, oi: Math.floor(Math.random() * 60000000) + 2000000, oiChg: Math.floor((Math.random() - 0.4) * 4000000),
    atp: +(ltp - chg * 0.3).toFixed(2), ltq: lotSize,
    totalBuyQty: Math.floor(vol * 2), totalSellQty: Math.floor(vol * 1.8),
    upperCkt: +(ltp * 3).toFixed(2), lowerCkt: 0.05,
    w52High: +(ltp * 4).toFixed(2), w52Low: 0.05,
    expiry, strikePrice: String(strike), optionType: optType, lotSize, turnover: Math.floor(ltp * vol / 100),
  }
}

function mkIDX(name, ltp, chg) {
  const t = _nextToken++
  return {
    token: t, symbol: name, exchange: 'NSE', instrument: 'INDEX', type: 'IDX',
    ltp, chg, chgP: +((chg / (ltp - chg)) * 100).toFixed(2),
    open: +(ltp - chg * 0.6).toFixed(2), high: +(ltp + Math.abs(chg) * 1.2).toFixed(2),
    low: +(ltp - Math.abs(chg) * 1.5).toFixed(2), close: +(ltp - chg).toFixed(2),
    bid: 0, bidQty: 0, ask: 0, askQty: 0,
    vol: Math.floor(Math.random() * 5000000) + 500000, oi: 0, oiChg: 0,
    atp: +(ltp - chg * 0.2).toFixed(2), ltq: 0,
    totalBuyQty: 0, totalSellQty: 0, upperCkt: 0, lowerCkt: 0,
    w52High: +(ltp * 1.2).toFixed(2), w52Low: +(ltp * 0.75).toFixed(2),
    expiry: '', strikePrice: '', optionType: '', lotSize: 0, turnover: 0,
  }
}

// Generate 10 CE + 10 PE options around ATM
function genOptions(underlying, atm, step, lotSize, expiry = '24-APR-2026') {
  const rows = []
  for (let i = -5; i <= 4; i++) {
    const strike = atm + i * step
    const dist = Math.abs(i)
    const ceLtp = +(Math.max(1, (5 - i) * step * 0.4 + Math.random() * 20)).toFixed(2)
    const peLtp = +(Math.max(1, (5 + i) * step * 0.4 + Math.random() * 20)).toFixed(2)
    const ceChg = +((Math.random() - 0.3) * ceLtp * 0.1).toFixed(2)
    const peChg = +((Math.random() - 0.7) * peLtp * 0.1).toFixed(2)
    rows.push(mkOPT(underlying, strike, 'CE', ceLtp, ceChg, Math.floor(8000 + Math.random() * 20000), lotSize, expiry))
    rows.push(mkOPT(underlying, strike, 'PE', peLtp, peChg, Math.floor(8000 + Math.random() * 20000), lotSize, expiry))
  }
  return rows
}

// ══════════════════════════════════════════════════
//  PREDEFINED PORTFOLIOS
// ══════════════════════════════════════════════════

export const PORTFOLIO_INDICES = [
  mkIDX('NIFTY 50', 24250.50, 180.25), mkIDX('BANK NIFTY', 51520.00, 425.10),
  mkIDX('SENSEX', 79850.25, 520.75), mkIDX('INDIA VIX', 14.25, -0.85),
  mkIDX('NIFTY IT', 33150.00, -120.50), mkIDX('NIFTY FIN', 22850.00, 195.25),
  mkIDX('NIFTY PHARMA', 18420.00, 85.50), mkIDX('NIFTY AUTO', 23680.00, 312.00),
  mkIDX('NIFTY METAL', 8250.00, -45.25), mkIDX('NIFTY FMCG', 56200.00, 125.00),
  mkIDX('NIFTY ENERGY', 35800.00, 210.50), mkIDX('NIFTY REALTY', 1025.00, 18.75),
  mkIDX('NIFTY MIDCAP', 52400.00, 380.00), mkIDX('NIFTY SMLCAP', 17250.00, 92.50),
]

export const PORTFOLIO_BANK = [
  mkEQ('HDFCBANK', 1685.00, -5.75, 980000, 550), mkEQ('ICICIBANK', 1245.50, 3.75, 720000, 700),
  mkEQ('KOTAKBANK', 1820.00, 12.50, 450000, 400), mkEQ('SBIN', 825.50, 4.25, 540000, 1500),
  mkEQ('AXISBANK', 1125.00, 6.25, 480000, 900), mkEQ('INDUSINDBK', 1480.00, -8.50, 320000, 500),
  mkEQ('BANDHANBNK', 185.00, 2.25, 620000, 800), mkEQ('FEDERALBNK', 168.50, 1.75, 350000, 5000),
  mkEQ('PNB', 105.25, -0.75, 890000, 8000), mkEQ('BANKBARODA', 242.00, 3.50, 550000, 5850),
  mkEQ('IDFCFIRSTB', 72.50, 0.85, 980000, 10000), mkEQ('AUBANK', 635.00, -4.25, 280000, 1000),
  mkFUT('HDFCBANK', 1687.50, -4.25, 850000, 550), mkFUT('ICICIBANK', 1247.00, 4.00, 620000, 700),
  mkFUT('SBIN', 826.50, 4.75, 440000, 1500), mkFUT('AXISBANK', 1126.50, 6.75, 380000, 900),
  ...genOptions('BANKNIFTY', 51500, 100, 30),
]

export const PORTFOLIO_IT = [
  mkEQ('TCS', 3850.00, -19.25, 820000, 175), mkEQ('INFY', 1520.75, 8.25, 650000, 300),
  mkEQ('WIPRO', 485.00, -2.50, 320000, 1500), mkEQ('HCLTECH', 1680.00, 15.50, 420000, 350),
  mkEQ('TECHM', 1350.00, -8.75, 380000, 600), mkEQ('LTI', 5200.00, 42.00, 150000, 150),
  mkEQ('MPHASIS', 2450.00, -18.50, 120000, 200), mkEQ('COFORGE', 5800.00, 35.00, 85000, 100),
  mkEQ('PERSISTENT', 4850.00, 28.00, 95000, 100), mkEQ('LTTS', 4680.00, -22.50, 78000, 150),
  mkFUT('TCS', 3855.00, -17.50, 720000, 175), mkFUT('INFY', 1522.50, 9.00, 550000, 300),
  mkFUT('WIPRO', 486.00, -1.75, 260000, 1500),
  ...genOptions('NIFTY IT', 33150, 200, 25),
]

export const PORTFOLIO_PHARMA = [
  mkEQ('SUNPHARMA', 1780.00, 12.50, 450000, 700), mkEQ('DRREDDY', 6250.00, -35.00, 120000, 125),
  mkEQ('CIPLA', 1520.00, 8.75, 380000, 650), mkEQ('DIVISLAB', 4850.00, 28.50, 95000, 100),
  mkEQ('APOLLOHOSP', 6100.00, -42.00, 85000, 125), mkEQ('LUPIN', 2080.00, 15.25, 280000, 425),
  mkEQ('BIOCON', 325.00, 2.75, 520000, 2300), mkEQ('AUROPHARMA', 1250.00, -6.50, 220000, 325),
  mkEQ('TORNTPHARM', 3250.00, 18.00, 65000, 150), mkEQ('GLENMARK', 1480.00, 9.25, 180000, 450),
  mkFUT('SUNPHARMA', 1782.50, 13.25, 350000, 700), mkFUT('DRREDDY', 6255.00, -32.50, 95000, 125),
  ...genOptions('NIFTY PHARMA', 18400, 200, 25),
]

export const PORTFOLIO_AUTO = [
  mkEQ('TATAMOTORS', 682.25, 15.75, 780000, 1425), mkEQ('MARUTI', 12850.00, 125.50, 95000, 100),
  mkEQ('M&M', 2850.00, 22.50, 350000, 350), mkEQ('BAJAJ-AUTO', 8950.00, -45.00, 120000, 75),
  mkEQ('EICHERMOT', 4650.00, 32.00, 85000, 150), mkEQ('HEROMOTOCO', 4200.00, -18.50, 110000, 150),
  mkEQ('ASHOKLEY', 215.00, 3.25, 680000, 4600), mkEQ('BHARATFORG', 1350.00, 8.75, 220000, 500),
  mkEQ('BOSCHLTD', 32500.00, 185.00, 15000, 25), mkEQ('TVSMOTOR', 2580.00, -12.50, 180000, 375),
  mkFUT('TATAMOTORS', 683.50, 16.25, 680000, 1425), mkFUT('MARUTI', 12860.00, 128.00, 78000, 100),
  ...genOptions('NIFTY AUTO', 23700, 200, 25),
]

export const PORTFOLIO_METAL = [
  mkEQ('TATASTEEL', 148.50, 2.25, 950000, 6750), mkEQ('JSWSTEEL', 885.00, -5.50, 450000, 675),
  mkEQ('HINDALCO', 625.00, 8.75, 520000, 1400), mkEQ('COALINDIA', 385.00, 3.50, 380000, 2100),
  mkEQ('VEDL', 442.00, -2.75, 650000, 1550), mkEQ('NMDC', 215.00, 1.50, 420000, 4600),
  mkEQ('SAIL', 118.50, -0.85, 850000, 7150), mkEQ('NATIONALUM', 165.00, 2.25, 380000, 4300),
  mkEQ('JINDALSTEL', 845.00, 12.50, 280000, 750), mkEQ('APLAPOLLO', 1580.00, -8.25, 120000, 400),
  mkFUT('TATASTEEL', 149.00, 2.50, 820000, 6750), mkFUT('HINDALCO', 626.50, 9.25, 420000, 1400),
  ...genOptions('NIFTY METAL', 8250, 100, 25),
]

export const PORTFOLIO_FMCG = [
  mkEQ('HINDUNILVR', 2380.00, -12.50, 320000, 300), mkEQ('ITC', 435.00, 2.75, 850000, 1600),
  mkEQ('NESTLEIND', 2250.00, 15.00, 85000, 200), mkEQ('BRITANNIA', 5200.00, -28.00, 95000, 100),
  mkEQ('DABUR', 545.00, 3.25, 280000, 1250), mkEQ('MARICO', 585.00, -2.50, 220000, 900),
  mkEQ('GODREJCP', 1280.00, 8.50, 180000, 500), mkEQ('COLPAL', 2850.00, -15.00, 65000, 176),
  mkEQ('TATACONSUM', 1050.00, 6.75, 350000, 558), mkEQ('EMAMILTD', 620.00, 4.25, 145000, 1000),
  mkFUT('HINDUNILVR', 2382.50, -11.25, 250000, 300), mkFUT('ITC', 436.00, 3.25, 750000, 1600),
  ...genOptions('NIFTY FMCG', 56200, 500, 25),
]

export const PORTFOLIO_FUTURES = [
  mkFUT('NIFTY', 24255.00, 186.50, 2150000, 75),
  mkFUT('BANKNIFTY', 52160.00, -275.00, 1800000, 30),
  mkFUT('FINNIFTY', 22860.00, 198.00, 650000, 25),
  mkFUT('MIDCPNIFTY', 12450.00, 85.00, 280000, 50),
  mkFUT('RELIANCE', 2542.50, 13.25, 420000, 250),
  mkFUT('TCS', 3855.00, -17.50, 280000, 175),
  mkFUT('INFY', 1522.50, 9.00, 320000, 300),
  mkFUT('HDFCBANK', 1687.50, -4.25, 380000, 550),
  mkFUT('ICICIBANK', 1247.00, 4.00, 280000, 700),
  mkFUT('SBIN', 826.50, 4.75, 350000, 1500),
  mkFUT('TATAMOTORS', 683.50, 16.25, 320000, 1425),
  mkFUT('LT', 3522.50, -6.75, 150000, 150),
  mkFUT('BAJFINANCE', 7255.00, 54.25, 180000, 125),
  mkFUT('AXISBANK', 1126.50, 6.75, 220000, 900),
  mkFUT('MARUTI', 12860.00, 128.00, 65000, 100),
]

// NIFTY Options — all expiries
const NIFTY_EXPIRIES = ['24-APR-2026', '01-MAY-2026', '08-MAY-2026', '29-MAY-2026']
export const PORTFOLIO_NIFTY_OPTIONS = [
  ...genOptions('NIFTY', 24200, 100, 75, '24-APR-2026'),
  ...genOptions('NIFTY', 24200, 100, 75, '01-MAY-2026'),
  ...genOptions('NIFTY', 24200, 100, 75, '08-MAY-2026'),
  ...genOptions('NIFTY', 24200, 100, 75, '29-MAY-2026'),
]

// BANKNIFTY Options — all expiries
const BN_EXPIRIES = ['24-APR-2026', '30-APR-2026', '07-MAY-2026', '28-MAY-2026']
export const PORTFOLIO_BANKNIFTY_OPTIONS = [
  ...genOptions('BANKNIFTY', 51500, 100, 30, '24-APR-2026'),
  ...genOptions('BANKNIFTY', 51500, 100, 30, '30-APR-2026'),
  ...genOptions('BANKNIFTY', 51500, 100, 30, '07-MAY-2026'),
  ...genOptions('BANKNIFTY', 51500, 100, 30, '28-MAY-2026'),
]

// NIFTY 50 — All 50 stocks
export const PORTFOLIO_NIFTY50 = [
  mkEQ('RELIANCE', 2540.50, 12.50, 1254000, 250), mkEQ('TCS', 3850.00, -19.25, 820000, 175),
  mkEQ('INFY', 1520.75, 8.25, 650000, 300), mkEQ('HDFCBANK', 1685.00, -5.75, 980000, 550),
  mkEQ('ICICIBANK', 1245.50, 3.75, 720000, 700), mkEQ('KOTAKBANK', 1820.00, 12.50, 450000, 400),
  mkEQ('SBIN', 825.50, 4.25, 540000, 1500), mkEQ('AXISBANK', 1125.00, 6.25, 480000, 900),
  mkEQ('BAJFINANCE', 7250.00, 52.50, 350000, 125), mkEQ('LT', 3520.00, -8.00, 280000, 150),
  mkEQ('WIPRO', 485.00, -2.50, 320000, 1500), mkEQ('HCLTECH', 1680.00, 15.50, 420000, 350),
  mkEQ('TATAMOTORS', 682.25, 15.75, 780000, 1425), mkEQ('MARUTI', 12850.00, 125.50, 95000, 100),
  mkEQ('SUNPHARMA', 1780.00, 12.50, 450000, 700), mkEQ('HINDUNILVR', 2380.00, -12.50, 320000, 300),
  mkEQ('ITC', 435.00, 2.75, 850000, 1600), mkEQ('TITAN', 3250.00, 18.75, 180000, 250),
  mkEQ('ADANIENT', 2340.00, -45.00, 420000, 500), mkEQ('ADANIPORTS', 1380.00, 8.50, 350000, 625),
  mkEQ('POWERGRID', 305.00, 2.25, 520000, 4053), mkEQ('NTPC', 358.00, -1.50, 680000, 2925),
  mkEQ('ONGC', 255.00, 3.75, 750000, 3825), mkEQ('ULTRACEMCO', 10200.00, -65.00, 45000, 50),
  mkEQ('TECHM', 1350.00, -8.75, 380000, 600), mkEQ('M&M', 2850.00, 22.50, 350000, 350),
  mkEQ('ASIANPAINT', 2780.00, -15.25, 220000, 300), mkEQ('DRREDDY', 6250.00, -35.00, 120000, 125),
  mkEQ('CIPLA', 1520.00, 8.75, 380000, 650), mkEQ('DIVISLAB', 4850.00, 28.50, 95000, 100),
  mkEQ('TATASTEEL', 148.50, 2.25, 950000, 6750), mkEQ('JSWSTEEL', 885.00, -5.50, 450000, 675),
  mkEQ('HINDALCO', 625.00, 8.75, 520000, 1400), mkEQ('COALINDIA', 385.00, 3.50, 380000, 2100),
  mkEQ('BAJAJ-AUTO', 8950.00, -45.00, 120000, 75), mkEQ('EICHERMOT', 4650.00, 32.00, 85000, 150),
  mkEQ('HEROMOTOCO', 4200.00, -18.50, 110000, 150), mkEQ('NESTLEIND', 2250.00, 15.00, 85000, 200),
  mkEQ('BRITANNIA', 5200.00, -28.00, 95000, 100), mkEQ('APOLLOHOSP', 6100.00, -42.00, 85000, 125),
  mkEQ('GRASIM', 2450.00, 14.75, 180000, 350), mkEQ('BHARTIARTL', 1650.00, 22.00, 520000, 456),
  mkEQ('BPCL', 615.00, -3.25, 480000, 1800), mkEQ('INDUSINDBK', 1480.00, -8.50, 320000, 500),
  mkEQ('SBILIFE', 1520.00, 8.50, 180000, 375), mkEQ('HDFCLIFE', 650.00, 3.75, 350000, 1100),
  mkEQ('SHREECEM', 26800.00, -142.00, 25000, 25), mkEQ('TATACONSUM', 1050.00, 6.75, 350000, 558),
  mkEQ('DABUR', 545.00, 3.25, 280000, 1250), mkEQ('VEDL', 442.00, -2.75, 650000, 1550),
  mkEQ('PIDILITIND', 2920.00, 16.50, 120000, 250), mkEQ('HAVELLS', 1480.00, -7.25, 180000, 500),
  mkEQ('SIEMENS', 6450.00, 38.00, 55000, 75), mkEQ('ABB', 7250.00, -32.00, 45000, 50),
  mkEQ('TRENT', 5400.00, 45.00, 150000, 120), mkEQ('MOTHERSON', 168.00, 2.50, 820000, 5600),
  mkEQ('ZOMATO', 248.00, 5.75, 1200000, 3100), mkEQ('JSWENERGY', 525.00, -3.50, 350000, 1800),
  mkEQ('TATAPOWER', 415.00, 6.25, 680000, 2025), mkEQ('HAL', 4250.00, 28.50, 180000, 150),
]

// Portfolio registry for MW dropdown
export const PORTFOLIO_REGISTRY = {
  'Default': null, // uses MOCK_SYMBOLS from data.js
  'NIFTY 50': PORTFOLIO_NIFTY50,
  'All Indices': PORTFOLIO_INDICES,
  'Near Month Futures': PORTFOLIO_FUTURES,
  'Bank Sector (EQ+FUT+OPT)': PORTFOLIO_BANK,
  'IT Sector (EQ+FUT+OPT)': PORTFOLIO_IT,
  'Pharma Sector (EQ+FUT+OPT)': PORTFOLIO_PHARMA,
  'Auto Sector (EQ+FUT+OPT)': PORTFOLIO_AUTO,
  'Metal Sector (EQ+FUT+OPT)': PORTFOLIO_METAL,
  'FMCG Sector (EQ+FUT+OPT)': PORTFOLIO_FMCG,
  'NIFTY Options (All Expiry)': PORTFOLIO_NIFTY_OPTIONS,
  'BANKNIFTY Options (All Expiry)': PORTFOLIO_BANKNIFTY_OPTIONS,
}
