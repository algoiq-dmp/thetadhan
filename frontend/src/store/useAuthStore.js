import { create } from 'zustand';

// Simple encryption for PIN
const encrypt = (text) => btoa(encodeURIComponent(text));

const API_URL = import.meta.env.VITE_API_URL || 'https://thetadhan-api.parlight2.workers.dev';

const useAuthStore = create((set, get) => ({
  // Auth state
  isAuthenticated: false,
  authStep: 1,
  user: null,
  token: null,            // TY terminal token (local)
  dhanToken: null,        // Real Dhan access token (from Worker)
  dhanClientId: null,
  dhanClientName: null,
  tokenExpiry: null,
  deviceTrusted: false,
  loginError: null,
  loading: false,
  dhanConnected: false,

  // PIN state
  pinSet: !!localStorage.getItem('ty_pin_hash'),
  pinAttempts: 0,

  // OTP state
  otpSent: false,
  otpExpiry: null,
  otpAttempts: 0,

  // QR state
  qrSessionId: null,
  qrPolling: false,

  // Engine credentials
  credentials: JSON.parse(localStorage.getItem('ty_credentials') || '{}'),

  // ── Step 1: TY Terminal Login (unchanged: admin/admin123) ──
  login: async (userId, password) => {
    set({ loading: true, loginError: null });
    try {
      await new Promise(r => setTimeout(r, 800));

      const demoUsers = {
        'admin': { password: 'admin123', name: 'Admin', role: 'admin' },
        'trader': { password: 'trade123', name: 'Trader Pro', role: 'trader' },
      };

      const user = demoUsers[userId.toLowerCase()];
      if (!user || user.password !== password) {
        set({ loading: false, loginError: 'Invalid credentials' });
        return false;
      }

      const token = `ty_jwt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;

      const deviceHash = get().getDeviceHash();
      const trustedDevices = JSON.parse(localStorage.getItem('ty_trusted_devices') || '[]');
      const isTrusted = trustedDevices.includes(deviceHash);

      set({
        loading: false,
        user: { id: userId, name: user.name, role: user.role },
        token,
        tokenExpiry,
        authStep: get().pinSet ? 2 : (isTrusted ? 4 : 3),
        isAuthenticated: isTrusted && !get().pinSet,
        deviceTrusted: isTrusted,
      });

      if (isTrusted && !get().pinSet) {
        set({ isAuthenticated: true, authStep: 4 });
      }

      // ── Auto-connect to Dhan in background after TY login ──
      get().connectDhan();

      return true;
    } catch (err) {
      set({ loading: false, loginError: 'Connection error' });
      return false;
    }
  },

  // ── Auto-connect to Dhan using Worker env secrets (TOTP) ──
  connectDhan: async () => {
    // Check if already have a valid token in localStorage
    const existingToken = localStorage.getItem('dhan_token');
    const existingClientId = localStorage.getItem('dhan_client_id');
    
    if (existingToken && existingClientId) {
      set({
        dhanToken: existingToken,
        dhanClientId: existingClientId,
        dhanClientName: localStorage.getItem('dhan_client_name') || existingClientId,
        dhanConnected: true,
      });
      // Update the display name from Dhan
      const name = localStorage.getItem('dhan_client_name');
      if (name) {
        set(s => ({ user: s.user ? { ...s.user, name } : s.user }));
      }
      return;
    }

    try {
      // Call Worker — it uses DHAN_PIN + DHAN_TOTP_SECRET from env to auto-login
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broker: 'dhan' }), // clientId comes from Worker env
      });

      const data = await res.json();
      if (data.success && data.accessToken) {
        localStorage.setItem('dhan_token', data.accessToken);
        localStorage.setItem('dhan_client_id', data.clientId);
        localStorage.setItem('dhan_client_name', data.clientName || data.clientId);
        
        set(s => ({
          dhanToken: data.accessToken,
          dhanClientId: data.clientId,
          dhanClientName: data.clientName || data.clientId,
          dhanConnected: true,
          // Update user display name to real Dhan account name
          user: s.user ? { ...s.user, name: data.clientName || s.user.name } : s.user,
        }));

        console.log(`[Auth] ✓ Dhan auto-connected: ${data.clientName}`);
      } else {
        console.warn('[Auth] Dhan auto-connect failed:', data.error);
      }
    } catch (err) {
      console.warn('[Auth] Dhan connect error:', err.message);
    }
  },

  // ── Restore session on page refresh ──
  restoreSession: async () => {
    const token = localStorage.getItem('dhan_token');
    const clientId = localStorage.getItem('dhan_client_id');
    const clientName = localStorage.getItem('dhan_client_name');
    if (token && clientId) {
      set({ dhanToken: token, dhanClientId: clientId, dhanClientName: clientName, dhanConnected: true });
    }
  },

  // ── Step 2: Verify PIN ──
  verifyPin: (pin) => {
    const stored = localStorage.getItem('ty_pin_hash');
    if (!stored) return true;

    if (encrypt(pin) === stored) {
      set({ pinAttempts: 0, authStep: 3 });
      if (get().deviceTrusted) {
        set({ isAuthenticated: true, authStep: 4 });
        get().connectDhan();
      }
      return true;
    } else {
      const attempts = get().pinAttempts + 1;
      set({ pinAttempts: attempts, loginError: `Wrong PIN (${3 - attempts} attempts left)` });
      if (attempts >= 3) {
        set({ authStep: 3, loginError: 'PIN locked. Verify via OTP.' });
      }
      return false;
    }
  },

  setPin: (pin) => {
    localStorage.setItem('ty_pin_hash', encrypt(pin));
    set({ pinSet: true });
  },

  // ── Step 3: OTP ──
  sendOTP: () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('ty_demo_otp', otp);
    set({ otpSent: true, otpExpiry: Date.now() + 120000, otpAttempts: 0 });
    console.log(`[AUTH] Demo OTP: ${otp}`);
    return otp;
  },

  verifyOTP: (otp) => {
    const stored = localStorage.getItem('ty_demo_otp');
    if (otp === stored) {
      localStorage.removeItem('ty_demo_otp');
      set({ isAuthenticated: true, authStep: 4, otpAttempts: 0 });
      get().connectDhan();
      return true;
    } else {
      const attempts = get().otpAttempts + 1;
      set({ otpAttempts: attempts, loginError: `Invalid OTP (${3 - attempts} left)` });
      if (attempts >= 3) {
        set({ authStep: 1, loginError: 'Account locked. Try again in 15 minutes.' });
      }
      return false;
    }
  },

  generateQRSession: () => {
    const sessionId = `qr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    set({ qrSessionId: sessionId, qrPolling: true });
    return sessionId;
  },

  ssoLogin: async (provider) => {
    set({ loading: true });
    await new Promise(r => setTimeout(r, 1000));
    set({
      loading: false, isAuthenticated: true, authStep: 4,
      user: { id: 'sso_user', name: `${provider} User`, role: 'trader' },
      token: `sso_${provider}_${Date.now()}`,
      tokenExpiry: Date.now() + 24 * 60 * 60 * 1000,
    });
    get().connectDhan();
    return true;
  },

  getDeviceHash: () => {
    const raw = `${navigator.userAgent}|${screen.width}x${screen.height}|${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    return `dev_${Math.abs(hash).toString(36)}`;
  },

  trustDevice: () => {
    const hash = get().getDeviceHash();
    const devices = JSON.parse(localStorage.getItem('ty_trusted_devices') || '[]');
    if (!devices.includes(hash)) devices.push(hash);
    localStorage.setItem('ty_trusted_devices', JSON.stringify(devices));
    set({ deviceTrusted: true });
  },

  saveCredential: (service, creds) => {
    const all = { ...get().credentials, [service]: { ...creds, savedAt: Date.now() } };
    localStorage.setItem('ty_credentials', JSON.stringify(all));
    set({ credentials: all });
  },

  getCredential: (service) => get().credentials[service] || null,

  logout: () => {
    localStorage.removeItem('dhan_token');
    localStorage.removeItem('dhan_client_id');
    localStorage.removeItem('dhan_client_name');
    set({
      isAuthenticated: false, authStep: 1, user: null, token: null,
      dhanToken: null, dhanClientId: null, dhanClientName: null, dhanConnected: false,
      tokenExpiry: null, loginError: null, pinAttempts: 0, otpAttempts: 0, otpSent: false,
      qrSessionId: null, qrPolling: false,
    });
  },

  refreshToken: () => {
    if (get().token && get().tokenExpiry) {
      const timeLeft = get().tokenExpiry - Date.now();
      if (timeLeft < 5 * 60 * 1000) {
        set({ tokenExpiry: Date.now() + 24 * 60 * 60 * 1000 });
      }
    }
  },
}));

export default useAuthStore;
