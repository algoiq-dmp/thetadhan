import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      clientId: null,
      clientName: null,
      broker: null,
      funds: null,
      setAuth: (data) => set({ 
        token: data.accessToken, 
        clientId: data.clientId,
        clientName: data.clientName,
        broker: data.broker 
      }),
      setFunds: (funds) => set({ funds }),
      logout: () => set({ token: null, clientId: null, clientName: null, funds: null, broker: null }),
    }),
    {
      name: 'thetadhan-auth',
    }
  )
);
