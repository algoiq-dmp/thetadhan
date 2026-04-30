/**
 * useBrokerStore — Zustand store for broker auth & status
 * 
 * Manages which broker is active, login state, funds, and feed connectivity.
 * Works with the backend /api/broker/* routes via BrokerConnector.
 */
import { create } from 'zustand';
import BrokerConnector from '../connectors/BrokerConnector.js';

const connector = new BrokerConnector();

const useBrokerStore = create((set, get) => ({
  // State
  activeBroker: localStorage.getItem('ty_activeBroker') || null,  // 'dhan', 'xts', null
  brokerStatus: 'disconnected',  // disconnected | connecting | connected | error
  feedConnected: false,
  brokerProfile: null,   // { clientId, funds, ... }
  lastError: null,

  // Available brokers
  availableBrokers: [
    { id: 'dhan', name: 'Dhan', icon: '🟢', fields: ['clientId', 'accessToken'] },
    { id: 'xts', name: 'XTS (SRE)', icon: '🔌', fields: ['apiKey', 'secretKey', 'marketDataUrl', 'interactiveUrl'] },
    { id: 'upstox', name: 'Upstox', icon: '🟡', fields: ['apiKey', 'secretKey'], disabled: true },
    { id: 'groww', name: 'Groww', icon: '🟢', fields: ['apiKey', 'secretKey'], disabled: true },
    { id: 'shoonya', name: 'Shoonya', icon: '🟠', fields: ['userId', 'password', 'vendorCode', 'apiKey', 'imei'], disabled: true },
    { id: 'fyers', name: 'Fyers', icon: '🔵', fields: ['appId', 'accessToken'], disabled: true },
  ],

  // Actions
  loginBroker: async (brokerId, credentials) => {
    set({ brokerStatus: 'connecting', lastError: null });
    try {
      const result = await connector.login(brokerId, credentials);
      if (result.success) {
        localStorage.setItem('ty_activeBroker', brokerId);
        set({
          activeBroker: brokerId,
          brokerStatus: 'connected',
          brokerProfile: {
            clientId: result.clientId || credentials.clientId,
            funds: result.funds || null,
          },
          feedConnected: true,
        });
        return result;
      } else {
        set({ brokerStatus: 'error', lastError: result.message });
        return result;
      }
    } catch (err) {
      set({ brokerStatus: 'error', lastError: err.message });
      return { success: false, message: err.message };
    }
  },

  logoutBroker: async () => {
    try {
      await connector.logout();
    } catch {}
    localStorage.removeItem('ty_activeBroker');
    set({
      activeBroker: null,
      brokerStatus: 'disconnected',
      brokerProfile: null,
      feedConnected: false,
      lastError: null,
    });
  },

  refreshStatus: async () => {
    try {
      const status = await connector.getStatus();
      const active = status.active;
      if (active && status.brokers?.[active]) {
        const b = status.brokers[active];
        set({
          activeBroker: active,
          brokerStatus: b.loggedIn ? 'connected' : 'disconnected',
          feedConnected: b.feedConnected || false,
        });
      }
    } catch {
      set({ brokerStatus: 'disconnected', feedConnected: false });
    }
  },

  refreshFunds: async () => {
    try {
      const result = await connector.getFunds();
      if (result?.data) {
        set(state => ({
          brokerProfile: { ...state.brokerProfile, funds: result.data },
        }));
      }
    } catch {}
  },

  // Expose connector for direct use
  connector,
}));

export default useBrokerStore;
