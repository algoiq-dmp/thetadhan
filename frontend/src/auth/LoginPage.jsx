import { useState, useRef, useEffect, useMemo } from 'react';
import useAuthStore from '../store/useAuthStore';

export default function LoginPage() {
  const authStep = useAuthStore(s => s.authStep);
  const loginError = useAuthStore(s => s.loginError);
  const loading = useAuthStore(s => s.loading);
  const loginFn = useAuthStore(s => s.login);
  const verifyPinFn = useAuthStore(s => s.verifyPin);
  const sendOTPFn = useAuthStore(s => s.sendOTP);
  const verifyOTPFn = useAuthStore(s => s.verifyOTP);
  const ssoLoginFn = useAuthStore(s => s.ssoLogin);
  const generateQR = useAuthStore(s => s.generateQRSession);
  const qrSessionId = useAuthStore(s => s.qrSessionId);
  const pinSet = useAuthStore(s => s.pinSet);
  const setPinFn = useAuthStore(s => s.setPin);
  const trustDeviceFn = useAuthStore(s => s.trustDevice);
  const otpSent = useAuthStore(s => s.otpSent);

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPinVal] = useState('');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const pinRef = useRef(null);
  const otpRef = useRef(null);

  useEffect(() => {
    if (authStep === 2) setTimeout(() => pinRef.current?.focus(), 100);
    if (authStep === 3) setTimeout(() => otpRef.current?.focus(), 100);
  }, [authStep]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const ok = await loginFn(userId, password);
    if (ok && !pinSet) setShowPinSetup(true);
  };

  const handlePinChange = (e) => {
    const v = e.target.value.replace(/\D/g, '');
    setPinVal(v);
    if (v.length === 6) setTimeout(() => { verifyPinFn(v); setPinVal(''); }, 150);
  };

  const handleOtpChange = (e) => {
    const v = e.target.value.replace(/\D/g, '');
    setOtp(v);
    if (v.length === 6) setTimeout(() => {
      const ok = verifyOTPFn(v);
      if (ok && rememberDevice) trustDeviceFn();
      setOtp('');
    }, 150);
  };

  const handleSendOTP = () => {
    const code = sendOTPFn();
    setDemoOtp(code);
  };

  const handleSetPin = () => {
    if (newPin.length === 6 && newPin === confirmPin) {
      setPinFn(newPin);
      setShowPinSetup(false);
    }
  };

  // Background grid (memoized to avoid re-render)
  const gridBG = useMemo(() => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', background: 'linear-gradient(135deg, #0a0e17 0%, #0d1525 50%, #0a0e17 100%)' }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{ position: 'absolute', width: 1, background: 'rgba(6,182,212,0.05)', top: 0, bottom: 0, left: `${(i + 1) * 5}%` }} />
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={`h${i}`} style={{ position: 'absolute', height: 1, background: 'rgba(6,182,212,0.05)', left: 0, right: 0, top: `${(i + 1) * 8}%` }} />
      ))}
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', top: '20%', left: '60%', animation: 'pulse 4s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', bottom: '10%', left: '20%', animation: 'pulse 5s ease-in-out infinite 1s' }} />
    </div>
  ), []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {gridBG}
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ ...cardStyle, animation: 'slideUp 0.5s ease', width: 400 }}>
        {/* Step indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: authStep >= s ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${authStep >= s ? '#06b6d4' : '#1e2a3a'}`,
                color: authStep >= s ? '#06b6d4' : '#475569',
              }}>
                {authStep > s ? '✓' : s}
              </div>
              {s < 3 && <div style={{ width: 24, height: 2, background: authStep > s ? '#06b6d4' : '#1e2a3a', borderRadius: 1 }} />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Login ── */}
        {authStep === 1 && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>⚡</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', margin: 0 }}>ThetaDhan</h1>
              <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>Pro NSE F&O Trading Terminal</p>
            </div>

            <div>
              <label style={labelStyle}>User ID</label>
              <input id="login-userid" style={inputStyle} type="text" value={userId}
                onChange={e => setUserId(e.target.value)} placeholder="Enter your User ID" autoComplete="username" />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input id="login-password" style={inputStyle} type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password" />
            </div>

            {loginError && <div style={errorStyle}>{loginError}</div>}

            <button type="submit" disabled={loading || !userId || !password} style={btnPrimary}>
              {loading ? '⏳ Authenticating...' : '🔐 Sign In'}
            </button>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={() => ssoLoginFn('TalkOptions')} style={btnSSO}>🧠 TalkOptions SSO</button>
              <button type="button" onClick={() => ssoLoginFn('TalkDelta')} style={btnSSO}>📡 TalkDelta SSO</button>
            </div>

            <button type="button" onClick={() => { setShowQR(true); generateQR(); }} style={btnLink}>📱 Login with QR Code</button>

            <div style={{ textAlign: 'center', fontSize: 10, color: '#475569', marginTop: 8 }}>
              Demo: admin / admin123 &nbsp;|&nbsp; trader / trade123
            </div>
          </form>
        )}

        {/* ── STEP 2: PIN ── */}
        {authStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 32 }}>🔢</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: 0 }}>Enter 6-Digit PIN</h2>
            <p style={{ fontSize: 11, color: '#64748b' }}>Security verification required</p>

            <div style={{ display: 'flex', gap: 8 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{
                  width: 44, height: 52, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: pin[i] ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `2px solid ${pin[i] ? '#06b6d4' : '#1e2a3a'}`,
                  fontSize: 20, fontWeight: 700, color: '#f8fafc', fontFamily: 'JetBrains Mono',
                }}>
                  {pin[i] ? '●' : ''}
                </div>
              ))}
            </div>

            <input ref={pinRef} type="password" inputMode="numeric" maxLength={6} value={pin}
              onChange={handlePinChange} style={{ ...inputStyle, width: 1, height: 1, opacity: 0, position: 'absolute' }} />
            <div onClick={() => pinRef.current?.focus()} style={{ cursor: 'pointer', fontSize: 10, color: '#06b6d4' }}>Tap to enter PIN</div>
            {loginError && <div style={errorStyle}>{loginError}</div>}
          </div>
        )}

        {/* ── STEP 3: OTP ── */}
        {authStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 32 }}>📲</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: 0 }}>Verify OTP</h2>
            <p style={{ fontSize: 11, color: '#64748b' }}>Enter the 6-digit code</p>

            {!otpSent ? (
              <button onClick={handleSendOTP} style={btnPrimary}>📩 Send OTP</button>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{
                      width: 44, height: 52, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: otp[i] ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `2px solid ${otp[i] ? '#10b981' : '#1e2a3a'}`,
                      fontSize: 20, fontWeight: 700, color: '#f8fafc', fontFamily: 'JetBrains Mono',
                    }}>
                      {otp[i] || ''}
                    </div>
                  ))}
                </div>
                <input ref={otpRef} type="text" inputMode="numeric" maxLength={6} value={otp}
                  onChange={handleOtpChange} style={{ ...inputStyle, width: 1, height: 1, opacity: 0, position: 'absolute' }} autoFocus />
                <div onClick={() => otpRef.current?.focus()} style={{ cursor: 'pointer', fontSize: 10, color: '#10b981' }}>Tap to enter OTP</div>

                {demoOtp && <div style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '4px 12px', borderRadius: 6 }}>
                  Demo OTP: <strong>{demoOtp}</strong>
                </div>}

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', cursor: 'pointer' }}>
                  <input type="checkbox" checked={rememberDevice} onChange={e => setRememberDevice(e.target.checked)} />
                  Remember this device for 30 days
                </label>
              </>
            )}
            {loginError && <div style={errorStyle}>{loginError}</div>}
            <button onClick={handleSendOTP} style={btnLink}>Resend OTP</button>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQR && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowQR(false)}>
          <div style={cardStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', textAlign: 'center' }}>📱 QR Code Login</h3>
            <p style={{ fontSize: 11, color: '#64748b', textAlign: 'center' }}>Scan with TalkOptions or TalkDelta app</p>
            <div style={{ width: 200, height: 200, margin: '16px auto', background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <svg width="180" height="180" viewBox="0 0 180 180">
                {Array.from({ length: 18 }).map((_, r) =>
                  Array.from({ length: 18 }).map((_, c) => {
                    const isCorner = (r < 4 && c < 4) || (r < 4 && c > 13) || (r > 13 && c < 4);
                    return (isCorner || ((r * 18 + c) % 3 !== 0)) ? <rect key={`${r}-${c}`} x={c * 10} y={r * 10} width={9} height={9} fill="#111" rx={1} /> : null;
                  })
                )}
              </svg>
              <div style={{ position: 'absolute', width: 36, height: 36, background: '#06b6d4', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 10, color: '#64748b' }}>Session: {qrSessionId?.slice(0, 16)}...</div>
            <div style={{ textAlign: 'center', fontSize: 10, color: '#f59e0b', marginTop: 4 }}>⏱️ Expires in 60 seconds</div>
          </div>
        </div>
      )}

      {/* PIN Setup Modal */}
      {showPinSetup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', textAlign: 'center' }}>🔢 Set Your 6-Digit PIN</h3>
            <p style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginBottom: 12 }}>Required on every login</p>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>New PIN</label>
              <input style={inputStyle} type="password" inputMode="numeric" maxLength={6} value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} placeholder="6-digit PIN" autoFocus />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Confirm PIN</label>
              <input style={inputStyle} type="password" inputMode="numeric" maxLength={6} value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} placeholder="Confirm PIN" />
            </div>
            {newPin.length === 6 && confirmPin.length === 6 && newPin !== confirmPin && <div style={errorStyle}>PINs do not match</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowPinSetup(false)} style={btnSecondary}>Skip</button>
              <button onClick={handleSetPin} disabled={newPin.length !== 6 || newPin !== confirmPin} style={btnPrimary}>Set PIN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { width: '100%', height: 42, padding: '0 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2a3a', color: '#f8fafc', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none' };
const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4 };
const btnPrimary = { width: '100%', height: 42, borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter' };
const btnSecondary = { flex: 1, height: 38, borderRadius: 8, border: '1px solid #1e2a3a', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter' };
const btnSSO = { flex: 1, height: 36, borderRadius: 8, border: '1px solid #1e2a3a', background: 'rgba(255,255,255,0.03)', color: '#94a3b8', fontSize: 10, cursor: 'pointer', fontFamily: 'Inter', fontWeight: 600 };
const btnLink = { background: 'none', border: 'none', color: '#06b6d4', fontSize: 11, cursor: 'pointer', textAlign: 'center', fontFamily: 'Inter' };
const errorStyle = { fontSize: 11, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '6px 10px', borderRadius: 6, textAlign: 'center' };
const cardStyle = { position: 'relative', zIndex: 1, padding: 32, borderRadius: 16, background: 'rgba(17,24,39,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(30,42,58,0.8)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' };
