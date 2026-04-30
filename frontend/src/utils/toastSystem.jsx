import { useState, useEffect, useCallback } from 'react';

// Global toast state
let toastIdCounter = 0;
let toastListeners = [];

function notifyListeners(toasts) {
  toastListeners.forEach(fn => fn(toasts));
}

let currentToasts = [];

/**
 * Show a toast notification
 * @param {string} message
 * @param {'info'|'success'|'warning'|'error'} type
 * @param {number} duration ms
 */
export function showToast(message, type = 'info', duration = 4000) {
  const id = ++toastIdCounter;
  const toast = { id, message, type, timestamp: Date.now() };
  currentToasts = [...currentToasts, toast];
  notifyListeners(currentToasts);

  setTimeout(() => {
    currentToasts = currentToasts.filter(t => t.id !== id);
    notifyListeners(currentToasts);
  }, duration);

  return id;
}

/**
 * React hook to subscribe to toasts
 */
export function useToasts() {
  const [toasts, setToasts] = useState(currentToasts);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter(fn => fn !== setToasts);
    };
  }, []);

  return toasts;
}

/**
 * Toast Container Component
 */
export function ToastContainer() {
  const toasts = useToasts();

  const iconMap = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '🚨' };
  const colorMap = {
    info: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', color: 'var(--blue)' },
    success: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', color: 'var(--green)' },
    warning: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: 'var(--orange)' },
    error: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', color: 'var(--red)' },
  };

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: 60, right: 16, zIndex: 99999,
      display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 360
    }}>
      {toasts.map(t => {
        const style = colorMap[t.type] || colorMap.info;
        return (
          <div key={t.id} style={{
            padding: '10px 14px', borderRadius: 8,
            background: style.bg, border: `1px solid ${style.border}`,
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'flex-start', gap: 8,
            animation: 'slideInRight 0.3s ease', fontSize: 12, color: 'var(--text-primary)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{iconMap[t.type]}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: style.color, marginBottom: 2 }}>{t.type.toUpperCase()}</div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{t.message}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
