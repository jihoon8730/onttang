import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export type User = { id: number; nickname: string };

type AuthState = {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  login: async (token, user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ token: null, user: null });
  },
  hydrate: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    set({
      token,
      user: userJson ? JSON.parse(userJson) : null,
      hydrated: true,
    });
  },
}));
