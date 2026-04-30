/**
 * TalkOptions Service — Options Intelligence API Client
 * 
 * Our own product, same environment. Zero latency, unlimited calls.
 * Primary path: TalkOptions → Garuda (port 3011) → Theta Yantra
 * Fallback: Direct TalkOptions API
 */

const TALK_OPTIONS_BASE = 'https://webapi.talkoptions.in/api';
const X_BYPASS = '34f38c9f-a786-4fc4-81e1-b1f1c378d512';

class TalkOptionsService {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
    this.sessionId = null;
    this.isConnected = false;
    this.lastError = null;
  }

  // ── Auth ──
  async login(userName = '9082460356', password = 'Yashvi@3011') {
    try {
      const res = await fetch(`${TALK_OPTIONS_BASE}/Auth/Login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-bypass': X_BYPASS },
        body: JSON.stringify({ UserName: userName, Password: password }),
      });
      const data = await res.json();
      if (data.Status && data.Result?.AccessToken) {
        this.token = data.Result.AccessToken;
        this.tokenExpiry = Date.now() + (data.Result.TokenExpiresIn || 60) * 60 * 1000;
        this.sessionId = data.Result.SessionID;
        this.isConnected = true;
        this.lastError = null;
        console.log('[TalkOptions] Authenticated. Session:', this.sessionId);
        return true;
      }
      this.lastError = 'Login failed';
      return false;
    } catch (err) {
      this.lastError = err.message;
      this.isConnected = false;
      console.warn('[TalkOptions] Auth failed:', err.message);
      return false;
    }
  }

  async ensureAuth() {
    if (!this.token || Date.now() > (this.tokenExpiry - 5 * 60 * 1000)) {
      return this.login();
    }
    return true;
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      'x-bypass': X_BYPASS,
      'AppId': 'theta-yantra',
    };
  }

  async apiCall(endpoint, body = {}) {
    await this.ensureAuth();
    if (!this.token) return null;
    try {
      const res = await fetch(`${TALK_OPTIONS_BASE}/${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.Status === false) {
        console.warn(`[TalkOptions] ${endpoint} error:`, data.Message);
        return null;
      }
      return data.Result || data;
    } catch (err) {
      console.warn(`[TalkOptions] ${endpoint} failed:`, err.message);
      return null;
    }
  }

  // ── 13 API Endpoints ──

  /** 1. Option Chain — Full chain with Strike, IV, OI, Greeks */
  async getOptionChain(symbol = 'NIFTY', expiry = '') {
    return this.apiCall('OptionChain/GetOptionChain', { Symbol: symbol, ExpiryDate: expiry });
  }

  /** 2. OI Analysis — OI change & concentration */
  async getOI(symbol = 'NIFTY', expiry = '') {
    return this.apiCall('OI/GetOI', { Symbol: symbol, ExpiryDate: expiry });
  }

  /** 3. PCR — Put-Call Ratio */
  async getPCR(symbol = 'NIFTY', expiry = '') {
    return this.apiCall('PCR/GetPCR', { Symbol: symbol, ExpiryDate: expiry });
  }

  /** 4. Max Pain — Max pain strike level */
  async getMaxPain(symbol = 'NIFTY', expiry = '') {
    return this.apiCall('MaxPain/GetMaxPain', { Symbol: symbol, ExpiryDate: expiry });
  }

  /** 5. IV Rank — IV Rank & Percentile */
  async getIVRank(symbol = 'NIFTY') {
    return this.apiCall('IVRank/GetIVRank', { Symbol: symbol });
  }

  /** 6. IV Screener — Top IV instruments */
  async getIVScreener(type = 'Index') {
    return this.apiCall('IVScreener/GetIVScreener', { Type: type });
  }

  /** 7. IV Skew — Strike-wise IV skew */
  async getIVSkew(symbol = 'NIFTY', expiry = '') {
    return this.apiCall('IVSkew/GetIVSkew', { Symbol: symbol, ExpiryDate: expiry });
  }

  /** 8. IV History — Historical IV (30/90/365 days) */
  async getIVHistory(symbol = 'NIFTY', days = 30) {
    return this.apiCall('IVHistory/GetIVHistory', { Symbol: symbol, Days: days });
  }

  /** 9. Intraday Buildup — OI buildup analysis */
  async getIntradayBuildup(symbol = 'NIFTY', expiry = '') {
    return this.apiCall('IntradayBuildup/GetIntradayBuildup', { Symbol: symbol, ExpiryDate: expiry });
  }

  /** 10. MMI — Market Mood Index */
  async getMMI() {
    return this.apiCall('MMI/GetMMI', {});
  }

  /** 11. Greeks — Per-option Greeks */
  async getGreeks(symbol = 'NIFTY', strike = 24000, optionType = 'CE', expiry = '') {
    return this.apiCall('Greeks/GetGreeks', { Symbol: symbol, Strike: strike, OptionType: optionType, ExpiryDate: expiry });
  }

  /** 12. Expiries — Available expiry dates */
  async getExpiries(symbol = 'NIFTY') {
    return this.apiCall('Expiries/GetExpiries', { Symbol: symbol });
  }

  /** 13. Lot Size — Official lot sizes */
  async getLotSize(symbol = 'NIFTY') {
    return this.apiCall('LotSize/GetLotSize', { Symbol: symbol });
  }

  // ── Convenience Methods ──

  /** Get ATM strike data with OI + IV */
  async getATMData(symbol = 'NIFTY', spotPrice, expiry = '') {
    const chain = await this.getOptionChain(symbol, expiry);
    if (!chain?.OptionChain) return null;
    
    // Find ATM strike
    const strikes = chain.OptionChain;
    let atm = strikes[0];
    let minDiff = Infinity;
    strikes.forEach(s => {
      const diff = Math.abs(s.Strike - spotPrice);
      if (diff < minDiff) { minDiff = diff; atm = s; }
    });

    return {
      atmStrike: atm.Strike,
      callIV: parseFloat(atm.CallIV) || 0,
      putIV: parseFloat(atm.PutIV) || 0,
      callOI: atm.DbCallOI,
      putOI: atm.DbPutOI,
      callDelta: parseFloat(atm.CallDelta1) || 0,
      putDelta: parseFloat(atm.PutDelta1) || 0,
      callPrice: parseFloat(atm.DbCallPrice) || 0,
      putPrice: parseFloat(atm.DbPutPrice) || 0,
      straddlePrice: (parseFloat(atm.DbCallPrice) || 0) + (parseFloat(atm.DbPutPrice) || 0),
      callBuildup: atm.CallBuiltUP,
      putBuildup: atm.PutBuiltUp,
    };
  }

  /** Get full IV intelligence for a symbol */
  async getFullIVIntelligence(symbol = 'NIFTY') {
    const [ivRank, ivScreener, expiries] = await Promise.all([
      this.getIVRank(symbol),
      this.getIVScreener('Index'),
      this.getExpiries(symbol),
    ]);

    return { ivRank, ivScreener, expiries };
  }

  /** Connection status */
  getStatus() {
    return {
      connected: this.isConnected,
      tokenValid: this.token && Date.now() < this.tokenExpiry,
      sessionId: this.sessionId,
      lastError: this.lastError,
      tokenExpiresIn: this.tokenExpiry ? Math.max(0, Math.round((this.tokenExpiry - Date.now()) / 60000)) : 0,
    };
  }
}

// Singleton
const talkOptionsService = new TalkOptionsService();
export default talkOptionsService;
