/**
 * Portfolio Filters — Filter functions for live symbol data
 * Each filter is a function (symbol) => boolean that filters storeSymbols
 * Replaces the old mock/portfolios.js hardcoded data
 */

// Symbol lists for sector classification
const BANK_SYMBOLS = ['HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'SBIN', 'AXISBANK', 'INDUSINDBK', 'BANDHANBNK', 'FEDERALBNK', 'PNB', 'BANKBARODA', 'IDFCFIRSTB', 'AUBANK', 'BANKNIFTY']
const IT_SYMBOLS = ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM', 'LTI', 'MPHASIS', 'COFORGE', 'PERSISTENT', 'LTTS', 'NIFTY IT']
const PHARMA_SYMBOLS = ['SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB', 'APOLLOHOSP', 'LUPIN', 'BIOCON', 'AUROPHARMA', 'TORNTPHARM', 'GLENMARK', 'NIFTY PHARMA']
const AUTO_SYMBOLS = ['TATAMOTORS', 'MARUTI', 'M&M', 'BAJAJ-AUTO', 'EICHERMOT', 'HEROMOTOCO', 'ASHOKLEY', 'BHARATFORG', 'BOSCHLTD', 'TVSMOTOR', 'NIFTY AUTO']
const METAL_SYMBOLS = ['TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'COALINDIA', 'VEDL', 'NMDC', 'SAIL', 'NATIONALUM', 'JINDALSTEL', 'APLAPOLLO', 'NIFTY METAL']
const FMCG_SYMBOLS = ['HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'DABUR', 'MARICO', 'GODREJCP', 'COLPAL', 'TATACONSUM', 'EMAMILTD', 'NIFTY FMCG']
const INDEX_SYMBOLS = ['NIFTY', 'NIFTY 50', 'BANKNIFTY', 'BANK NIFTY', 'SENSEX', 'INDIA VIX', 'NIFTY IT', 'NIFTY FIN', 'FINNIFTY', 'NIFTY PHARMA', 'NIFTY AUTO', 'NIFTY METAL', 'NIFTY FMCG', 'NIFTY ENERGY', 'NIFTY REALTY', 'NIFTY MIDCAP', 'NIFTY SMLCAP']

const matchesSector = (sym, sectorList) => {
  const name = sym.symbol?.toUpperCase() || ''
  return sectorList.some(s => name.includes(s.toUpperCase()))
}

export const PORTFOLIO_FILTERS = {
  'Default': null, // shows all storeSymbols
  'All Indices': (s) => s.type === 'IDX' || s.instrument === 'INDEX' || INDEX_SYMBOLS.some(idx => s.symbol?.toUpperCase().includes(idx)),
  'Near Month Futures': (s) => s.type === 'FUT' || s.instrument?.includes('FUT'),
  'All Options': (s) => s.type === 'CE' || s.type === 'PE' || s.instrument?.includes('OPT'),
  'NIFTY Options': (s) => (s.type === 'CE' || s.type === 'PE') && s.symbol?.includes('NIFTY') && !s.symbol?.includes('BANK'),
  'BANKNIFTY Options': (s) => (s.type === 'CE' || s.type === 'PE') && s.symbol?.includes('BANKNIFTY'),
  'Bank Sector': (s) => matchesSector(s, BANK_SYMBOLS),
  'IT Sector': (s) => matchesSector(s, IT_SYMBOLS),
  'Pharma Sector': (s) => matchesSector(s, PHARMA_SYMBOLS),
  'Auto Sector': (s) => matchesSector(s, AUTO_SYMBOLS),
  'Metal Sector': (s) => matchesSector(s, METAL_SYMBOLS),
  'FMCG Sector': (s) => matchesSector(s, FMCG_SYMBOLS),
}
